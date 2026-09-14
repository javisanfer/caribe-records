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
