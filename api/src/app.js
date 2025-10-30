require("dotenv").config();
console.log("Cloudinary Config:", process.env.CLOUDINARY_CLOUD_NAME);

const express = require("express");
const logger = require("morgan");
const sessionMiddleware = require("./config/session.config");
const { loadSessionUser } = require("./middlewares/session.middleware");
const corsMiddleware = require("./config/cors.config"); // ✅ Corregido

/* DB init */
require("./config/db.config");

const app = express();

/* Middlewares */
app.use(express.json()); // ✅ Primero parseamos JSON
console.log("✅ express.json cargado correctamente");

app.use(express.urlencoded({ extended: true })); // ✅ Para manejar formularios

app.use(corsMiddleware); // ✅ Ahora CORS se ejecuta después de express.json()
console.log("✅ CORS cargado correctamente");

app.use(logger("dev"));
console.log("✅ Logger cargado correctamente");

app.use(sessionMiddleware);
console.log("✅ sessionMiddleware cargado correctamente");

app.use(loadSessionUser);
console.log("✅ loadSessionUser cargado correctamente");

/* API Routes Configuration */
const router = require("./config/routes.config");
console.log("🔍 Verificando router:", typeof router);
app.use("/api/v1/", router);
console.log("✅ Router cargado correctamente");

/* Cloudinary */
const cloudinary = require("cloudinary").v2;

cloudinary.api.ping()
  .then(response => console.log("✅ Conexión con Cloudinary exitosa:", response))
  .catch(error => console.error("❌ Error al conectar con Cloudinary:", error));

const port = Number(process.env.PORT || 3000);

app.listen(port, () => console.info(`🚀 Application running at port ${port}`));