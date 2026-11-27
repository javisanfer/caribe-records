const { expect } = require("playwright/test");

async function checkEditorialAuthoring(page, base) {
  const photo = "/images/editorial/aeronave-en-gira.jpeg";
  const title = "Galería y enlaces QA";
  await page.goto(base + "/admin/new-editorial");
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("O usar URL").fill(photo);
  const body = page.getByRole("textbox", { name: "Cuerpo del artículo" });
  await body.fill("Escucha Caribe");
  await body.press("End");
  for (let i = 0; i < "Caribe".length; i++) await body.press("Shift+ArrowLeft");
  const linkTool = page.getByRole("button", { name: "Enlace", exact: true });
  await linkTool.click();
  const address = page.getByRole("textbox", { name: "Dirección web" });
  await address.fill("sin dirección");
  await address.press("Enter");
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await address.fill("bandcamp.com");
  await address.press("Enter");
  await expect(body.getByRole("link", { name: "Caribe", exact: true })).toHaveAttribute("href", "https://bandcamp.com/");

  await page.getByText("Añadir bloque", { exact: false }).first().click();
  await page.getByRole("button", { name: "Galería", exact: true }).click();
  const gallery = page.locator(".magazine-block--gallery");
  for (const caption of ["Portada", "Contraportada"]) {
    await gallery.getByRole("button", { name: "Añadir fotografía" }).click();
    const fields = gallery.locator(".magazine-image-block").last();
    await fields.getByLabel("URL de imagen").fill(photo);
    await fields.getByLabel("Título o pie de foto").fill(caption);
    await fields.getByLabel("Crédito de imagen").fill("Foto de Caribe");
  }
  await page.getByLabel("Estado", { exact: true }).selectOption("published");
  await page.getByRole("button", { name: "Publicar editorial" }).click();
  await page.getByRole("heading", { name: "Panel", exact: true }).waitFor();
  await page.goto(base + "/editorial/galeria-y-enlaces-qa");
  const link = page.getByRole("link", { name: "Caribe", exact: true });
  await expect(link).toHaveAttribute("href", "https://bandcamp.com/");
  const figures = page.locator(".editorial-body__gallery figure");
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    await expect(figures).toHaveCount(2);
    const caption = figures.first().locator("figcaption");
    await expect(caption).toHaveText("PortadaFoto de Caribe");
    await expect(caption).toHaveCSS("text-transform", "none");
    const first = await figures.first().boundingBox();
    const second = await figures.last().boundingBox();
    if (width === 375) expect(second.y).toBeGreaterThan(first.y + first.height);
    else expect(second.y).toBe(first.y);
  }
  await page.goto(base + "/admin/edit-editorial/galeria-y-enlaces-qa");
  const saved = body.getByRole("link", { name: "Caribe", exact: true });
  await saved.click();
  await linkTool.click();
  await expect(address).toHaveValue("https://bandcamp.com/");
  await address.fill("https://example.org/album");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(saved).toHaveAttribute("href", "https://example.org/album");
  await saved.click();
  await linkTool.click();
  await page.getByRole("button", { name: "Quitar enlace" }).click();
  await expect(saved).toHaveCount(0);
  await expect(body).toHaveText("Escucha Caribe");
}

module.exports = { checkEditorialAuthoring };
