// Issue credentials for the development panel on port 5173.
const { MongoClient } = require("mongodb");
const localPassword = require("./local-password");
const bcrypt = require("bcryptjs");

async function main() {
  const client = new MongoClient("mongodb://127.0.0.1:27017/caribe_records", {
    serverSelectionTimeoutMS: 3000,
  });
  const email = "desarrollo-5173@caribe.local";
  const password = await localPassword();
  try {
    await client.connect();
    const users = client.db("caribe_records").collection("users");
    const existing = await users.findOne({ email }, { projection: { localDevelopmentAccount: 1 } });
    if (existing && existing.localDevelopmentAccount !== true) {
      throw new Error("Ese correo ya pertenece a otra cuenta local.");
    }
    const now = new Date();
    await users.updateOne({ email, localDevelopmentAccount: true }, {
      $set: { password: await bcrypt.hash(password, 10), active: true, role: "admin", updatedAt: now },
      $setOnInsert: { name: "Desarrollo local", createdAt: now },
    }, { upsert: true });
    console.log("http://localhost:5173/admin/login\nUsuario:", email);
  } finally {
    await client.close();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
