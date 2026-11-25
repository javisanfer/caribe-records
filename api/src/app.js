require("dotenv").config();

const express = require("express");
const logger = require("morgan");
const sessionMiddleware = require("./config/session.config");
const { loadSessionUser } = require("./middlewares/session.middleware");
const corsMiddleware = require("./config/cors.config"); // ✅ Corregido
const { connectDatabase } = require("./config/db.config");
const { migrateCatalogue } = require("./migrations/catalogue-2026-10");
const { migrateLaunchContent, migratePublicationSettings } = require("./migrations/launch-content-2026-11");
const { inviteProductionAdmin } = require("./migrations/admin-invite-2026-11");

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
// Activation links carry credentials in their query string.
logger.token("url", (req) => req.path);
logger.token("referrer", (req) => req.get("Referrer")?.split(/[?#]/, 1)[0]);
app.use(logger(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(sessionMiddleware);
app.use(loadSessionUser);

/* API Routes Configuration */
const router = require("./config/routes.config");
app.use("/api/v1/", router);

const port = Number(process.env.PORT || 3000);

connectDatabase()
  .then(async (connection) => {
    await migrateCatalogue(connection.db);
    await migrateLaunchContent(connection.db);
    await migratePublicationSettings(connection.db);
    try {
      await inviteProductionAdmin(connection.db);
    } catch (error) {
      console.error("Production admin invitation pending:", error.message);
    }
  })
  .then(() => {
    app.listen(port, process.env.HOST || undefined, () => console.info(`🚀 Application running at port ${port}`));
  })
  .catch((error) => {
    console.error("Unable to connect to MongoDB after retrying", error);
    process.exit(1);
  });
