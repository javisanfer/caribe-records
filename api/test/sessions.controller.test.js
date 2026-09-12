const test = require("node:test");
const assert = require("node:assert/strict");

const User = require("../src/models/user.model");
const sessions = require("../src/controllers/sessions.controller");
const {
  sessionCookieName,
  sessionCookieClearOptions,
} = require("../src/config/session-options.config");

test("impide iniciar sesión a un usuario desactivado", async (t) => {
  const user = {
    active: false,
    checkPassword: async () => true,
  };
  t.mock.method(User, "findOne", async () => user);

  let regenerated = false;
  const error = await new Promise((resolve) => {
    sessions.create(
      {
        body: { email: "inactive@example.org", password: "password" },
        session: {
          regenerate: () => { regenerated = true; },
        },
      },
      {},
      resolve,
    );
  });

  assert.equal(error.status, 403);
  assert.equal(regenerated, false);
});

test("regenera la sesión antes de autenticar a un usuario activo", async (t) => {
  const user = {
    id: "user-id",
    active: true,
    checkPassword: async () => true,
  };
  t.mock.method(User, "findOne", async () => user);

  const session = {
    regenerate(callback) { callback(); },
    save(callback) { callback(); },
  };

  const response = await new Promise((resolve, reject) => {
    sessions.create(
      { body: { email: "admin@example.org", password: "password" }, session },
      { status: (status) => ({ json: (body) => resolve({ status, body }) }) },
      reject,
    );
  });

  assert.equal(session.userId, "user-id");
  assert.deepEqual(response, { status: 201, body: user });
});

test("el cierre de sesión elimina la cookie configurada", async () => {
  const cleared = await new Promise((resolve, reject) => {
    sessions.destroy(
      { session: { destroy: (callback) => callback() } },
      {
        clearCookie: (name, options) => resolve({ name, options }),
        status: () => ({ send: () => {} }),
      },
      reject,
    );
  });

  assert.equal(cleared.name, sessionCookieName);
  assert.deepEqual(cleared.options, sessionCookieClearOptions);
});
