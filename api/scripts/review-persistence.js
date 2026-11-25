// Invoked by the loopback review launcher with its disposable admin account.
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

async function checkPersistence(email, password) {
  const api = "http://127.0.0.1:3015/api/v1";
  const session = await fetch(api + "/sessions", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
  });
  assert.equal(session.status, 201, "Acceso al panel de revisión");
  const cookie = session.headers.getSetCookie()[0].split(";")[0];
  const fixtures = [];
  async function request(path, method = "GET", payload) {
    const response = await fetch(api + path, {
      method, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(method + " " + path + " · HTTP " + response.status + " · " + await response.text());
    return response.status === 204 ? null : response.json();
  }
  async function create(resource, body, bySlug = false) {
    const doc = await request("/admin/" + resource, "POST", body);
    const path = "/admin/" + resource + (bySlug ? "/slug/" + doc.slug : "/" + doc._id);
    fixtures.push(path);
    return { doc, path };
  }
  const title = "Prueba local " + randomUUID();
  const image = "/images/editorial/aeronave-en-gira.jpeg";
  try {
    const artist = await create("artists", { name: title, genres: ["Pop"] }, true);
    await request(artist.path, "PATCH", {
      genres: ["Noise pop"], links: [{ group: "web", label: "Archivo", url: "https://example.org" }],
      gallery: [{ url: image, alt: "Archivo" }],
    });
    const profile = await request("/artists/slug/" + artist.doc.slug);
    assert.deepEqual(profile.genres, ["Noise pop"]);
    assert.equal(profile.gallery[0].url, image);
    assert.equal(profile.links[0].label, "Archivo");

    const release = await create("releases", { title, artist: artist.doc._id, format: "single", cover: { url: image } });
    await request(release.path, "PATCH", { appleMusicUrl: "https://music.apple.com/es/", tracklist: [{ position: 2, title: "Tema" }] });
    const catalogue = await request("/releases/" + release.doc._id);
    assert.equal(catalogue.tracklist[0].position, 2);
    assert.equal(catalogue.appleMusicUrl, "https://music.apple.com/es/");

    const article = await create("editorials", {
      title, heroUrl: image, status: "published", credits: [{ role: "Autor", name: "Autor de prueba" }],
      blocks: [{ type: "heading", text: "Prueba", level: 3 }, { type: "gallery", gallery: [{ url: image }] }],
      relatedArtists: [artist.doc._id],
    }, true);
    await request(article.path, "PATCH", { subtitle: "Edición de prueba" });
    const reading = await request("/editorials/slug/" + article.doc.slug);
    assert.equal(reading.relatedArtists[0]._id, artist.doc._id);
    assert.equal(reading.blocks[1].gallery[0].url, image);
    assert.equal(reading.credits[0].name, "Autor de prueba");

    const event = await create("events", {
      title, venue: "Sala de prueba", city: "Madrid", date: new Date().toISOString(), lineup: [artist.doc._id],
    }, true);
    await request(event.path, "PATCH", { sourceUrl: "https://example.org/cartel" });
    const live = await request("/events/slug/" + event.doc.slug);
    assert.equal(live.sourceUrl, "https://example.org/cartel");
    assert.equal(live.lineup[0]._id, artist.doc._id);

    const banner = await create("banners", { title, active: false });
    await request(banner.path, "PATCH", { title, imageUrl: image, active: false, message: "Aviso de prueba" });
    const saved = await request(banner.path);
    assert.equal(saved.message, "Aviso de prueba");
    assert.equal(saved.imageUrl, image);
    console.log("MongoDB de revisión: altas, ediciones y relecturas correctas en las cinco secciones.");
  } finally {
    for (const path of fixtures.reverse()) {
      await request(path, "DELETE");
    }
    await request("/sessions", "DELETE");
  }
}

module.exports = { checkPersistence };
