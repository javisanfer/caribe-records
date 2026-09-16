const test = require("node:test");
const assert = require("node:assert/strict");

const Editorial = require("../src/models/editorial.model");

test("permite conservar un borrador editorial incompleto", async () => {
  const draft = new Editorial({ title: "Idea pendiente", status: "draft" });
  await assert.doesNotReject(() => draft.validate());
});

test("impide publicar una editorial sin portada ni contenido", async () => {
  const published = new Editorial({ title: "Incompleta", status: "published" });
  await assert.rejects(
    () => published.validate(),
    (error) => Boolean(error.errors["hero.url"] && error.errors.blocks),
  );
});
