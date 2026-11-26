const express = require("express");
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

const authenticationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Demasiados intentos de acceso. Inténtalo de nuevo en unos minutos.",
  },
});

router.use((req, res, next) => {
  if (Object.values(req.query).some((value) => typeof value !== "string")) {
    return res.status(400).json({ message: "Los filtros deben ser valores individuales" });
  }
  next();
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
router.patch("/users/me", auth.isAuthenticated, users.update);
router.get("/users/me", auth.isAuthenticated, users.profile);
router.get("/users/:id/validate", authenticationRateLimit, users.validate);
router.post("/users/complete-invite", authenticationRateLimit, users.completeInvite);
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
router.post("/users/password-reset/request", passwordResetRateLimit, users.requestPasswordReset);
router.post("/users/password-reset/complete", authenticationRateLimit, users.completePasswordReset);

// Sesiones
router.get("/sessions/current", (req, res) => {
  res.set("Cache-Control", "no-store").json(req.user || null);
});
router.post("/sessions", authenticationRateLimit, sessions.create);
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
);

const about = require("../controllers/about.controller");
const aboutReadLimit = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false });
router.get("/about", aboutReadLimit, about.get);
router.get("/admin/about", adminRateLimit, about.get);
router.put("/admin/about", adminRateLimit, about.update);

const carousel = require("../controllers/home-carousel.controller");
const carouselReadLimit = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
router.get("/home-carousel", carouselReadLimit, carousel.publicList);
router.get("/admin/home-carousel", adminRateLimit, carousel.adminList);
router.put("/admin/home-carousel", adminRateLimit, carousel.update);

router.get("/admin/activity", adminRateLimit, adminController.getActivity);

// Accounts are provisioned with an internal bootstrap command. There is no
// HTTP endpoint for creating users in any environment.
router.get(
  "/users",
  auth.isAuthenticated,
  auth.isAdmin,
  adminRateLimit,
  users.getAllUsers,
);

// ======================================================
// ARTISTS
// ======================================================

// Público
router.get("/artists", artistController.getArtists);

const artistProfileReadLimit = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false });

// slug FIRST
router.get("/artists/slug/:slug", artistProfileReadLimit, artistController.getArtistBySlug);

// id AFTER
router.get("/artists/:id", artistProfileReadLimit, artistController.getArtistById);

// Admin
router.get("/admin/artists", adminRateLimit, artistController.getArtists);
router.post("/admin/artists", adminRateLimit, artistController.createArtists);

router.get(
  "/admin/artists/slug/:slug",
  adminRateLimit,
  artistController.getArtistBySlug
);

router.patch(
  "/admin/artists/slug/:slug",
  adminRateLimit,
  artistController.updateArtist
);

router.delete(
  "/admin/artists/slug/:slug",
  adminRateLimit,
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
  adminRateLimit,
  releaseController.getReleases
);

router.get(
  "/admin/releases/:id",
  adminRateLimit,
  releaseController.getReleaseById
);

router.post(
  "/admin/releases",
  adminRateLimit,
  releaseController.createRelease
);

router.patch(
  "/admin/releases/:id",
  adminRateLimit,
  releaseController.updateRelease
);

router.delete(
  "/admin/releases/:id",
  adminRateLimit,
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
  adminRateLimit,
  eventController.getEventsAdmin
);

router.get(
  "/admin/events/slug/:slug",
  adminRateLimit,
  eventController.getEventByIdAdmin
);

router.post(
  "/admin/events",
  adminRateLimit,
  eventController.createEvent
);

router.patch(
  "/admin/events/slug/:slug",
  adminRateLimit,
  eventController.updateEvent
);

router.delete(
  "/admin/events/slug/:slug",
  adminRateLimit,
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
  adminRateLimit,
  editorialController.getEditorialsAdmin
);

router.get(
  "/admin/editorials/slug/:slug",
  adminRateLimit,
  editorialController.getEditorialBySlugAdmin
);

router.post(
  "/admin/editorials",
  adminRateLimit,
  upload.single("heroFile"),
  editorialController.createEditorial
);

router.patch(
  "/admin/editorials/slug/:slug",
  adminRateLimit,
  upload.single("heroFile"),
  editorialController.updateEditorial
);

router.delete(
  "/admin/editorials/slug/:slug",
  adminRateLimit,
  editorialController.deleteEditorial
);

// ======================================================
// BANNERS
// ======================================================

router.get("/banners/active", bannerController.getActiveBanner);
router.get("/admin/banners", adminRateLimit, bannerController.listBanners);
router.get("/admin/banners/:id", adminRateLimit, bannerController.getBanner);
router.post("/admin/banners", adminRateLimit, bannerController.createBanner);
router.patch("/admin/banners/:id", adminRateLimit, bannerController.updateBanner);
router.delete("/admin/banners/:id", adminRateLimit, bannerController.deleteBanner);

// ======================================================
// UPLOADS GENERIC
// ======================================================

if (upload.localDirectory) {
  router.use("/uploads", express.static(upload.localDirectory, {
    index: false,
    redirect: false,
    setHeaders: (res) => {
      res.set("X-Content-Type-Options", "nosniff");
      res.set("Content-Security-Policy", "default-src 'none'");
    },
  }));
}

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
    res.status(200).json({ imageUrl: upload.imageUrlFor(req.file) });
  },
);

// ======================================================
// ERRORES
// ======================================================

router.use((req, res, next) => next(createError(404, "Route not found")));

module.exports = router;
