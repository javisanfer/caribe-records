// Local-only preview. Run from any directory with Node 24.
const { MongoClient } = require("mongodb");
const { randomBytes } = require("node:crypto");
const { spawn } = require("node:child_process");
const { join, resolve } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");
const { createServer } = require("node:net");
const bcrypt = require("bcryptjs");
const localPassword = require("./local-password");
const { checkPersistence } = require("./review-persistence");
const launch = require("../src/data/launch-content.json");

const api = resolve(__dirname, "..");
const web = resolve(api, "../web");
const mongo = "mongodb://127.0.0.1:27017";
const database = "caribe_web_review_20261125";
const url = "http://127.0.0.1:5185";
const apiUrl = "http://127.0.0.1:3015";
const email = "revision@caribe.local";
const children = new Set();
let stopping = false;

function stop(code) {
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
}

function start(file, args, cwd, env) {
  const child = spawn(process.execPath, [file, ...args], { cwd, env, stdio: "inherit" });
  children.add(child);
  child.once("error", (error) => { console.error(error.message); stop(1); });
  child.once("exit", (code) => {
    children.delete(child);
    if (!stopping) stop(code || 0);
  });
}

async function seed(db, source) {
  const state = db.collection("local_review");
  const marker = await state.findOne({ _id: "caribe-web-review" });
  if (marker?.ready) return;
  if (!marker && (await db.listCollections({}, { nameOnly: true }).toArray()).length) {
    throw new Error("La base de revisión ya existe y tiene otro origen.");
  }
  for (const { slug } of launch.artists) {
    if (!await source.collection("artists").findOne({ slug })) throw new Error("Falta el artista " + slug + " en la base local caribe_records.");
  }
  await state.updateOne({ _id: "caribe-web-review" }, { $setOnInsert: { ready: false } }, { upsert: true });
  for (const name of ["artists", "releases", "events", "editorials", "banners", "labels", "app_migrations"]) {
    const collection = db.collection(name);
    for await (const doc of source.collection(name).find()) {
      await collection.updateOne({ _id: doc._id }, { $setOnInsert: doc }, { upsert: true });
    }
  }
  // An older local dataset predates these two officially published profiles.
  // Apply the launch snapshot only while building the isolated review copy.
  if (!await db.collection("app_migrations").findOne({ _id: "launch-content-2026-11" })) {
    for (const { slug, ...profile } of launch.artists) {
      await db.collection("artists").updateOne({ slug }, { $set: profile });
    }
  }
  await state.updateOne({ _id: "caribe-web-review" }, { $set: { ready: true } });
}

async function checkPort(port) {
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(port, "127.0.0.1", () => probe.close(resolve));
  });
}

async function main() {
  await Promise.all([checkPort(3015), checkPort(5185)]);
  const client = new MongoClient(mongo, { serverSelectionTimeoutMS: 3000 });
  const password = await localPassword();
  try {
    await client.connect();
    const db = client.db(database);
    await seed(db, client.db("caribe_records"));
    await db.collection("users").updateOne({ email }, { $set: {
      email, name: "Revisión local", password: await bcrypt.hash(password, 10), active: true, role: "admin",
    } }, { upsert: true });
  } finally { await client.close(); }

  const env = {
    ...process.env, NODE_ENV: "development", PORT: "3015", HOST: "127.0.0.1",
    MONGODB_URI: mongo + "/" + database, LOCAL_IMAGE_UPLOADS: "true",
    SESSION_SECRET: randomBytes(32).toString("hex"), SESSION_COOKIE_NAME: "caribe.review.sid",
    SESSION_SECURE: "false", CORS_ORIGINS: [url, "http://localhost:5185"].join(","), RESEND_API_KEY: "", APP_URL: url,
    VITE_API_BASE: "/api/v1", VITE_API_PROXY: apiUrl,
  };
  start(join(api, "src/app.js"), [], api, env);
  let ready = false;
  for (let attempt = 0; attempt < 80 && !stopping; attempt++) {
    try { ready = (await fetch(apiUrl + "/health")).ok; } catch { /* API still starting */ }
    if (ready) break;
    await delay(250);
  }
  if (!ready || stopping) throw new Error("No se pudo arrancar la API de revisión en el puerto 3015.");
  try {
    await checkPersistence(email, password);
  } catch (error) {
    console.error("Comprobación de persistencia pendiente:", error.message);
  }
  start(join(web, "node_modules/vite/bin/vite.js"), ["--host", "127.0.0.1", "--port", "5185", "--strictPort"], web, env);
  console.log("\nRevisión local:", url, "\nPanel:", url + "/admin/login", "\nUsuario:", email);
}

process.once("SIGINT", () => stop(0));
process.once("SIGTERM", () => stop(0));
main().catch((error) => { console.error("Revisión local:", error.message); stop(1); });
