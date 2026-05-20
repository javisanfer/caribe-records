// src/services/api-services.js
import axios from "axios";

/**
 * Config base: usa VITE_API_BASE en .env (p.ej. http://localhost:3000/api/v1)
 * Si no existe, cae a 'http://localhost:3000/api/v1' en dev.
 */
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:3000/api/v1";

export const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// --- Interceptores -----------------------------------------------------------
http.interceptors.response.use(
  (res) => res.data, // devolver solo data
  (error) => {
    // Normaliza mensaje de error pero NO rompemos el objeto original
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------------
// 🔐 AUTH & USERS (Caribe Records)
// ----------------------------------------------------------------------------

// Login: POST /api/v1/sessions
const login = (payload) => http.post("/sessions", payload);

// Logout: DELETE /api/v1/sessions
const logout = () => http.delete("/sessions");

// Profile
const profile = () => http.get("/users/me");

// Registro de usuario (por si lo usas en el futuro)
const register = (payload) => http.post("/users", payload);

// ----------------------------------------------------------------------------
// 👩‍🎤 ARTISTS
// ----------------------------------------------------------------------------

// Público
const listArtists = () => http.get("/artists");
const getArtistById = (id) => http.get(`/artists/${id}`);

// Admin
const adminListArtists = () => http.get("/admin/artists");
const adminGetArtist = (id) => http.get(`/admin/artists/${id}`);
const adminCreateArtist = (payload) => http.post("/admin/artists", payload);
const adminUpdateArtist = (id, payload) =>
  http.patch(`/admin/artists/${id}`, payload);
const adminDeleteArtist = (id) => http.delete(`/admin/artists/${id}`);

// ----------------------------------------------------------------------------
// 💿 RELEASES
// ----------------------------------------------------------------------------

const listReleases = () => http.get("/releases");
const getReleaseById = (id) => http.get(`/releases/${id}`);

const adminListReleases = () => http.get("/admin/releases");
const adminGetRelease = (id) => http.get(`/admin/releases/${id}`);
const adminCreateRelease = (payload) => http.post("/admin/releases", payload);
const adminPatchRelease = (id, payload) =>
  http.patch(`/admin/releases/${id}`, payload);
const adminDeleteRelease = (id) => http.delete(`/admin/releases/${id}`);

// ----------------------------------------------------------------------------
// 🎫 EVENTS
// ----------------------------------------------------------------------------

const listEvents = () => http.get("/events");
const getEventBySlug = (slug) => http.get(`/events/slug/${slug}`);

const adminListEvents = () => http.get("/admin/events");
const adminGetEvent = (id) => http.get(`/admin/events/${id}`);
const adminCreateEvent = (payload) => http.post("/admin/events", payload);
const adminPatchEvent = (id, payload) =>
  http.patch(`/admin/events/${id}`, payload);
const adminDeleteEvent = (id) => http.delete(`/admin/events/${id}`);

// ----------------------------------------------------------------------------
// 📰 EDITORIALS
// ----------------------------------------------------------------------------

const listEditorials = () => http.get("/editorials");
const getEditorialBySlug = (slug) => http.get(`/editorials/slug/${slug}`);

const adminListEditorials = () => http.get("/admin/editorials");
const adminGetEditorial = (id) => http.get(`/admin/editorials/${id}`);
const adminCreateEditorial = (payload) =>
  http.post("/admin/editorials", payload);
const adminPatchEditorial = (id, payload) =>
  http.patch(`/admin/editorials/${id}`, payload);
const adminDeleteEditorial = (id) =>
  http.delete(`/admin/editorials/${id}`);

// ----------------------------------------------------------------------------
/* ☁️ UPLOADS */
// ----------------------------------------------------------------------------
const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return http.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ----------------------------------------------------------------------------
// Export
// ----------------------------------------------------------------------------
export {
  // auth & users
  login,
  logout,
  profile,
  register,

  // artists
  listArtists,
  getArtistById,
  adminListArtists,
  adminGetArtist,
  adminCreateArtist,
  adminUpdateArtist,
  adminDeleteArtist,

  // releases
  listReleases,
  getReleaseById,
  adminListReleases,
  adminGetRelease,
  adminCreateRelease,
  adminPatchRelease,
  adminDeleteRelease,

  // events
  listEvents,
  getEventBySlug,
  adminListEvents,
  adminGetEvent,
  adminCreateEvent,
  adminPatchEvent,
  adminDeleteEvent,

  // editorials
  listEditorials,
  getEditorialBySlug,
  adminListEditorials,
  adminGetEditorial,
  adminCreateEditorial,
  adminPatchEditorial,
  adminDeleteEditorial,

  // uploads
  uploadImage,
};