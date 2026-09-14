const createError = require("http-errors");
const multer = require("multer");

const UPLOAD_ERROR_MESSAGES = {
  LIMIT_FILE_SIZE: "La imagen supera el límite de 10 MiB",
  LIMIT_UNEXPECTED_FILE: "El archivo debe ser una imagen JPEG, PNG o WebP",
};

function normalizeUploadError(error) {
  if (!(error instanceof multer.MulterError)) return error;

  return createError(400, UPLOAD_ERROR_MESSAGES[error.code] || error.message);
}

module.exports = { normalizeUploadError, UPLOAD_ERROR_MESSAGES };
