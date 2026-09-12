const express = require("express");
const mongoose = require("mongoose");
const createError = require("http-errors");
const { rateLimit } = require("express-rate-limit");

const router = express.Router();

// -------------------- Middlewares --------------------
const auth = require("../middlewares/session.middleware");
const upload = require("../config/storage.config");

const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Demasiadas peticiones administrativas. Inténtalo de nuevo en unos minutos.",
  },
});

router.use(auth.loadSessionUser);

// -------------------- Controllers --------------------
const users = require("../controllers/users.controller");
const sessions = require("../controllers/sessions.controller");
const artistController = require("../controllers/artists.controller");
const releaseController = require("../controllers/releases.controller");
const editorialController = require("../controllers/editorial.controller");
const eventController = require("../controllers/events.controller");
const adminController = require("../controllers/admin.controller");
const bannerController = require("../controllers/banners.controller");

// ======================================================
// USERS & SESSIONS
// ======================================================

// Usuarios
router.post("/users", upload.single("avatar"), users.create);
router.patch("/users/me", auth.isAuthenticated, users.update);
router.get("/users", users.getAllUsers);
router.get("/users/me", auth.isAuthenticated, users.profile);
router.get("/users/:id/validate", users.validate);

// Sesiones
router.post("/sessions", sessions.create);
router.delete("/sessions", auth.isAuthenticated, sessions.destroy);

// ======================================================
// ADMIN OVERVIEW
// ======================================================

// Every current and future /admin route must pass both checks. Keeping this
// guard in one place prevents a newly added admin endpoint from being exposed
// by accidentally omitting one of the middlewares.
router.use(
  "/admin",
  auth.isAuthenticated,
  auth.isAdmin,
  adminRateLimit,
);

router.get("/admin/activity", adminController.getActivity);

// ======================================================
// ARTISTS
// ======================================================

// Público
router.get("/artists", artistController.getArtists);

// slug FIRST
router.get("/artists/slug/:slug", artistController.getArtistBySlug);

// id AFTER
router.get("/artists/:id", artistController.getArtistById);

// Admin
router.post("/admin/artists", artistController.createArtists);

router.get(
  "/admin/artists/slug/:slug",
  artistController.getArtistBySlug
);

router.patch(
  "/admin/artists/slug/:slug",
  artistController.updateArtist
);

router.delete(
  "/admin/artists/slug/:slug",
  artistController.deleteArtist
);

// ======================================================
// RELEASES
// ======================================================

// Público
router.get("/releases", releaseController.getReleases);
router.get("/releases/:id", releaseController.getReleaseById);

// Admin
router.get(
  "/admin/releases",
  releaseController.getReleases
);

router.get(
  "/admin/releases/:id",
  releaseController.getReleaseById
);

router.post(
  "/admin/releases",
  releaseController.createRelease
);

router.patch(
  "/admin/releases/:id",
  releaseController.updateRelease
);

router.delete(
  "/admin/releases/:id",
  releaseController.deleteRelease
);

// ======================================================
// EVENTS
// ======================================================

// Público
router.get("/events", eventController.getEventsPublic);
router.get("/events/slug/:slug", eventController.getEventBySlugPublic);

// Admin
router.get(
  "/admin/events",
  eventController.getEventsAdmin
);

router.get(
  "/admin/events/slug/:slug",
  eventController.getEventByIdAdmin
);

router.post(
  "/admin/events",
  eventController.createEvent
);

router.patch(
  "/admin/events/slug/:slug",
  eventController.updateEvent
);

router.delete(
  "/admin/events/slug/:slug",
  eventController.deleteEvent
);

// ======================================================
// EDITORIALS
// ======================================================

// Público
router.get("/editorials", editorialController.getEditorialsPublic);
router.get(
  "/editorials/slug/:slug",
  editorialController.getEditorialBySlugPublic
);

// Admin
router.get(
  "/admin/editorials",
  editorialController.getEditorialsAdmin
);

router.get(
  "/admin/editorials/slug/:slug",
  editorialController.getEditorialBySlugAdmin
);

router.post(
  "/admin/editorials",
  upload.single("heroFile"),
  editorialController.createEditorial
);

router.patch(
  "/admin/editorials/slug/:slug",
  upload.single("heroFile"),
  editorialController.updateEditorial
);

router.delete(
  "/admin/editorials/slug/:slug",
  editorialController.deleteEditorial
);

// ======================================================
// BANNERS
// ======================================================

router.get("/banners/active", bannerController.getActiveBanner);
router.get("/admin/banners", bannerController.listBanners);
router.get("/admin/banners/:id", bannerController.getBanner);
router.post("/admin/banners", bannerController.createBanner);
router.patch("/admin/banners/:id", bannerController.updateBanner);
router.delete("/admin/banners/:id", bannerController.deleteBanner);

// ======================================================
// UPLOADS GENERIC
// ======================================================

router.post(
  "/upload",
  auth.isAuthenticated,
  auth.isAdmin,
  adminRateLimit,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No se ha subido ninguna imagen" });
    }
    res.status(200).json({ imageUrl: req.file.path });
  },
);

// ======================================================
// ERRORES
// ======================================================

router.use((req, res, next) => next(createError(404, "Route not found")));

router.use((error, req, res, next) => {
  if (error instanceof mongoose.Error.CastError && error.message.includes("_id")) {
    error = createError(404, "Resource not found");
  } else if (error instanceof mongoose.Error.ValidationError) {
    error = createError(400, error.message);
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
