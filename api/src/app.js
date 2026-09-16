require("dotenv").config();

const express = require("express");
const logger = require("morgan");
const sessionMiddleware = require("./config/session.config");
const { loadSessionUser } = require("./middlewares/session.middleware");
const corsMiddleware = require("./config/cors.config"); // ✅ Corregido
const { connectDatabase } = require("./config/db.config");

const app = express();

// AWS terminates TLS before forwarding traffic to Express. Trusting its proxy
// is required for secure session cookies to work in production.
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// Keep the platform health check independent from sessions and MongoDB reads.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

/* Middlewares */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(corsMiddleware);
app.use(logger(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(sessionMiddleware);
app.use(loadSessionUser);

/* API Routes Configuration */
const router = require("./config/routes.config");
app.use("/api/v1/", router);

const port = Number(process.env.PORT || 3000);

connectDatabase()
  .then(() => {
    app.listen(port, () => console.info(`🚀 Application running at port ${port}`));
  })
  .catch((error) => {
    console.error("Unable to connect to MongoDB after retrying", error);
    process.exit(1);
  });
