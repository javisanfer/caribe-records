import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import runner from "../assets/brand/caribe-runner.png";
import SiteLoader from "../components/ui/site-loader.jsx";

const homeNavigation = [
  { to: "/artistas", label: "Artistas" },
  { to: "/releases", label: "Discografía" },
  { to: "/editoriales", label: "Editorial" },
  { to: "/eventos", label: "Eventos" },
];

// Reveal the carousel after its first cover is decoded, or after a bounded wait.
function preloadCover(url) {
  if (!url) return Promise.resolve();
  return new Promise((resolve) => {
    const cover = new Image();
    const timer = window.setTimeout(resolve, 5000);
    cover.src = url;
    cover.decode().catch(() => {}).finally(() => {
      window.clearTimeout(timer);
      resolve();
    });
  });
}

export default function HomePage() {
  const [editorials, setEditorials] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/editorials")
      .then((response) => {
        if (!response.ok) throw new Error("Editorials unavailable");
        return response.json();
      })
      .then(async (json) => {
        const items = (Array.isArray(json) ? json : json.data || []).slice(0, 5);
        await preloadCover(items[0]?.hero?.url);
        if (active) setEditorials(items);
      })
      .catch(() => {
        if (active) setEditorials([]);
      })
      .finally(() => {
        if (active) setLoading(false);
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
      {loading && <SiteLoader />}
      <header className="home-nav">
        <Link to="/" className="home-brand" aria-label="Caribe Records, inicio">
          <img src={runner} alt="" />
        </Link>
      </header>

      <main
        className={`home-editorial-carousel${editorials.length ? "" : " is-empty"}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <h1 className="visually-hidden">Caribe Records</h1>
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
                  alt={editorial.hero.alt || ""}
                  onError={(event) => { event.currentTarget.hidden = true; }}
                />
              )}
              <span className="home-slide-label">{editorial.title}</span>
            </Link>
          ))
        ) : (
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
