const test = require("node:test");
const assert = require("node:assert/strict");
const Artist = require("../src/models/artist.model");
const Editorial = require("../src/models/editorial.model");
const { updateEditorial } = require("../src/controllers/editorial.controller");
const { migratePublicationSettings } = require("../src/migrations/launch-content-2026-11");

test("editar un perfil conserva los enlaces históricos y admite plataformas nuevas", async () => {
  const { artistLinks, serializeLinks } = await import("../../web/src/utils/artist-links.js");
  const initial = {
    name: "Grupo", social: { instagram: "https://example.com/grupo" },
    streaming: { appleMusic: "https://music.apple.com/es/artist/grupo" },
    web: { pressKit: "https://example.com/kit" },
  };
  const rows = artistLinks(initial).filter((row) => row.group !== "social");
  rows.push({ group: "web", label: "Archivo del grupo", url: "https://example.com/archivo" });
  const updated = new Artist({ ...initial, ...serializeLinks(rows), gallery: [{ url: "/images/foto.jpg", alt: "Ensayo" }] });
  await updated.validate();
  assert.deepEqual(artistLinks(updated.toObject()), rows);
  assert.equal(updated.gallery[0].alt, "Ensayo");
  assert.deepEqual(artistLinks(serializeLinks([])), []);
});

test("editar otro campo conserva el orden de los bloques, créditos y relaciones de un artículo", async (t) => {
  const artist = new Artist({ name: "Artista" });
  const blocks = [
    { type: "heading", level: 3, text: "En gira" },
    { type: "embed", embed: "https://open.spotify.com/embed/album/ejemplo" },
    { type: "gallery", gallery: [{ url: "/images/archivo.jpg", caption: "Prueba de sonido", width: 1280, focalPoint: { x: 0.5, y: 0.2 } }] },
    { type: "embed", embed: "https://www.youtube.com/embed/ejemplo" },
  ];
  const doc = new Editorial({
    title: "Archivo", slug: "archivo", status: "published", featured: true,
    hero: { url: "/images/portada.jpg" }, blocks, relatedArtists: [artist._id], relatedReleases: [new Artist()._id],
    credits: [{ role: "Autor", name: "Firma" }],
  });
  t.mock.method(Editorial, "findOne", async () => doc);
  t.mock.method(doc, "save", async () => doc.validate());
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; } };
  await updateEditorial({ params: { slug: "archivo" }, body: { subtitle: "Nuevo subtítulo", blocks: JSON.stringify(blocks), relatedReleases: String(doc.relatedReleases[0]), relatedArtists: String(artist._id) } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(doc.blocks.map((block) => block.type), ["heading", "embed", "gallery", "embed"]);
  assert.equal(doc.blocks[0].level, 3);
  assert.equal(doc.blocks[2].gallery[0].width, 1280);
  assert.equal(doc.blocks[2].gallery[0].focalPoint.y, 0.2);
  assert.equal(doc.blocks[3].embed, blocks[3].embed);
  assert.equal(doc.credits[0].name, "Firma");
  assert.equal(doc.relatedReleases.length, 1);
  assert.ok(artist._id.equals(doc.relatedArtists[0]));
  assert.equal(doc.featured, true);
  await updateEditorial({ params: { slug: "archivo" }, body: { blocks: "{incompleto" } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(doc.blocks.length, 4);
});

test("retirar el destacado solo toca la marca de portada y se ejecuta una vez", async () => {
  const updates = [];
  let applied = false;
  const db = { collection(name) {
    if (name === "app_migrations") return {
      findOne: async () => applied, updateOne: async () => { applied = true; },
    };
    if (name === "events") return { updateMany: async () => {} };
    return { updateOne: async (...args) => updates.push(args) };
  } };
  await migratePublicationSettings(db);
  await migratePublicationSettings(db);
  assert.deepEqual(updates, [[
    { slug: "sin-destino-concreto-solo-hacia-delante", featured: true },
    { $set: { featured: false } },
  ]]);
});
