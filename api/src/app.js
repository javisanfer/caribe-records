require("dotenv").config();

const express = require("express");
const logger = require("morgan");
const { listenHost } = require("./config/session-options.config");
const createSessionMiddleware = require("./config/session.config");
const { apiError } = require("./utils/http");
const corsMiddleware = require("./config/cors.config"); // ✅ Corregido
const { connectDatabase } = require("./config/db.config");
const { migrateCatalogue } = require("./migrations/catalogue-2026-10");
const { migrateLaunchContent, migratePublicationSettings } = require("./migrations/launch-content-2026-11");
const { inviteProductionAdmin } = require("./migrations/admin-invite-2026-11");

const app = express();
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "no-referrer");
  res.set("Cache-Control", "private, no-store");
  next();
});

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
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
// Activation links carry credentials in their query string.
logger.token("url", (req) => req.path);
logger.token("referrer", (req) => req.get("Referrer")?.split(/[?#]/, 1)[0]);
app.use(logger(process.env.NODE_ENV === "production" ? "combined" : "dev"));



/* API Routes Configuration */
const router = require("./config/routes.config");


const port = Number(process.env.PORT || 3000);

connectDatabase()
  .then(async (connection) => {
    app.use("/api/v1/pages", require("./controllers/public-pages.controller").pages);
    app.use("/api/v1", createSessionMiddleware(connection.getClient()), router);
    app.use(apiError);
    await migrateCatalogue(connection.db);
    await migrateLaunchContent(connection.db);
    await migratePublicationSettings(connection.db);
    try {
      await inviteProductionAdmin(connection.db);
    } catch (error) {
      console.error("Production admin invitation pending:", error.name);
    }
  })
  .then(() => {
    app.listen(port, listenHost, () => console.info(`🚀 Application running at port ${port}`));
  })
  .catch((error) => {
    console.error("Error al iniciar la API", error.name);
    process.exit(1);
  });
