import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../contexts/use-auth-context";
import mark from "../assets/brand/caribe-mark.webp";
import runner from "../assets/brand/caribe-runner.webp";
import SiteLoader from "../components/ui/site-loader.jsx";

const homeNavigation = [
  { to: "/artistas", label: "Artistas" },
  { to: "/releases", label: "Catálogo" },
  { to: "/editoriales", label: "Editorial" },
  { to: "/eventos", label: "Eventos" },
];

export default function HomePage() {
  const { user } = useAuthContext();
  const [editorials, setEditorials] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/home-carousel")
      .then((res) => {
        if (!res.ok) throw new Error("Editorials unavailable");
        return res.json();
      })
      .then((json) => Array.isArray(json) ? json : [])
      .catch(() => [])
      .then((items) => {
        if (active) setEditorials(items);
      })
      .finally(() => {
      if (active) {
        setLoading(false);
      }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (editorials.length < 2 || isPaused) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % editorials.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [editorials.length, isPaused]);

  return (
    <div className={`home${loading ? " is-loading" : ""}`}>
      <header className="home-nav">
        <Link to="/" className="home-brand" aria-label="Caribe Records, inicio">
          <img src={mark} alt="" />
        </Link>
        {user?.role === "admin" && <Link to="/admin" className="home-panel-link">Panel <span aria-hidden="true">↗</span></Link>}
      </header>

      <main
        className={`home-editorial-carousel${editorials.length ? "" : " is-empty"}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <h1 className="visually-hidden">Caribe Records</h1>
        {loading && <SiteLoader />}
        {editorials.length ? (
          editorials.map((editorial, index) => (
            <Link
              to={`/editorial/${editorial.slug}`}
              className={`home-slide${index === activeSlide ? " is-active" : ""}`}
              key={editorial.id || editorial._id || editorial.slug}
              aria-hidden={index !== activeSlide}
              tabIndex={index === activeSlide ? 0 : -1}
              aria-label="Abrir publicación editorial"
            >
              {editorial.hero?.url && (
                <img
                  src={editorial.hero.url}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  alt={editorial.hero.alt || ""}
                  onError={(event) => { event.currentTarget.hidden = true; }}
                />
              )}
              <span className="home-slide-label">{editorial.title}</span>
            </Link>
          ))
        ) : !loading && (
          <section className="home-empty-state">
            <img src={runner} alt="" />
            <p>Caribe Records</p>
            <span>Vallecas · Madrid</span>
          </section>
        )}
      </main>

      <nav className="home-section-nav" aria-label="Secciones">
        {homeNavigation.map((item, index) => (
          <Link key={item.to} to={item.to}>
            {item.label}<small>0{index + 1}</small>
          </Link>
        ))}
        <a href="https://cariberecords.bigcartel.com/" target="_blank" rel="noreferrer">
          Tienda<small>05 ↗</small>
        </a>
      </nav>

      {editorials.length > 1 && (
        <div className="home-carousel-controls" aria-label="Controles del carrusel">
          <button
            type="button"
            onClick={() => setIsPaused((value) => !value)}
            aria-label={isPaused ? "Reproducir carrusel" : "Pausar carrusel"}
          >
            {isPaused ? "Play" : "Pause"}
          </button>
          <span>{String(activeSlide + 1).padStart(2, "0")} / {String(editorials.length).padStart(2, "0")}</span>
          <button
            type="button"
            onClick={() => setActiveSlide((activeSlide + 1) % editorials.length)}
            aria-label="Siguiente imagen"
          >
            ↓
          </button>
        </div>
      )}
    </div>
  );
}
