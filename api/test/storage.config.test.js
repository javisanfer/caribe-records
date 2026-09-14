const test = require("node:test");
const assert = require("node:assert/strict");

const multerPackage = require("multer/package.json");
const upload = require("../src/config/storage.config");

const filterFile = (mimetype) => new Promise((resolve) => {
  upload.imageFileFilter({}, { mimetype }, (error, accepted) => {
    resolve({ error, accepted });
  });
});

test("usa una versión corregida de Multer", () => {
  assert.equal(multerPackage.version, "2.3.0");
});

test("limita cada imagen a 10 MiB", () => {
  assert.equal(upload.MAX_IMAGE_BYTES, 10 * 1024 * 1024);
});

test("acepta únicamente JPEG, PNG y WebP", async () => {
  for (const mimetype of upload.ALLOWED_IMAGE_TYPES) {
    assert.deepEqual(await filterFile(mimetype), {
      error: null,
      accepted: true,
    });
  }

  const rejected = await filterFile("image/svg+xml");
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.error.code, "LIMIT_UNEXPECTED_FILE");
});
