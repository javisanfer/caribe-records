const cors = require("cors");

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

console.log("🔍 CORS_ORIGINS configurado en:", CORS_ORIGINS);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
});

module.exports = corsMiddleware;
