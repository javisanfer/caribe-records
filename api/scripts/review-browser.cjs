// La prueba crea su base y sus procesos en el runner desechable de CI.
const { MongoClient } = require("mongodb");
const { spawn } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { once } = require("node:events");
const { resolve } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { checkPersistence } = require("./review-persistence");
const launch = require("../src/data/launch-content.json");

async function main() {
  if (process.env.GITHUB_ACTIONS !== "true") throw new Error("Esta prueba usa el servicio MongoDB desechable de GitHub Actions.");
  const { chromium, firefox, webkit } = require("playwright");
  const root = resolve(__dirname, "../..");
  const base = "http://127.0.0.1:5185";
  const api = "http://127.0.0.1:3015";
  const dbUrl = "mongodb://127.0.0.1:27017/qa_" + randomUUID().replaceAll("-", "");
  const db = new MongoClient(dbUrl);
  const email = "qa@example.invalid", password = randomUUID();
  const children = [];
  const run = (file, args, cwd, extra) => {
    const child = spawn(process.execPath, [file, ...args], { cwd, env: { ...process.env, ...extra }, stdio: "inherit" });
    children.push(child);
  };
  const ready = async (url) => {
    for (let i = 0; i < 80; i++) {
      if (children.some((p) => p.exitCode !== null)) throw new Error("El proceso de prueba se ha detenido");
      if (await fetch(url).then((r) => r.ok).catch(() => false)) return;
      await delay(250);
    }
    throw new Error("No ha arrancado el servicio local");
  };
  try {
    await db.connect();
    await db.db().collection("artists").insertMany(launch.artists.map((a) => ({ ...a })));
    await db.db().collection("users").insertOne({ name: "QA", email, password: await bcrypt.hash(password, 10), role: "admin", active: true });
    run("src/app.js", [], root + "/api", { NODE_ENV: "test", PORT: "3015", HOST: "127.0.0.1", CORS_ORIGINS: base, SESSION_SECRET: randomUUID(), MONGODB_URI: dbUrl, LOCAL_IMAGE_UPLOADS: "true" });
    await ready(api + "/health");
    await checkPersistence(email, password);
    run("node_modules/vite/bin/vite.js", ["preview", "--host", "127.0.0.1", "--port", "5185", "--strictPort"], root + "/web", { VITE_API_PROXY: api });
    await ready(base);
    const releases = await fetch(api + "/api/v1/releases").then((r) => r.json());
    const event = await db.db().collection("events").findOne({ isActive: true });
    const article = launch.featuredEditorial.slug;
    const sitemap = await fetch(api + "/api/v1/pages/sitemap.xml").then((r) => r.text());
    assert.ok(sitemap.includes("/editorial/" + article));
    for (const [engine, driver] of Object.entries({ chromium, firefox, webkit })) {
      const browser = await driver.launch();
      try {
        const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
        await page.route("**/*", (route) => route.request().url().startsWith(base) ? route.continue() : route.abort());
        const errors = [];
        page.on("pageerror", (err) => errors.push(err.name));
        await page.goto(base + "/admin");
        await page.locator('input[type="email"]').fill(email);
        await page.locator('input[type="password"]').fill(password);
        await page.locator('button[type="submit"]').click();
        await page.getByRole("heading", { name: "Panel", exact: true }).waitFor();
        const paths = ["/", "/artistas", "/artistas/ferrocentro-club", "/editoriales", "/editorial/" + article,
          "/eventos", "/eventos/" + event.slug, "/releases", "/releases/" + releases[0]._id, "/about",
          "/admin", "/admin/new-artist", "/admin/new-release", "/admin/new-editorial", "/admin/new-event", "/admin/new-banner", "/admin/about"];
        for (const width of [375, 1280]) {
          await page.setViewportSize({ width, height: 850 });
          for (const path of paths) {
            await page.goto(base + path);
            await page.locator("h1").first().waitFor({ state: "attached" });
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
            assert.equal(overflow, false, engine + " " + width + " " + path);
          }
        }
        await page.getByLabel("Título", { exact: true }).fill("Música independiente · QA");
        await page.getByRole("button", { name: "Guardar cambios" }).click();
        await page.getByText("Cambios guardados en About.").waitFor();
        await page.goto(base + "/about");
        await page.getByRole("heading", { name: /Música independiente · QA/ }).waitFor();
        await page.goto(base + "/admin/new-banner");
        await page.locator('[name="title"]').fill("Banner QA " + engine);
        await page.locator('input[type="file"]').setInputFiles(root + "/web/public/favicon.png");
        await page.getByRole("checkbox", { name: "Banner activo" }).check();
        await page.getByRole("button", { name: "Guardar banner" }).click();
        await page.getByRole("heading", { name: "Panel", exact: true }).waitFor();
        await page.goto(base);
        await page.getByRole("dialog").getByText("Banner QA " + engine).waitFor();
        await page.getByRole("button", { name: "Cerrar anuncio" }).click();
        // Solo se retira el anuncio temporal creado en esta iteración.
        await db.db().collection("banners").deleteOne({ title: "Banner QA " + engine });
        assert.deepEqual(errors, []);
        console.log(engine, "OK: 17 rutas a 375 y 1280 px, About y banner con archivo");
      } finally { await browser.close(); }
    }
  } finally {
    await Promise.all(children.filter((p) => p.exitCode === null && !p.signalCode).map((p) => {
      const closed = once(p, "exit"); p.kill(); return closed;
    }));
    await db.close();
  }
}
main().catch((err) => { console.error(err.message); process.exitCode = 1; });
