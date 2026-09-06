import React, { lazy, Suspense } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PrivateRoute } from "./guards";

// UI
import Navbar from "./components/ui/navbar.jsx";
import PageLayout from "./components/layouts/page-layout/page-layout.jsx";
import PageTransition from "./components/layouts/page-transition/page-transition.jsx";
import SiteFooter from "./components/layouts/site-footer/site-footer.jsx";

// Páginas públicas
import HomePage from "./pages/home.jsx";
import ArtistPage from "./pages/artist.jsx";
import ArtistDetailPage from "./pages/artist-detail.jsx";
import EditorialPage from "./pages/editorial.jsx";
import EditorialDetailPage from "./pages/editorial-detail.jsx";
import EventPage from "./pages/event.jsx";
import ReleasePage from "./pages/release.jsx";
import LoginPage from "./pages/login.jsx";

// Admin
import AdminDashboardPage from "./pages/admin/admin-dashboard.jsx";
import NewArtistPage from "./pages/admin/new-artist.jsx";
import NewReleasePage from "./pages/admin/new-release.jsx";
import NewEventPage from "./pages/admin/new-event.jsx";
const NewEditorialPage = lazy(() => import("./pages/admin/new-editorial.jsx"));

function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isPrivateArea = location.pathname.startsWith("/admin");

  return (
    <>
      {!isHome && <Navbar />}

      <AnimatePresence mode="wait">
        <Suspense fallback={<main className="admin-page"><p className="admin-loading-state">Abriendo espacio editorial…</p></main>}>
          <Routes location={location} key={location.pathname}>
          
          {/* HOME */}
          <Route
            path="/"
            element={
              <PageTransition>
                <HomePage />
              </PageTransition>
            }
          />

          {/* PUBLIC PAGES (sin PageLayout) */}
          <Route
            path="/artistas"
            element={
              <PageTransition>
                <ArtistPage />
              </PageTransition>
            }
          />

          <Route
            path="/artistas/:slug"
            element={
              <PageTransition>
                <ArtistDetailPage />
              </PageTransition>
            }
          />

          <Route
            path="/editoriales"
            element={
              <PageTransition>
                <EditorialPage />
              </PageTransition>
            }
          />

          <Route
            path="/editorial/:slug"
            element={
              <PageTransition>
                <EditorialDetailPage />
              </PageTransition>
            }
          />

          <Route
            path="/eventos"
            element={
              <PageTransition>
                <EventPage />
              </PageTransition>
            }
          />

          <Route
            path="/releases"
            element={
              <PageTransition>
                <ReleasePage />
              </PageTransition>
            }
          />

          {/* LOGIN */}
          <Route
            path="/admin/login"
            element={
              <PageTransition>
                <LoginPage />
              </PageTransition>
            }
          />

          <Route path="/login" element={<Navigate to="/admin/login" replace />} />

          {/* ===================== */}
          {/*   ADMIN — CREACIÓN    */}
          {/* ===================== */}
          <Route
            path="/admin/new-artist"
            element={
              <PrivateRoute>
                <PageTransition>
                  <PageLayout>
                    <NewArtistPage />
                  </PageLayout>
                </PageTransition>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/new-release"
            element={
              <PrivateRoute>
                <PageTransition>
                  <PageLayout>
                    <NewReleasePage />
                  </PageLayout>
                </PageTransition>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/new-event"
            element={
              <PrivateRoute>
                <PageTransition>
                  <PageLayout>
                    <NewEventPage />
                  </PageLayout>
                </PageTransition>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/new-editorial"
            element={
              <PrivateRoute>
                <PageTransition>
                  <PageLayout>
                    <NewEditorialPage />
                  </PageLayout>
                </PageTransition>
              </PrivateRoute>
            }
          />

          {/* ===================== */}
          {/*   ADMIN — EDICIÓN     */}
          {/* ===================== */}
          
          {/* Artist por SLUG */}
          <Route
            path="/admin/edit-artist/:slug"
            element={
              <PrivateRoute>
                <PageTransition>
                  <PageLayout>
                    <NewArtistPage isEditMode />
                  </PageLayout>
                </PageTransition>
              </PrivateRoute>
            }
          />

          {/* Release por ID (no tiene slug aún) */}
          <Route
            path="/admin/edit-release/:id"
            element={
              <PrivateRoute>
                <PageTransition>
                  <PageLayout>
                    <NewReleasePage isEditMode />
                  </PageLayout>
                </PageTransition>
              </PrivateRoute>
            }
          />

          {/* Event por SLUG */}
          <Route
            path="/admin/edit-event/:slug"
            element={
              <PrivateRoute>
                <PageTransition>
                  <PageLayout>
                    <NewEventPage isEditMode />
                  </PageLayout>
                </PageTransition>
              </PrivateRoute>
            }
          />

          {/* Editorial por SLUG */}
          <Route
            path="/admin/edit-editorial/:slug"
            element={
              <PrivateRoute>
                <PageTransition>
                  <PageLayout>
                    <NewEditorialPage isEditMode />
                  </PageLayout>
                </PageTransition>
              </PrivateRoute>
            }
          />

          {/* ADMIN DASHBOARD */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <PageTransition>
                  <PageLayout>
                    <AdminDashboardPage />
                  </PageLayout>
                </PageTransition>
              </PrivateRoute>
            }
          />

          </Routes>
        </Suspense>
      </AnimatePresence>
      {!isPrivateArea && <SiteFooter />}
    </>
  );
}

export default App;
