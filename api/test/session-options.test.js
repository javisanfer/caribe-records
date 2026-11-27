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

test("producción siempre exige HTTPS, incluso con una variable local heredada", () => {
  const { execFileSync } = require("node:child_process");
  const result = execFileSync(process.execPath, ["-p", "require('./src/config/session-options.config').sessionCookieOptions.secure"], {
    cwd: require("node:path").resolve(__dirname, ".."),
    env: { ...process.env, NODE_ENV: "production", HOST: "127.0.0.1", SESSION_SECURE: "false" },
  });
  assert.equal(result.toString().trim(), "true");
});
