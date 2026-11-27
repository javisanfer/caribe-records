const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const User = require("../src/models/user.model");
const users = require("../src/controllers/users.controller");
const router = require("../src/config/routes.config");

test("password recovery routes are registered without a session", () => {
  for (const path of ["/users/password-reset/request", "/users/password-reset/complete"]) {
    const layer = router.stack.find((item) => item.route?.path === path);
    assert.equal(layer.route.methods.post, true);
  }
});

test("a reset token changes the password once and cannot be replayed", async () => {
  const original = User.updateOne;
  const token = crypto.randomBytes(32).toString("hex");
  const expectedHash = crypto.createHash("sha256").update(token).digest("hex");
  let storedHash = expectedHash;
  let savedPassword;
  User.updateOne = async (filter, update) => {
    assert.equal(filter.email, "hola@caribe-records.com");
    assert.equal(filter.role, "admin");
    assert.equal(filter.active, true);
    assert.equal(filter.passwordResetTokenHash, expectedHash);
    assert.ok(filter.passwordResetExpiresAt.$gt instanceof Date);
    if (!storedHash) return { matchedCount: 0 };
    savedPassword = update.$set.password;
    assert.deepEqual(update.$unset, { passwordResetTokenHash: "", passwordResetExpiresAt: "" });
    storedHash = null;
    return { matchedCount: 1 };
  };
  const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, send() { return this; }, json(body) { this.body = body; return this; } });
  try {
    const req = { body: { email: "HOLA@CARIBE-RECORDS.COM", token, password: "nueva clave larga 2026" } };
    const first = response();
    await users.completePasswordReset(req, first, (error) => { throw error; });
    assert.equal(first.statusCode, 204);
    assert.equal(await bcrypt.compare(req.body.password, savedPassword), true);
    const replay = response();
    await users.completePasswordReset(req, replay, (error) => { throw error; });
    assert.equal(replay.statusCode, 400);
  } finally {
    User.updateOne = original;
  }
});
