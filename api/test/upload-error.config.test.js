const test = require("node:test");
const assert = require("node:assert/strict");
const multer = require("multer");

const {
  normalizeUploadError,
  UPLOAD_ERROR_MESSAGES,
} = require("../src/config/upload-error.config");

test("upload validation errors are returned as client errors", () => {
  for (const code of ["LIMIT_FILE_SIZE", "LIMIT_UNEXPECTED_FILE"]) {
    const normalized = normalizeUploadError(new multer.MulterError(code));

    assert.equal(normalized.status, 400);
    assert.equal(normalized.message, UPLOAD_ERROR_MESSAGES[code]);
  }
});

test("non-upload errors keep their original identity", () => {
  const original = new Error("database unavailable");

  assert.equal(normalizeUploadError(original), original);
});
