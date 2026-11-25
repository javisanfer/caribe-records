const test = require("node:test");
const assert = require("node:assert/strict");

const router = require("../src/config/routes.config");

const registeredMethods = (path) => router.stack
  .filter((layer) => layer.route?.path === path)
  .flatMap((layer) => Object.keys(layer.route.methods));

test("no registra un endpoint HTTP para crear usuarios", () => {
  assert.deepEqual(registeredMethods("/users"), ["get"]);
  assert.equal(registeredMethods("/users").includes("post"), false);
});

test("la activación requiere token y lo consume una sola vez", async (t) => {
  const User = require("../src/models/user.model");
  const users = require("../src/controllers/users.controller");
  const id = "1234567890abcdef12345678";
  const token = "token-local";
  let updated = false;
  t.mock.method(User, "findOneAndUpdate", async (filter, update) => {
    assert.deepEqual(filter, { _id: id, active: false, activateToken: token, activateExpiresAt: null });
    assert.deepEqual(update.$set, { active: true, activateToken: null });
    if (updated) return null;
    updated = true;
    return { active: true };
  });
  const validate = (query) => new Promise((resolve) => {
    users.validate({ params: { id }, query }, { json: resolve }, resolve);
  });
  assert.equal((await validate({})).status, 400);
  assert.equal(updated, false);
  assert.deepEqual(await validate({ token }), { active: true });
  assert.equal((await validate({ token })).status, 404);
});
