const mongoose = require("mongoose");
require("dotenv").config();

const sourceUri = process.env.QA_SOURCE_MONGODB_URI || "mongodb://127.0.0.1:27017/caribe_records";
const targetUri = process.env.QA_MONGODB_URI || "mongodb://127.0.0.1:27017/caribe_records_test";

function databaseName(uri) {
  const name = new URL(uri).pathname.slice(1);
  if (!name) throw new Error("La URI debe incluir el nombre de la base de datos.");
  return name;
}

function assertSafeTestTarget(source, target) {
  const sourceName = databaseName(source);
  const targetName = databaseName(target);

  if (!targetName.endsWith("_test") || sourceName === targetName) {
    throw new Error("La base de destino debe terminar en _test y ser distinta del origen.");
  }

  return { sourceName, targetName };
}

async function resetTestDatabase(source = sourceUri, target = targetUri) {
  const { sourceName, targetName } = assertSafeTestTarget(source, target);
  const connectionOptions = { serverSelectionTimeoutMS: 5000 };
  let sourceConnection;
  let targetConnection;

  try {
    sourceConnection = mongoose.createConnection(source, connectionOptions);
    await sourceConnection.asPromise();

    targetConnection = mongoose.createConnection(target, connectionOptions);
    await targetConnection.asPromise();

    const sourceCollections = (await sourceConnection.db.listCollections().toArray())
      .map(({ name }) => name)
      .filter((name) => name !== "sessions" && !name.startsWith("system."));
    const targetCollections = (await targetConnection.db.listCollections().toArray())
      .map(({ name }) => name)
      .filter((name) => name !== "sessions" && !name.startsWith("system."));

    for (const name of targetCollections) {
      await targetConnection.db.collection(name).drop();
    }

    const copied = {};
    for (const name of sourceCollections) {
      const documents = await sourceConnection.db.collection(name).find({}).toArray();
      if (documents.length) await targetConnection.db.collection(name).insertMany(documents);
      copied[name] = documents.length;
    }

    console.log(JSON.stringify({ source: sourceName, target: targetName, copied }, null, 2));
  } finally {
    await Promise.all(
      [sourceConnection, targetConnection]
        .filter(Boolean)
        .map((connection) => connection.close().catch(() => undefined)),
    );
  }
}

if (require.main === module) {
  resetTestDatabase().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { assertSafeTestTarget, databaseName, resetTestDatabase };
