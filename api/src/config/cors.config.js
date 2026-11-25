const cors = require("cors");
const createError = require("http-errors");

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(createError(403, "Origen no permitido"));
    }
  },
  credentials: true,
});

module.exports = corsMiddleware;
