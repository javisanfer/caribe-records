const assert = require("node:assert/strict");

async function checkArtistNavigation(browser, base) {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const artists = [
    { name: "Aeronave Adolescente", slug: "aeronave-adolescente" },
    { name: "daddy san", slug: "daddy-san" },
    { name: "ferrocentro club", slug: "ferrocentro-club" },
  ];
  try {
    await page.route("**/api/v1/artists", route => route.fulfill({ json: artists }));
    await page.route("**/api/v1/artists/slug/daddy-san", route => route.fulfill({
      json: { ...artists[1], _id: "000000000000000000000001" },
    }));
    await page.goto(base + "/artistas/daddy-san");
    await page.getByRole("button", { name: "Rechazar", exact: true }).click();
    const nav = page.getByRole("navigation", { name: "Más artistas" });
    const previous = nav.getByRole("link", { name: "Anterior Aeronave Adolescente", exact: true });
    const next = nav.getByRole("link", { name: "Siguiente ferrocentro club", exact: true });
    for (const width of [320, 375, 390, 505, 846, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      for (const [link, isPrevious] of [[previous, true], [next, false]]) {
        const box = await link.evaluate(el => {
          const name = el.querySelector(".artist-neighbour__name").getBoundingClientRect();
          const arrow = el.querySelector("[aria-hidden]").getBoundingClientRect();
          const card = el.getBoundingClientRect();
          return {
            centred: Math.abs((arrow.top + arrow.bottom - name.top - name.bottom) / 2) <= 1,
            left: arrow.right < name.left,
            right: arrow.left > name.right,
            fits: Math.min(arrow.left, name.left) >= card.left && Math.max(arrow.right, name.right) <= card.right,
          };
        });
        assert.ok(box.centred && box.fits && (isPrevious ? box.left : box.right), JSON.stringify({ width, box }));
      }
    }
    await next.click();
    await page.waitForURL("**/artistas/ferrocentro-club");
    await page.goBack();
    await previous.click();
    await page.waitForURL("**/artistas/aeronave-adolescente");
  } finally {
    await page.close();
  }
}

module.exports = { checkArtistNavigation };
