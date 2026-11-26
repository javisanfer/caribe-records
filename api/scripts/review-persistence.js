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
    const listenUrl = "https://listen.example.org/disco";
    await request(release.path, "PATCH", { listenUrl });
    assert.equal((await request("/releases/" + release.doc._id)).listenUrl, listenUrl);
    await assert.rejects(request(release.path, "PATCH", { listenUrl: "mailto:label@example.org" }), /HTTP 400/);
    await request(release.path, "PATCH", { listenUrl: "" });
    const clearedRelease = await request("/releases/" + release.doc._id);
    assert.equal(clearedRelease.listenUrl, "");
    assert.equal(clearedRelease.appleMusicUrl, catalogue.appleMusicUrl);


    const article = await create("editorials", {
      title, heroUrl: image, status: "published", credits: [{ role: "Autor", name: "Autor de prueba" }],
      blocks: [{ type: "heading", text: "Prueba", level: 3 }, { type: "gallery", gallery: [{ url: image }] }],
      relatedArtists: [artist.doc._id], relatedReleases: [release.doc._id],
    }, true);
    await request(article.path, "PATCH", { subtitle: "Edición de prueba" });
    const reading = await request("/editorials/slug/" + article.doc.slug);
    assert.equal(reading.relatedArtists[0]._id, artist.doc._id);
    assert.deepEqual(reading.relatedReleases, [release.doc._id]);
    const otherArtist = await create("artists", { name: title + " B" }, true);
    await assert.rejects(request(article.path, "PATCH", { relatedArtists: [otherArtist.doc._id] }), /HTTP 400/);
    await assert.rejects(request("/admin/editorials", "POST", {
      title: title + " B", relatedArtists: [otherArtist.doc._id], relatedReleases: [release.doc._id],
    }), /HTTP 400/);
    const original = await request(article.path);
    assert.deepEqual(original.relatedArtists, [artist.doc._id]);
    assert.deepEqual(original.relatedReleases, [release.doc._id]);
    assert.equal(reading.blocks[1].gallery[0].url, image);
    assert.equal(reading.credits[0].name, "Autor de prueba");

    const collaboration = await create("releases", {
      title: title + " Dúo", format: "single", artist: artist.doc._id,
      collaborators: [otherArtist.doc._id, artist.doc._id, otherArtist.doc._id],
    });
    const creditedIds = () => request(collaboration.path).then((record) => record.collaborators.map((person) => person._id));
    assert.deepEqual(await creditedIds(), [otherArtist.doc._id]);
    for (const person of [artist.doc, otherArtist.doc]) {
      assert.ok((await request("/releases?artist=" + person._id)).some((item) => item._id === collaboration.doc._id));
      assert.ok((await request("/artists/slug/" + person.slug)).albums.some((item) => item._id === collaboration.doc._id));
    }
    await request(collaboration.path, "PATCH", { country: "ES" });
    assert.deepEqual(await creditedIds(), [otherArtist.doc._id]);
    await assert.rejects(request(collaboration.path, "PATCH", { collaborators: ["unknown"] }), /HTTP 400/);
    assert.deepEqual(await creditedIds(), [otherArtist.doc._id]);
    await request(collaboration.path, "PATCH", { artist: otherArtist.doc._id, collaborators: [] });
    assert.deepEqual(await creditedIds(), []);
    assert.ok(!(await request("/releases?artist=" + artist.doc._id)).some((item) => item._id === collaboration.doc._id));

    const newer = await create("editorials", {
      title: title + " [segunda]", heroUrl: image, status: "published", blocks: [{ type: "paragraph", text: "Texto" }],
    }, true);
    const draft = await create("editorials", { title: title + " borrador", status: "draft" }, true);
    const initial = await request("/admin/home-carousel");
    const order = [newer.doc._id, article.doc._id];
    const saveCarousel = (version, entries) => request("/admin/home-carousel", "PUT", { version, entries });
    const firstSave = await saveCarousel(initial.version, order);
    assert.deepEqual((await request("/home-carousel")).map((x) => x._id), order);
    await assert.rejects(saveCarousel(initial.version, []), /HTTP 409/);
    await assert.rejects(saveCarousel(firstSave.version, [draft.doc._id]), /HTTP 400/);
    await assert.rejects(saveCarousel(firstSave.version, [article.doc._id, article.doc._id]), /HTTP 400/);
    const second = await saveCarousel(firstSave.version, order.slice().reverse());
    assert.deepEqual((await request("/home-carousel")).map((x) => x._id), order.slice().reverse());
    await request(newer.path, "PATCH", { status: "draft" });
    assert.deepEqual((await request("/home-carousel")).map((x) => x._id), [article.doc._id]);
    const cleared = await saveCarousel(second.version, []);
    assert.deepEqual(await request("/home-carousel"), []);
    await saveCarousel(cleared.version, initial.entries);

    const search = "/admin/activity?type=editorial&q=" + encodeURIComponent(title);
    const ascending = await request(search + "&order=oldest");
    const descending = await request(search + "&order=newest");
    assert.equal(ascending.total, 3);
    assert.deepEqual(ascending.data.map((x) => x.id), descending.data.map((x) => x.id).reverse());
    const literal = await request("/admin/activity?q=" + encodeURIComponent(title + " [segunda]"));
    assert.deepEqual(literal.data.map((x) => x.id), [newer.doc._id]);

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
