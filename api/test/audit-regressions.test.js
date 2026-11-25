const test = require("node:test");
const assert = require("node:assert/strict");
const { matchesSignature } = require("../src/config/storage.config");
const { getPagination } = require("../src/utils/pagination");
const { renderPage } = require("../src/controllers/public-pages.controller");
const { apiError } = require("../src/utils/http");
const sessions = require("../src/controllers/sessions.controller");

test("comprueba la firma y el tipo declarado de las imágenes", () => {
  const png = Buffer.from("89504e470d0a1a0a", "hex");
  assert.equal(matchesSignature(png, "image/png"), true);
  assert.equal(matchesSignature(png, "image/jpeg"), false);
  assert.equal(matchesSignature(Buffer.alloc(0), "image/webp"), false);
});

test("los campos de acceso deben ser cadenas", () => {
  sessions.create({ body: { email: [], password: "test" } }, {}, (error) => assert.equal(error.status, 400));
});

test("la paginación devuelve enteros y mantiene el máximo", () => {
  assert.deepEqual(getPagination({ page: "texto", limit: -1 }), { page: 1, limit: 12, skip: 0 });
  assert.deepEqual(getPagination({ page: 3, limit: 70 }), { page: 3, limit: 50, skip: 100 });
});

test("el HTML inicial incluye los metadatos y conserva los textos como datos", () => {
  const html = renderPage({ title: 'Canciones & fotografías', description: 'Gira "2026"', type: "Article", url: "https://caribe-records.com/editorial/gira" });
  assert.match(html, /og:title" content="Canciones &amp; fotografías/);
  assert.match(html, /Gira &quot;2026&quot;/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /page-entry\.js/);
});

test("los errores internos no devuelven detalles del proveedor", () => {
  const res = { status(n) { this.code = n; return this; }, json(x) { this.body = x; } };
  apiError(new Error("detalle privado de prueba"), { method: "GET" }, res, () => {});
  assert.equal(res.code, 500);
  assert.equal(JSON.stringify(res.body).includes("detalle privado"), false);
});

test("la recuperación de contraseña invalida sesiones de versiones anteriores", async (t) => {
  const User = require("../src/models/user.model");
  const { loadSessionUser } = require("../src/middlewares/session.middleware");
  t.mock.method(User, "findById", async () => ({ active: true, sessionVersion: 1 }));
  const session = { userId: "qa", destroy(next) { this.destroyed = true; next(); } };
  await new Promise((resolve, reject) => loadSessionUser({ session }, {}, (e) => e ? reject(e) : resolve()));
  assert.equal(session.destroyed, true);
});
