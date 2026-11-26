import React, { lazy, Suspense, useLayoutEffect, useRef } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { usePageMeta } from "./utils/page-meta";
import { PrivateRoute } from "./guards";

// UI
import { Link } from "react-router-dom";
import { enabled } from "./analytics/measurement";
import { useAudience } from "./analytics/use-audience";
const Privacy = lazy(() => import("./pages/privacy.jsx"));
import Navbar from "./components/ui/navbar.jsx";
import PageLayout from "./components/layouts/page-layout/page-layout.jsx";
import PageTransition from "./components/layouts/page-transition/page-transition.jsx";
import SiteFooter from "./components/layouts/site-footer/site-footer.jsx";
import SiteBanner from "./components/ui/site-banner.jsx";
import SiteLoader from "./components/ui/site-loader.jsx";

// Páginas públicas
import HomePage from "./pages/home.jsx";
const ArtistPage = lazy(() => import("./pages/artist.jsx"));
const ArtistDetailPage = lazy(() => import("./pages/artist-detail.jsx"));
const EditorialPage = lazy(() => import("./pages/editorial.jsx"));
const EditorialDetailPage = lazy(() => import("./pages/editorial-detail.jsx"));
const EventPage = lazy(() => import("./pages/event.jsx"));
const ReleasePage = lazy(() => import("./pages/release.jsx"));
const AboutPage = lazy(() => import("./pages/about.jsx"));
const LoginPage = lazy(() => import("./pages/login.jsx"));
const ActivateAdminPage = lazy(() => import("./pages/activate-admin.jsx"));
const RecoverAdminPage = lazy(() => import("./pages/recover-admin.jsx"));
const NotFoundPage = lazy(() => import("./pages/not-found.jsx"));

// Admin: keep the private editing tools out of the public initial download.
const AdminDashboardPage = lazy(() => import("./pages/admin/admin-dashboard.jsx"));
const EditCarousel = lazy(() => import("./pages/admin/edit-carousel.jsx"));
const NewArtistPage = lazy(() => import("./pages/admin/new-artist.jsx"));
const NewReleasePage = lazy(() => import("./pages/admin/new-release.jsx"));
const NewEventPage = lazy(() => import("./pages/admin/new-event.jsx"));
const CatalogueDetail = lazy(() => import("./pages/catalogue-detail.jsx"));
const EditAboutPage = lazy(() => import("./pages/admin/edit-about.jsx"));
const NewBannerPage = lazy(() => import("./pages/admin/new-banner.jsx"));
const NewEditorialPage = lazy(() => import("./pages/admin/new-editorial.jsx"));

function App() {
  const location = useLocation();
  usePageMeta(location.pathname);
  const isHome = location.pathname === "/";
  const isPrivateArea = /^\/(admin(?:\/|$)|login(?:\/|$))/i.test(location.pathname);
  const audience = useAudience(location);
  const consentButton = useRef(null);
  const preferencesTrigger = useRef(null);
  useLayoutEffect(() => {
    if (!preferencesTrigger.current) return;
    if (audience.show) consentButton.current?.focus();
    else {
      preferencesTrigger.current.focus();
      preferencesTrigger.current = null;
    }
  }, [audience.show]);

  useLayoutEffect(() => {
    if (location.pathname !== "/") document.getElementById("site-schema")?.remove();
    const schema = document.getElementById("page-schema");
    if (schema && document.querySelector('link[rel="canonical"]')?.pathname !== location.pathname) schema.remove();
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search]);

  function openPreferences(event) {
    preferencesTrigger.current = event.currentTarget;
    audience.open();
  }

  if (import.meta.env.DEV && location.pathname === "/demo-carga") {
    return <SiteLoader delay={0} fullPage />;
  }

  return (
    <>
      {!isHome && <Navbar />}
      {!isPrivateArea && location.pathname !== "/legal" && !audience.show && <SiteBanner />}
      {!isPrivateArea && audience.show && <aside className="cr-consent" aria-labelledby="cr-consent-title">
        <div><strong id="cr-consent-title" className="visually-hidden">Cookies de audiencia</strong>
          <p>Usamos cookies de Google Analytics para medir visitas y clics en enlaces externos. <Link to="/legal#cookies">Política de cookies</Link></p></div>
        <div className="cr-consent__actions">
          <button type="button" ref={consentButton} onClick={() => audience.choose("yes")}>Aceptar</button>
          <button type="button" onClick={() => audience.choose("no")}>Rechazar</button>
        </div>
      </aside>}

      <AnimatePresence mode="wait">
        <Suspense fallback={<SiteLoader />}>
          <Routes location={location} key={location.pathname}>
          
          <Route path="/legal" element={<Privacy onPreferences={enabled ? openPreferences : undefined} />} />
          <Route path="/privacidad" element={<Navigate to="/legal" replace />} />
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

          <Route
            path="/about"
            element={
              <PageTransition>
                <AboutPage />
              </PageTransition>
            }
          />

          <Route path="/eventos/:key" element={<PageTransition><CatalogueDetail event /></PageTransition>} />
          <Route path="/releases/:key" element={<PageTransition><CatalogueDetail /></PageTransition>} />

          {/* LOGIN */}
          <Route path="/admin/activar" element={<ActivateAdminPage />} />
          <Route path="/admin/recuperar" element={<RecoverAdminPage />} />
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

          <Route
            path="/admin/new-banner"
            element={
              <PrivateRoute>
                <PageTransition>
                  <PageLayout>
                    <NewBannerPage />
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

          <Route
            path="/admin/edit-banner/:id"
            element={
              <PrivateRoute>
                <PageTransition>
                  <PageLayout>
                    <NewBannerPage isEditMode />
                  </PageLayout>
                </PageTransition>
              </PrivateRoute>
            }
          />

          <Route path="/admin/portada" element={<PrivateRoute><PageLayout><EditCarousel /></PageLayout></PrivateRoute>} />
          <Route path="/admin/about" element={<PrivateRoute><PageLayout><EditAboutPage /></PageLayout></PrivateRoute>} />
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

          <Route
            path="*"
            element={
              <PageTransition>
                <NotFoundPage />
              </PageTransition>
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
