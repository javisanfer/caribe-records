const assert = require("node:assert/strict");

// Exercise a browser-recognised pan, which cancels the click, and a completed tap.
async function checkCatalogueTouch(browser, base) {
  const context = await browser.newContext({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 640 } });
  try {
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const destination = "https://music.example.invalid/album";
    await context.route(destination, (route) => route.fulfill({ body: "Album" }));
    await page.route("**/api/v1/releases", (route) => route.fulfill({ json: Array.from({ length: 12 }, (_, index) => ({
      _id: String(index + 1), title: "Disco " + (index + 1), bandcampUrl: destination, cover: { url: "/favicon.png" },
    })) }));
    for (const view of ["Lista", "Retícula"]) {
      await page.goto(base + "/releases");
      await page.getByRole("button", { name: view }).tap();
      const cover = page.locator(".release-cover-link").first();
      await cover.evaluate((link) => {
        link.scrollIntoView({ block: "center" });
        window.tapFeedback = false;
        new MutationObserver(() => {
          if (link.hasAttribute("data-tapped")) window.tapFeedback = true;
        }).observe(link, { attributes: true, attributeFilter: ["data-tapped"] });
      });
      const rect = await cover.boundingBox();
      const x = Math.round(rect.x + rect.width / 2);
      const y = Math.round(rect.y + rect.height / 2);
      const before = await page.evaluate(() => scrollY);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (const dy of [12, 32, 64, 96]) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - dy }] });
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForFunction((initial) => scrollY > initial, before);
      assert.equal(await page.evaluate(() => window.tapFeedback), false, view + ": deslizar activa el efecto");
      assert.equal(await cover.locator("img").evaluate((img) => getComputedStyle(img).filter), "none");
      assert.equal(context.pages().length, 1);
      const popup = page.waitForEvent("popup");
      await cover.tap();
      const opened = await popup;
      await opened.waitForURL(destination);
      assert.equal(await page.evaluate(() => window.tapFeedback), true);
      await opened.close();
      await page.waitForFunction(() => !document.querySelector(".release-cover-link[data-tapped]"));
    }
  } finally {
    await context.close();
  }
}

module.exports = { checkCatalogueTouch };
