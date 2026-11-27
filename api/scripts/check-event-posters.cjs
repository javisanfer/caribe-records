const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

async function checkEventPosters(page, base, root, expect) {
  const headers = { Origin: base };
  const upload = await page.request.post(base + "/api/v1/upload", { headers, multipart: {
    image: { name: "cartel.png", mimeType: "image/png", buffer: readFileSync(root + "/web/public/favicon.png") },
  } });
  assert.equal(upload.status(), 200);
  const { imageUrl } = await upload.json();
  const collection = base + "/api/v1/admin/events";
  const created = [];
  try {
    for (const [year, posterUrl] of [[2002, imageUrl], [2001, "/favicon.png"]]) {
      const result = await page.request.post(collection, { headers, data: {
        title: "Cartel QA " + year, date: year + "-03-21", venue: "Sala QA", city: "Madrid",
        artistName: "Prueba de carteles", posterUrl, sourceUrl: "https://example.org/cartel",
      } });
      assert.equal(result.status(), 201);
      created.push((await result.json()).slug);
    }
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto(base + "/eventos");
      const year = page.locator(".event-year").filter({ has: page.locator("summary", { hasText: "2002" }) });
      const summary = year.locator("summary");
      await summary.click();
      await page.mouse.move(0, 0);
      await expect(summary).toHaveCSS("background-color", "rgb(0, 32, 209)");
      await expect(summary).toHaveCSS("color", "rgb(255, 255, 255)");
      const trigger = year.getByRole("button", { name: "Ver cartel" });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Galería de carteles" });
      await expect(dialog.getByRole("img")).toHaveAttribute("src", imageUrl);
      await expect.poll(() => dialog.locator("img").evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
      await expect(dialog.getByRole("link", { name: /publicación original/ })).toHaveAttribute("href", "https://example.org/cartel");
      await dialog.getByRole("button", { name: "Cartel siguiente" }).click();
      await expect(dialog.getByRole("img")).toHaveAttribute("src", "/favicon.png");
      await page.keyboard.press("ArrowLeft");
      await expect(dialog.getByRole("img")).toHaveAttribute("src", imageUrl);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(summary).toHaveCSS("background-color", "rgb(0, 32, 209)");
      await summary.click();
      await page.mouse.move(0, 0);
      await expect(summary).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      if (width === 1280) {
        const label = await page.locator(".event-index__labels span").last().boundingBox();
        const ticket = await page.locator(".event-row:not(.event-row--past) .event-row__ticket a").first().boundingBox();
        assert.ok(Math.abs(label.x - ticket.x) <= 1, "La acción debe empezar bajo Entradas");
      }
    }
  } finally {
    for (const slug of created) await page.request.delete(collection + "/slug/" + slug, { headers });
  }
}

module.exports = { checkEventPosters };
