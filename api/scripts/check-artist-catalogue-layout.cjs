const assert = require("node:assert/strict");

async function checkArtistCatalogueLayout(browser, base) {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  try {
    const records = [
      { _id: "1", title: "Espada EP", release_date: "2026-01-01", cover: { url: "/favicon.png" } },
      { _id: "2", title: "Otro lanzamiento del mismo año", release_date: "2026-02-01" },
      { _id: "3", title: "Un disco anterior", release_date: "2025-03-01", cover: { url: "/favicon.png" } },
    ];
    let count;
    await page.route("**/api/v1/releases?artist=*", route => route.fulfill({ json: records.slice(0, count) }));
    for (count of [1, records.length]) {
      await page.goto(base + "/artistas/ferrocentro-club");
      await page.getByRole("button", { name: /Catálogo/ }).click();
      const rows = page.locator(".artist-release");
      assert.equal(await rows.count(), count);
      for (const [width, height] of [[320, 568], [505, 1293], [760, 1024], [844, 390], [846, 1293], [1440, 900]]) {
        await page.setViewportSize({ width, height });
        const boxes = await rows.evaluateAll(items => items.map(item => {
          const art = item.querySelector("img, .artist-release__placeholder").getBoundingClientRect();
          return { width: art.width, height: art.height, rowWidth: item.getBoundingClientRect().width };
        }));
        for (const box of boxes) {
          assert.ok(box.width > 0 && Math.abs(box.width - box.height) <= 1, JSON.stringify({ width, height, box }));
          if (count === 1 && width <= 760 && width <= height) assert.ok(Math.abs(box.width - box.rowWidth) <= 1);
        }
      }
    }
  } finally {
    await page.close();
  }
}

module.exports = { checkArtistCatalogueLayout };
