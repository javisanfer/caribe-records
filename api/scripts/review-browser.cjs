// La prueba crea su base y sus procesos en el runner desechable de CI.
const { MongoClient } = require("mongodb");
const { spawn } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { once } = require("node:events");
const { resolve } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { readFileSync } = require("node:fs");
const { gzipSync } = require("node:zlib");
const { checkEventPosters } = require("./check-event-posters.cjs");
const { checkCatalogueTouch } = require("./check-catalogue-touch.cjs");
const { checkPersistence } = require("./review-persistence");
const launch = require("../src/data/launch-content.json");

async function main() {
  if (process.env.GITHUB_ACTIONS !== "true") throw new Error("Esta prueba usa el servicio MongoDB desechable de GitHub Actions.");
  const { chromium, firefox, webkit } = require("playwright");
  const { expect } = require("playwright/test");
  const root = resolve(__dirname, "../..");
  const dist = root + "/web/dist";
  const html = readFileSync(dist + "/index.html", "utf8");
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(js|css))"/g)) {
    const asset = readFileSync(dist + match[1]);
    console.log("Entrada del build", match[2], asset.length, "bytes;", gzipSync(asset, { level: 6 }).length, "bytes gzip nivel 6");
  }
  const base = "http://127.0.0.1:5185";
  const api = "http://127.0.0.1:3015";
  const dbUrl = "mongodb://127.0.0.1:27017/qa_" + randomUUID().replaceAll("-", "");
  const db = new MongoClient(dbUrl);
  const email = "qa@example.invalid", password = randomUUID();
  const children = [];
  const run = (file, args, cwd, extra) => {
    const child = spawn(process.execPath, [file, ...args], { cwd, env: { ...process.env, ...extra }, stdio: "inherit" });
    children.push(child);
    return child;
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
    await db.db().collection("artists").insertMany(launch.artists.map((a) => ({ name: a.slug.replaceAll("-", " "), ...a })));
    await db.db().collection("users").insertOne({ name: "QA", email, password: await bcrypt.hash(password, 10), role: "admin", active: true });
    const apiEnv = { NODE_ENV: "test", PORT: "3015", HOST: "127.0.0.1", CORS_ORIGINS: base,
      SESSION_SECRET: randomUUID(), MONGODB_URI: dbUrl, LOCAL_IMAGE_UPLOADS: "true" };
    const startApi = async () => {
      const process = run("src/app.js", [], root + "/api", apiEnv);
      await ready(api + "/health");
      return process;
    };
    const stopApi = async (process) => {
      const closed = once(process, "exit");
      process.kill();
      await closed;
      children.splice(children.indexOf(process), 1);
    };
    const persistenceApi = await startApi();
    await checkPersistence(email, password);
    await stopApi(persistenceApi);
    let browserApi = await startApi();
    run("node_modules/vite/bin/vite.js", ["preview", "--host", "127.0.0.1", "--port", "5185", "--strictPort"], root + "/web", { VITE_API_PROXY: api });
    await ready(base);
    const releases = await fetch(api + "/api/v1/releases").then((r) => r.json());
    const event = await db.db().collection("events").findOne({ isActive: true }, { projection: { _id: 0 } });
    // Keep an upcoming row available after the last concert in the archive fixture.
    await db.db().collection("events").insertOne({
      ...event, slug: "concierto-futuro-qa", date: new Date(Date.now() + 7 * 86400000),
      ticketUrl: "https://example.org/entradas",
    });
    const article = launch.featuredEditorial.slug;
    const sitemap = await fetch(api + "/api/v1/pages/sitemap.xml").then((r) => r.text());
    assert.ok(sitemap.includes("/editorial/" + article));
    const layoutFailures = [];
    for (const [engine, driver] of Object.entries({ chromium, firefox, webkit })) {
      if (!browserApi) browserApi = await startApi();
      const browser = await driver.launch();
      try {
        const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
        await page.route("**/*", (route) => route.request().url().startsWith(base) ? route.continue() : route.abort());
        const errors = [];
        page.on("pageerror", (err) => errors.push(err.name));
        await page.goto(base + "/admin");
        page.setDefaultTimeout(12000);
        await page.locator('input[type="email"]').fill(email);
        await page.locator('input[type="password"]').fill(password);
        await page.locator('button[type="submit"]').click();
        await page.getByRole("heading", { name: "Panel", exact: true }).waitFor();
        const paths = ["/", "/artistas", "/artistas/ferrocentro-club", "/editoriales", "/editorial/" + article,
          "/eventos", "/eventos/" + event.slug, "/releases", "/releases/" + releases[0]._id, "/about",
          "/admin", "/admin/new-artist", "/admin/new-release", "/admin/new-editorial", "/admin/new-event", "/admin/new-banner", "/admin/portada", "/admin/about"];
        for (const width of [375, 1280]) {
          await page.setViewportSize({ width, height: 850 });
          for (const path of paths) {
            console.log(engine, width, path);
            await page.goto(base + path);
            await page.locator("h1").first().waitFor({ state: "attached" });
            if (path.startsWith("/admin/")) await page.getByRole("link", { name: "Volver al panel" }).waitFor();
            if (path === "/") await page.getByRole("link", { name: "Panel", exact: true }).waitFor();
            if (path === "/admin" && width === 1280) {
              for (const card of await page.locator(".admin-create__grid a").all()) {
                await expect(card.locator("span")).toHaveCSS("color", "rgb(0, 32, 209)");
                await expect(card.locator("b")).toHaveCSS("color", "rgb(0, 32, 209)");
              }
              const artistCard = page.getByRole("link", { name: "Artista", exact: true });
              await artistCard.hover();
              await expect(artistCard.locator("span")).toHaveCSS("color", "rgb(255, 255, 255)");
              await expect(artistCard.locator("b")).toHaveCSS("color", "rgb(255, 255, 255)");
              await page.mouse.move(0, 0);
            }
            if (path === "/eventos" && width === 1280) {
              const row = page.locator(".event-row").filter({ has: page.locator('a[href="/eventos/concierto-futuro-qa"]') });
              const year = page.locator(".event-year summary").first();
              const mouseHover = await page.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches);
              console.log(engine, "Eventos: puntero fino con hover", mouseHover);
              const background = mouseHover ? "rgb(0, 32, 209)" : "rgba(0, 0, 0, 0)";
              await year.hover();
              await expect(year).toHaveCSS("background-color", background);
              await row.locator("time").hover();
              await expect(row).toHaveCSS("background-color", background);
              await expect(row.getByRole("link", { name: /Entradas/i })).toHaveCSS("color", mouseHover ? "rgb(255, 255, 255)" : "rgb(0, 32, 209)");
              await page.mouse.move(0, 0);
              await expect(row).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
              await row.locator(".event-row__artist a").press("Tab");
              await expect(row.getByRole("link", { name: /Entradas/i })).toBeFocused();
              await expect(row).toHaveCSS("background-color", "rgb(0, 32, 209)");
            }
            if (path === "/admin/new-artist") {
              assert.equal(await page.getByRole("heading", { name: /^(Integrantes|Galería|Vídeos)$/ }).count(), 0);
            }
            if (path === "/editorial/" + article) {
              const share = page.getByRole("group", { name: "Compartir artículo" });
              const href = await share.getByRole("link", { name: "Compartir en X" }).getAttribute("href");
              const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
              assert.equal(new URL(href).searchParams.get("url"), canonical);
              await share.getByRole("button", { name: "Copiar enlace" }).waitFor();
            }
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
            if (overflow) {
              const elements = await page.evaluate(() => Array.from(document.querySelectorAll("main *"))
                .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
                .slice(0, 6).map((el) => el.tagName + "." + el.className));
              const detail = [engine, width, path, ...elements].join(" ");
              console.log("Desbordamiento", detail);
              layoutFailures.push(detail);
            }
          }
        }
        await checkEventPosters(page, base, root, expect);
        if (engine === "chromium") {
          await checkCatalogueTouch(browser, base);
          await page.goto(base + "/admin/new-editorial");
          await page.getByText("Asociaciones", { exact: true }).click();
          await page.getByText("Elige un artista para ver su catálogo.").waitFor();
          const disc = releases.find((release) => release.artist?._id);
          const artistChoice = page.getByRole("group", { name: "Artistas relacionados" })
            .getByRole("checkbox", { name: disc.artist.name, exact: true });
          await artistChoice.check();
          const linked = page.getByRole("group", { name: "Lanzamientos relacionados" });
          await linked.getByRole("checkbox", { name: disc.title, exact: true }).check();
          const catalogue = await (await page.request.get(base + "/api/v1/admin/releases")).json();
          assert.equal(await linked.getByRole("checkbox").count(),
            catalogue.filter((row) => row.artist?._id === disc.artist._id).length);
          await artistChoice.uncheck();
          await page.getByText("Elige un artista para ver su catálogo.").waitFor();
          await artistChoice.check();
          const releaseChoice = linked.getByRole("checkbox", { name: disc.title, exact: true });
          assert.equal(await releaseChoice.isChecked(), false);
          await releaseChoice.check();
          await page.getByLabel("Título", { exact: true }).fill("Asociaciones de catálogo QA");
          await page.getByRole("button", { name: "Guardar borrador" }).click();
          await page.getByRole("heading", { name: "Panel", exact: true }).waitFor();
          await page.goto(base + "/admin/edit-editorial/asociaciones-de-catalogo-qa");
          await page.getByText("Asociaciones", { exact: true }).click();
          await releaseChoice.waitFor();
          assert.equal(await releaseChoice.isChecked(), true);

          await page.goto(base + "/admin");
          const search = page.getByRole("searchbox", { name: "Buscar por título o nombre" });
          await search.fill("asociaciones de catálogo qa");
          await page.getByRole("link", { name: "Editar Asociaciones de catálogo QA" }).waitFor();
          await page.getByRole("combobox", { name: "Última actualización" }).selectOption("oldest");
          await page.getByRole("link", { name: "Carrusel de portada" }).click();
          await page.getByRole("heading", { name: "Carrusel de portada" }).waitFor();

          await page.goto(base + "/admin/edit-artist/ferrocentro-club");
          const bio = page.getByRole("textbox", { name: "Biografía" });
          await bio.fill("Una biografía de prueba.");
          await bio.press("Control+a");
          await page.getByRole("button", { name: "Negrita" }).click();
          await page.getByRole("button", { name: "Actualizar artista" }).click();
          await page.getByRole("heading", { name: "Panel", exact: true }).waitFor();
          const profile = await fetch(api + "/api/v1/artists/slug/ferrocentro-club").then((r) => r.json());
          assert.equal(profile.bio, "Una biografía de prueba.");
          assert.match(profile.bioHtml, /<strong>Una biografía de prueba\.<\/strong>/);

          const edits = [
            ["artist", "ferrocentro-club", "city", "artists/slug/ferrocentro-club"],
            ["release", releases[0]._id, "country", "releases/" + releases[0]._id],
            ["event", event.slug, "venue", "events/slug/" + event.slug],
            ["editorial", article, "subtitle", "editorials/slug/" + article],
          ];
          for (const [kind, id, field, endpoint] of edits) {
            console.log("Formulario", kind);
            await page.goto(base + "/admin/edit-" + kind + "/" + id);
            const input = page.locator('[name="' + field + '"]');
            const disclosure = input.locator("xpath=ancestor::details[not(@open)][1]/summary");
            if (await disclosure.count()) await disclosure.click();
            const value = kind === "release" ? "PT" : "Revisión de " + kind;
            await input.fill(value);
            const form = input.locator("xpath=ancestor::form");
            await form.getByRole("button", { name: /^Actualizar/ }).click();
            await page.getByRole("heading", { name: "Panel", exact: true }).waitFor();
            const published = await fetch(api + "/api/v1/" + endpoint).then((r) => r.json());
            assert.equal(published[field], value, kind + " debe reflejar la edición del formulario");
          }
          await page.goto(base + "/admin/about");
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
        console.log(engine, "OK: 18 rutas a 375 y 1280 px, About y banner con archivo");
      } finally {
        await browser.close();
        await stopApi(browserApi);
        browserApi = null;
      }
    }
    assert.deepEqual(layoutFailures, [], "Desbordamientos horizontales");
  } finally {
    await Promise.all(children.filter((p) => p.exitCode === null && !p.signalCode).map((p) => {
      const closed = once(p, "exit"); p.kill(); return closed;
    }));
    await db.close();
  }
}
main().catch((err) => { console.error(err.message); process.exitCode = 1; });
