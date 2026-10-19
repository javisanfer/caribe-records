// Corrección editorial aprobada. No elimina documentos ni relaciones.
// El marcador solo se escribe al completar todas las operaciones; los reintentos
// y arranques concurrentes son seguros porque las actualizaciones son idempotentes.
async function migrateCatalogue(db) {
  const id = "catalogue-2026-10-roster";
  const migrations = db.collection("app_migrations");
  if (await migrations.findOne({ _id: id })) return;

  const artists = db.collection("artists");
  const releases = db.collection("releases");
  const targets = await artists.find({
    name: { $in: [/^d\.trillo$/i, /^mi amigo mac$/i, /^dededede$/i] },
  }).toArray();

  for (const artist of targets) {
    await artists.updateOne({ _id: artist._id }, { $set: { rosterVisible: false } });
    const excluded = artist.name.toLowerCase() === "d.trillo";
    await releases.updateMany(
      { $or: [{ artist: artist._id }, { artistName: artist.name }] },
      { $set: excluded
        ? { catalogVisible: false }
        : { catalogVisible: true, catalogType: "distribution" } },
    );
  }
  await migrations.updateOne({ _id: id }, { $set: { completedAt: new Date() } }, { upsert: true });
}

module.exports = { migrateCatalogue };
