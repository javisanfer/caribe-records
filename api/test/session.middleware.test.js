const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isAuthenticated,
  isAdmin,
} = require("../src/middlewares/session.middleware");

const runMiddleware = (middleware, request) => new Promise((resolve) => {
  middleware(request, {}, (error) => resolve(error));
});

test("rechaza una petición sin sesión antes de entrar en administración", async () => {
  const error = await runMiddleware(isAuthenticated, {});

  assert.equal(error.status, 401);
  assert.match(error.message, /missing credentials/i);
});

test("rechaza un usuario autenticado que no tiene rol admin", async () => {
  const request = { user: { role: "guess" } };

  assert.equal(await runMiddleware(isAuthenticated, request), undefined);
  const error = await runMiddleware(isAdmin, request);

  assert.equal(error.status, 403);
  assert.match(error.message, /insufficient access level/i);
});

test("permite continuar a un usuario con rol admin", async () => {
  const request = { user: { role: "admin" } };

  assert.equal(await runMiddleware(isAuthenticated, request), undefined);
  assert.equal(await runMiddleware(isAdmin, request), undefined);
});

test("una cuenta desactivada pierde su sesión en la siguiente petición", async (t) => {
  const User = require("../src/models/user.model");
  const { loadSessionUser } = require("../src/middlewares/session.middleware");
  t.mock.method(User, "findById", async () => ({ active: false, role: "admin" }));
  let destroyed = false;
  const req = { session: { userId: "local", destroy(callback) { destroyed = true; callback(); } } };
  await runMiddleware(loadSessionUser, req);
  assert.equal(destroyed, true);
  assert.equal((await runMiddleware(isAuthenticated, req)).status, 401);
});
