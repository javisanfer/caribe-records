const test = require("node:test");
const assert = require("node:assert/strict");
const { protectSessionWrites, sendCsrfToken } = require("../src/middlewares/csrf.middleware");

const trusted = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",")[0].trim();

function allowed(method, headers, session = {}) {
  let passed = false;
  const req = { method, session, get: (name) => headers[name] };
  const res = { status(code) { assert.equal(code, 403); return this; }, json() {} };
  protectSessionWrites(req, res, () => { passed = true; });
  return passed;
}

test("sólo acepta escrituras del navegador con un origen de confianza", () => {
  for (const method of ["POST", "PATCH", "DELETE"]) {
    assert.ok(allowed(method, { Origin: trusted }));
    assert.ok(!allowed(method, { Origin: "https://another.example" }));
    assert.ok(!allowed(method, { Origin: "null" }));
    assert.ok(!allowed(method, {}));
  }
  assert.ok(allowed("GET", {}));
});

test("el cliente de API usa el token de su propia sesión", () => {
  const session = {};
  let issued;
  sendCsrfToken({ session }, { set(name, value) { assert.equal(name, "X-CSRF-Token"); issued = value; } });
  assert.ok(issued);
  const headers = { "X-CSRF-Token": issued };
  assert.ok(allowed("POST", headers, session));
  assert.ok(!allowed("POST", headers, {}));
  assert.ok(!allowed("POST", { ...headers, Origin: "https://another.example" }, session));
});
