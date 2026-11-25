const express = require("express");
const Artist = require("../models/artist.model");
const Release = require("../models/release.model");
const Editorial = require("../models/editorial.model");
const Event = require("../models/event.model");

const pages = express.Router();
const origin = () => new URL(process.env.PUBLIC_SITE_ORIGIN || "https://caribe-records.com").origin;
const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const plain = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 230);
const articleVisibility = () => ({ $or: [{ status: "published" }, { status: "scheduled", publishAt: { $lte: new Date() } }] });

const types = {
  artistas: {
    model: Artist, key: "slug", visible: () => ({ rosterVisible: { $ne: false } }), fields: "name bio photos",
    meta: (x) => [x.name, x.bio, x.photos?.coverUrl || x.photos?.portraitUrl, "MusicGroup"],
  },
  editorial: {
    model: Editorial, key: "slug", visible: articleVisibility, fields: "title excerpt subtitle hero seo",
    meta: (x) => [x.seo?.title || x.title, x.seo?.description || x.excerpt || x.subtitle, x.seo?.ogImage || x.hero?.url, "Article"],
  },
  releases: {
    model: Release, key: "_id", visible: () => ({ catalogVisible: { $ne: false } }), fields: "title artistName format cover cover_image catalog",
    meta: (x) => [x.title, [x.artistName, x.format?.toUpperCase(), x.catalog, "Catálogo de Caribe Records"].filter(Boolean).join(" · "), x.cover?.url || x.cover_image, "MusicAlbum"],
  },
  eventos: {
    model: Event, key: "slug", visible: () => ({ isActive: true }), fields: "title venue city date description posterUrl",
    meta: (x) => [x.title, [x.venue, x.city, x.date?.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" }), x.description].filter(Boolean).join(" · "), x.posterUrl, "MusicEvent"],
  },
};

function renderPage({ title, description, image, type, url, missing = false }) {
  const name = escape(title + " · Caribe Records");
  const summary = plain(description) || title + " en Caribe Records.";
  let picture;
  try { picture = new URL(image || "/favicon.png", origin()); } catch { picture = new URL("/favicon.png", origin()); }
  const imageUrl = /^https?:$/.test(picture.protocol) ? picture.href : origin() + "/favicon.png";
  const schema = { "@context": "https://schema.org", "@type": type, name: title, url, description: summary, image: imageUrl };
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name}</title><meta name="description" content="${escape(summary)}">${url ? '<link rel="canonical" href="' + escape(url) + '">' : ''}
<meta property="og:title" content="${name}"><meta property="og:description" content="${escape(summary)}">${url ? '<meta property="og:url" content="' + escape(url) + '">' : ''}
<meta property="og:image" content="${escape(imageUrl)}"><meta property="og:site_name" content="Caribe Records"><meta property="og:locale" content="es_ES">
<meta property="og:type" content="${type === "Article" ? "article" : "website"}"><meta name="twitter:card" content="summary_large_image">
${missing ? '<meta name="robots" content="noindex">' : '<script id="page-schema" type="application/ld+json">' + JSON.stringify(schema).replaceAll("<", "\\u003c") + '</script>'}
<meta name="theme-color" content="#0020d1"><link rel="icon" href="/favicon.png?v=2"><link rel="stylesheet" href="/page-entry.css">
<script type="module" src="/page-entry.js"></script></head><body><div id="root"><main><h1>${escape(title)}</h1><p>${escape(summary)}</p><a href="/">Caribe Records</a></main></div></body></html>`;
}

pages.get("/sitemap.xml", async (_req, res) => {
  const paths = ["/", "/artistas", "/editoriales", "/releases", "/eventos", "/about"];
  const groups = await Promise.all(Object.entries(types).map(async ([section, spec]) => {
    const docs = await spec.model.find(spec.visible()).select(spec.key).lean();
    return docs.filter((doc) => doc[spec.key]).map((doc) => `/${section}/${encodeURIComponent(doc[spec.key])}`);
  }));
  res.type("application/xml").set("Cache-Control", "public, max-age=60").send(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    + paths.concat(...groups).map((path) => "<url><loc>" + escape(origin() + path) + "</loc></url>").join("") + "</urlset>");
});
pages.get("/:section/:key", async (req, res) => {
  const { section, key } = req.params;
  const route = Object.entries(types).find(([name]) => name === section);
  if (!route) return res.sendStatus(404);
  const [name, spec] = route;
  const valid = spec.key !== "_id" || /^[a-f\d]{24}$/i.test(key);
  const doc = valid && await spec.model.findOne({ ...spec.visible(), [spec.key]: key }).select(spec.fields + " " + spec.key).lean();
  if (!doc) return res.status(404).type("html").send(renderPage({ title: "Página no encontrada", missing: true }));
  const url = origin() + "/" + name + "/" + encodeURIComponent(doc[spec.key]);
  const [title, description, image, type] = spec.meta(doc);
  res.type("html").set("Cache-Control", "public, max-age=0, must-revalidate").send(renderPage({ title, description, image, type, url }));
});
module.exports = { pages, renderPage };
