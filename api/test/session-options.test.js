const test = require("node:test");
const assert = require("node:assert/strict");

const {
  sessionCookieName,
  sessionCookieOptions,
  sessionCookieClearOptions,
} = require("../src/config/session-options.config");

test("el cierre de sesión elimina la misma cookie que crea la sesión", () => {
  assert.equal(sessionCookieName, process.env.SESSION_COOKIE_NAME || "connect.sid");
  assert.equal(sessionCookieClearOptions.httpOnly, sessionCookieOptions.httpOnly);
  assert.equal(sessionCookieClearOptions.secure, sessionCookieOptions.secure);
  assert.equal(sessionCookieClearOptions.sameSite, sessionCookieOptions.sameSite);
  assert.equal(sessionCookieClearOptions.path, "/");
});

test("la sesión expira tras cinco minutos de inactividad por defecto", () => {
  assert.equal(sessionCookieOptions.maxAge, 5 * 60 * 1000);
});
