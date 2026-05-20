import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../../index.css";

export default function ArtistDetail({
  artist,
  prevNext,
  releases = [],
  editorials = [],
  events = [],
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [expandedBio, setExpandedBio] = useState(false);

  if (!artist) return null;

  /* ---------------- HERO IMAGE ---------------- */
  const heroImage =
    artist.image?.url ||
    artist.photos?.portraitUrl ||
    artist.photos?.coverUrl ||
    null;

  /* ---------------- LINKS NORMALIZATION ---------------- */
  const links = {
    web: artist.web
      ? Object.entries(artist.web)
          .filter(([, url]) => !!url)
          .map(([k, url]) => ({ label: k, url }))
      : [],
    social: artist.social
      ? Object.entries(artist.social)
          .filter(([, url]) => !!url)
          .map(([k, url]) => ({ label: k, url }))
      : [],
    streaming: artist.streaming
      ? Object.entries(artist.streaming)
          .filter(([, url]) => !!url)
          .map(([k, url]) => ({ label: k, url }))
      : [],
  };

  const hasAnyLinks =
    links.web.length || links.social.length || links.streaming.length;

  /* ---------------- RELEASES GROUPED BY YEAR ---------------- */
  const releasesByYear = useMemo(() => {
    const out = {};
    releases.forEach((r) => {
      const year = r.release_date?.slice(0, 4) || r.year || "—";
      if (!out[year]) out[year] = [];
      out[year].push(r);
    });

    return Object.entries(out).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [releases]);

  /* ---------------- EVENT DATE FORMATTER ---------------- */
  const formatEventDate = (value) => {
    if (!value) return "TBA";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "TBA";
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // 🔹 Filtramos eventos “vacíos” (sin título / ciudad / venue)
  const validEvents = (events || []).filter(
    (ev) => ev && (ev.title || ev.city || ev.venue)
  );

  return (
    <div className="container-fluid artist-detail py-3">
      {/* ---------------- TABS ---------------- */}
      <div className="artist-tabs d-flex align-items-center gap-3 mb-3">
        <button
          className={`artist-tab ${tab === "overview" ? "is-active" : ""}`}
          onClick={() => setTab("overview")}
        >
          OVERVIEW
        </button>

        <button
          className={`artist-tab ${tab === "releases" ? "is-active" : ""}`}
          onClick={() => setTab("releases")}
        >
          RELEASES
        </button>

        <button
          className={`artist-tab ${tab === "links" ? "is-active" : ""}`}
          onClick={() => setTab("links")}
          disabled={!hasAnyLinks}
        >
          LINKS
        </button>
      </div>

      <div className="row g-4">
        {/* -------------- MAIN COLUMN -------------- */}
        <div className="col-12 col-lg-8">
          <h1 className="artist-title">{artist.name}</h1>

          {/* ==================== OVERVIEW ==================== */}
          {tab === "overview" && (
            <>
              {/* BIO */}
              {artist.bio && (
                <section className="mb-4">
                  <p className={`artist-bio ${expandedBio ? "expanded" : ""}`}>
                    {artist.bio}
                  </p>

                  {artist.bio.length > 340 && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setExpandedBio((v) => !v)}
                    >
                      {expandedBio ? "– Show less" : "+ Show more"}
                    </button>
                  )}
                </section>
              )}

              {/* RELEASES */}
              {releases.length > 0 && (
                <section className="mb-5">
                  <h3 className="section-subtitle">RELEASES</h3>

                  <div className="release-list">
                    {releases.map((r) => (
                      <Link
                        to={`/releases/${r._id}`}
                        key={r._id}
                        className="release-item d-flex align-items-center gap-3 py-2 border-bottom text-reset text-decoration-none"
                      >
                        {/* Portada */}
                        {r.cover?.url && (
                          <img
                            src={r.cover.url}
                            alt={r.cover.alt || r.title}
                            className="release-cover"
                          />
                        )}

                        {/* 🔵 Forzamos texto oscuro y legible */}
                        <div className="text-dark">
                          <div className="fw-bold">{r.title}</div>
                          <div className="text-muted small">
                            {r.release_date?.slice(0, 4) || "—"} •{" "}
                            {r.format?.toUpperCase()}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* EDITORIALS */}
              {editorials.length > 0 && (
                <section className="mb-5">
                  <h3 className="section-subtitle">EDITORIAL</h3>

                  <div className="editorial-list">
                    {editorials.map((e) => (
                      <Link
                        to={`/editoriales/${e.slug}`}
                        key={e._id}
                        className="editorial-item d-flex align-items-center gap-3 py-2 border-bottom text-reset text-decoration-none"
                      >
                        {e.hero?.url && (
                          <img
                            src={e.hero.url}
                            alt={e.title}
                            className="editorial-thumb"
                          />
                        )}

                        <div className="text-dark">
                          <div className="fw-bold">{e.title}</div>
                          <div className="text-muted small">{e.subtitle}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* EVENTS */}
              {validEvents.length > 0 && (
                <section className="mb-5">
                  <h3 className="section-subtitle">EVENTS</h3>

                  <div className="event-list">
                    {validEvents.map((ev) => (
                      <Link
                        to={`/eventos/${ev.slug}`}
                        key={ev._id}
                        className="event-item d-flex justify-content-between align-items-center py-2 border-bottom text-reset text-decoration-none"
                      >
                        <div className="text-dark">
                          <div className="fw-bold">{ev.title}</div>
                          <div className="text-muted small">
                            {ev.city && ev.country
                              ? `${ev.city}, ${ev.country}`
                              : ev.city || ev.country || ""}
                          </div>
                        </div>

                        <div className="text-end text-muted small">
                          {formatEventDate(ev.date)}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* ==================== RELEASES TAB ==================== */}
          {tab === "releases" && (
            <section>
              {releasesByYear.map(([year, items]) => (
                <div key={year} className="mb-4">
                  <h3 className="section-subtitle">{year}</h3>
                  <ul className="list-unstyled columns-2">
                    {items.map((r) => (
                      <li key={r._id} className="mb-1">
                        <Link
                          to={`/releases/${r._id}`}
                          className="text-dark text-decoration-none"
                        >
                          {r.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {/* ==================== LINKS TAB ==================== */}
          {tab === "links" && (
            <section className="links-grid">
              {["web", "social", "streaming"].map((group) =>
                links[group].length > 0 ? (
                  <div key={group}>
                    <h3 className="section-subtitle">{group.toUpperCase()}</h3>
                    <ul className="list-unstyled">
                      {links[group].map((l, i) => (
                        <li key={i}>
                          <a href={l.url} target="_blank" rel="noreferrer">
                            {l.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}
            </section>
          )}
        </div>

        {/* ---------------- SIDEBAR ---------------- */}
        <div className="col-12 col-lg-4">
          <aside className="artist-sidebar">
            {heroImage && (
              <img
                src={heroImage}
                alt={artist.name}
                className="img-fluid mb-2 border"
              />
            )}
          </aside>
        </div>
      </div>

      {/* ---------------- PREV / NEXT ---------------- */}
      {(prevNext?.prev || prevNext?.next) && (
        <div className="artist-footer-nav">
          <div className="container-fluid d-flex justify-content-between">
            {prevNext.prev ? (
              <button
                className="btn btn-link text-white p-0"
                onClick={() => navigate(`/artistas/${prevNext.prev.slug}`)}
              >
                ◀ {prevNext.prev.name}
              </button>
            ) : (
              <span />
            )}

            {prevNext.next ? (
              <button
                className="btn btn-link text-white p-0"
                onClick={() => navigate(`/artistas/${prevNext.next.slug}`)}
              >
                {prevNext.next.name} ▶
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}
    </div>
  );
}