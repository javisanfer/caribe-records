const { expect } = require("playwright/test");

async function checkEditorialConsent(browser, base) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const playerUrls = [
    "https://www.youtube-nocookie.com/embed/abcdefghijk",
    "https://open.spotify.com/embed/album/albumQA",
    "https://archive.org/embed/disco-qa",
  ];
  const requested = new Set();
  try {
    await ctx.route("**/*", route => {
      const url = new URL(route.request().url());
      if (playerUrls.includes(url.href)) {
        requested.add(url.href);
        return route.fulfill({ contentType: "text/html", body: "Reproductor de prueba" });
      }
      if (url.origin !== base) return route.abort();
      if (url.pathname.startsWith("/api/v1/editorials/slug/")) {
        return route.fulfill({ json: { slug: url.pathname.split("/").pop(), title: "Artículo de prueba",
          blocks: playerUrls.map(embed => ({ type: "embed", embed })) } });
      }
      if (url.pathname.startsWith("/api/")) return route.fulfill({ json: null });
      return route.continue();
    });
    const page = await ctx.newPage();
    await page.goto(base + "/legal");
    await page.evaluate(() => localStorage.setItem("caribe.analytics.v1", JSON.stringify({ value: "yes", until: Date.now() + 3600000 })));
    await page.goto(base + "/editorial/primer-articulo");
    const frames = page.locator("iframe.editorial-player");
    const manual = page.getByRole("button", { name: /Cargar reproductor de/ });
    await expect(manual).toHaveCount(3);
    await expect(frames).toHaveCount(0);
    expect(requested.size).toBe(0);
    await page.getByRole("button", { name: "Aceptar", exact: true }).click();
    await expect(frames).toHaveCount(3);
    await expect(manual).toHaveCount(0);
    for (const frame of await frames.all()) await frame.scrollIntoViewIfNeeded();
    await expect.poll(() => requested.size).toBe(3);
    await page.goto(base + "/editorial/otro-articulo");
    await expect(frames).toHaveCount(3);
    await page.reload();
    await expect(frames).toHaveCount(3);
    const settings = await ctx.newPage();
    await settings.goto(base + "/legal");
    await settings.getByRole("button", { name: "Preferencias de cookies" }).click();
    await settings.getByRole("button", { name: "Rechazar", exact: true }).click();
    await page.bringToFront();
    await expect(manual).toHaveCount(3);
    await expect(frames).toHaveCount(0);
    await manual.first().click();
    await expect(frames).toHaveCount(1);
    await page.reload();
    await expect(manual).toHaveCount(3);
  } finally {
    await ctx.close();
  }
}
module.exports = { checkEditorialConsent };
