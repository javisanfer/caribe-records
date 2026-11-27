const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

async function main() {
  // Run from web/ so Vite previews the same production bundle as the public site.
  const vite = require.resolve("vite", { paths: [process.cwd()] });
  const { preview } = await import(pathToFileURL(vite));
  const server = await preview({ preview: { host: "127.0.0.1", port: 0 } });
  try {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ reducedMotion: "reduce" });
      const artist = { _id: "1", slug: "los-reels", name: "Los reels", bio: "Una biografía", bioHtml: "<p>Una <em>biografía</em></p>" };
      await page.route("**/api/v1/**", route => {
        const path = new URL(route.request().url()).pathname;
        const json = path === "/api/v1/artists" ? [artist] : path === "/api/v1/artists/slug/los-reels" ? artist : [];
        return route.fulfill({ json });
      });
      await page.goto(server.resolvedUrls.local[0] + "artistas/los-reels");
      await page.getByRole("button", { name: "Rechazar", exact: true }).click();
      await page.locator(".artist-bio-copy em").waitFor();
      const session = await page.context().newCDPSession(page);
      await session.send("DOM.enable");
      await session.send("CSS.enable");
      const { root } = await session.send("DOM.getDocument");
      const apple = process.platform === "darwin";
      for (const width of [360, 390, 846, 1440]) {
        await page.setViewportSize({ width, height: 850 });
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        for (const selector of [".cr-menu-toggle", ".artist-detail h1", ".artist-bio-copy em"]) {
          const { nodeId } = await session.send("DOM.querySelector", { nodeId: root.nodeId, selector });
          const { fonts } = await session.send("CSS.getPlatformFontsForNode", { nodeId });
          const primary = fonts.sort((a, b) => b.glyphCount - a.glyphCount)[0];
          assert.ok(primary && (apple ? !primary.isCustomFont && /SF|system/i.test(primary.familyName + primary.postScriptName)
            : primary.isCustomFont && /Inter/.test(primary.familyName)), JSON.stringify({ width, selector, fonts }));
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Overflow at ' + width);
      }
    } finally {
      await browser.close();
    }
  } finally {
    await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
