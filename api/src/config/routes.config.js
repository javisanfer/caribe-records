const express = require("express");
const mongoose = require("mongoose");
const createError = require("http-errors");

const router = express.Router();

// -------------------- Middlewares --------------------
const auth = require("../middlewares/session.middleware");
const upload = require("../config/storage.config");

router.use(auth.loadSessionUser);

// -------------------- Controllers --------------------
const users = require("../controllers/users.controller");
const sessions = require("../controllers/sessions.controller");
const artistController = require("../controllers/artists.controller");
const releaseController = require("../controllers/releases.controller");
const editorialController = require("../controllers/editorial.controller");
const eventController = require("../controllers/events.controller");

// ======================================================
// USERS & SESSIONS
// ======================================================

// 🔹 Usuarios
router.post("/users", upload.single("avatar"), users.create);
router.patch("/users/me", auth.isAuthenticated, users.update);
router.get("/users", users.getAllUsers);
router.get("/users/me", auth.isAuthenticated, users.profile);
router.get("/users/:id/validate", users.validate);

// 🔹 Sesiones
router.post("/sessions", sessions.create);
router.delete("/sessions", auth.isAuthenticated, sessions.destroy);

// ======================================================
// ARTISTS
// ======================================================

// Público
router.get("/artists", artistController.getArtists);
router.get("/artists/:id", artistController.getArtistById);

// Admin (creación/edición/eliminación solo autenticado)
router.post("/admin/artists", auth.isAuthenticated, /* auth.requireRole(["owner","editor"]), */ artistController.createArtists);
router.patch("/admin/artists/:id", auth.isAuthenticated, /* auth.requireRole(["owner","editor"]), */ artistController.updateArtist);
router.delete("/admin/artists/:id", auth.isAuthenticated, /* auth.requireRole(["owner"]), */ artistController.deleteArtist);

// ======================================================
// RELEASES (sin dependencia de 'master')
// ======================================================

// Público
router.get("/releases", releaseController.getReleases);
router.get("/releases/:id", releaseController.getReleaseById);

// Admin
router.get("/admin/releases", auth.isAuthenticated, releaseController.getReleases);
router.get("/admin/releases/:id", auth.isAuthenticated, releaseController.getReleaseById);
router.post("/admin/releases", auth.isAuthenticated, /* auth.requireRole(["owner","editor"]), */ releaseController.createRelease);
router.patch("/admin/releases/:id", auth.isAuthenticated, /* auth.requireRole(["owner","editor"]), */ releaseController.updateRelease);
router.delete("/admin/releases/:id", auth.isAuthenticated, /* auth.requireRole(["owner"]), */ releaseController.deleteRelease);

// ======================================================
// EVENTS
// ======================================================

// Público
router.get("/events", eventController.getEventsPublic);
router.get("/events/slug/:slug", eventController.getEventBySlugPublic);

// Admin
router.get("/admin/events", auth.isAuthenticated, eventController.getEventsAdmin);
router.get("/admin/events/:id", auth.isAuthenticated, eventController.getEventByIdAdmin);
router.post("/admin/events", auth.isAuthenticated, /* auth.requireRole(["owner","editor"]), */ eventController.createEvent);
router.patch("/admin/events/:id", auth.isAuthenticated, /* auth.requireRole(["owner","editor"]), */ eventController.updateEvent);
router.delete("/admin/events/:id", auth.isAuthenticated, /* auth.requireRole(["owner"]), */ eventController.deleteEvent);

// ======================================================
// EDITORIALS
// ======================================================

// Público
router.get("/editorials", editorialController.getEditorialsPublic);
router.get("/editorials/slug/:slug", editorialController.getEditorialBySlugPublic);

// Admin
router.get("/admin/editorials", auth.isAuthenticated, editorialController.getEditorialsAdmin);
router.get("/admin/editorials/:id", auth.isAuthenticated, editorialController.getEditorialByIdAdmin);
router.post("/admin/editorials", auth.isAuthenticated, /* auth.requireRole(["owner","editor"]), */ editorialController.createEditorial);
router.patch("/admin/editorials/:id", auth.isAuthenticated, /* auth.requireRole(["owner","editor"]), */ editorialController.updateEditorial);
router.delete("/admin/editorials/:id", auth.isAuthenticated, /* auth.requireRole(["owner"]), */ editorialController.deleteEditorial);

// ======================================================
// UPLOADS
// ======================================================

router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se ha subido ninguna imagen" });
  }
  res.status(200).json({ imageUrl: req.file.path });
});

// ======================================================
// ERRORES
// ======================================================

// 404
router.use((req, res, next) => next(createError(404, "Route not found")));

// Manejo general de errores
router.use((error, req, res, next) => {
  if (error instanceof mongoose.Error.CastError && error.message.includes("_id")) {
    error = createError(404, "Resource not found");
  } else if (error instanceof mongoose.Error.ValidationError) {
    error = createError(400, error);
  } else if (!error.status) {
    error = createError(500, error.message);
  }

  console.error(error);

  const data = { message: error.message };
  if (error.errors) {
    data.errors = Object.keys(error.errors).reduce((errors, key) => {
      errors[key] = error.errors[key]?.message || error.errors[key];
      return errors;
    }, {});
  }

  res.status(error.status).json(data);
});

module.exports = router;