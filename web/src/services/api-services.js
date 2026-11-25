// src/services/api-services.js
import axios from "axios";

/**
 * Usa una ruta relativa por defecto para que Axios y fetch compartan el proxy
 * configurado por Vite. Producción puede definir VITE_API_BASE si la API vive
 * en otro origen.
 */
const API_BASE = import.meta.env.PROD
  ? "/api/v1"
  : import.meta.env.VITE_API_BASE || "/api/v1";

export const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// --- Interceptores -----------------------------------------------------------
http.interceptors.response.use(
  (res) => res.data, // devolver solo data
  (error) => {
    const isLogoutRequest = error.config?.method === "delete" && error.config?.url === "/sessions";
    if (error.response?.status === 401 && !isLogoutRequest) {
      window.dispatchEvent(new Event("caribe:session-expired"));
    }
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
const profile = () => http.get("/sessions/current");

// ----------------------------------------------------------------------------
// 👩‍🎤 ARTISTS
// ----------------------------------------------------------------------------

// Público
const listArtists = () => http.get("/artists");
const getArtistById = (id) => http.get(`/artists/${id}`);

// Admin
const adminListArtists = () => http.get("/admin/artists");
const adminGetArtist = (slug) => http.get(`/admin/artists/slug/${encodeURIComponent(slug)}`);
const adminCreateArtist = (payload) => http.post("/admin/artists", payload);
const adminUpdateArtist = (slug, payload) =>
  http.patch(`/admin/artists/slug/${encodeURIComponent(slug)}`, payload);
const adminDeleteArtist = (slug) => http.delete(`/admin/artists/slug/${encodeURIComponent(slug)}`);

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

async function listEditorials() {
  const entries = [];
  let page = 1;
  let totalPages;
  do {
    const result = await http.get("/editorials", { params: { limit: 50, page } });
    entries.push(...result.data);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);
  return entries;
}
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
// 📣 BANNERS
// ----------------------------------------------------------------------------

const getActiveBanner = () => http.get("/banners/active");
const adminListBanners = () => http.get("/admin/banners");
const adminGetBanner = (id) => http.get(`/admin/banners/${id}`);
const adminCreateBanner = (payload) => http.post("/admin/banners", payload);
const adminUpdateBanner = (id, payload) => http.patch(`/admin/banners/${id}`, payload);
const adminDeleteBanner = (id) => http.delete(`/admin/banners/${id}`);

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

  // banners
  getActiveBanner,
  adminListBanners,
  adminGetBanner,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,

  // uploads
  uploadImage,
};
