const mongoose = require("mongoose");
const { normalizeUploadError } = require("../config/upload-error.config");

function apiError(rawError, req, res, next) {
  if (res.headersSent) return next(rawError);
  const error = normalizeUploadError(rawError);
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: "Identificador o valor no válido" });
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: "Revisa los campos indicados", fields: Object.keys(error.errors) });
  }
  const status = Number(error.status);
  if (error.type === "entity.parse.failed") return res.status(400).json({ message: "JSON no válido" });
  if (status >= 400 && status < 500 && error.expose) {
    return res.status(status).json({ message: error.message, errors: error.errors });
  }
  console.error("Error interno de la API", req.method, req.route?.path || "/", error.name);
  return res.status(500).json({ message: "No se ha podido completar la operación" });
}

module.exports = { apiError };
