import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../../index.css";

const LINK_GROUPS = [
  ["web", "Web"],
  ["social", "Social"],
  ["streaming", "Escucha"],
];

function humanizeLabel(label) {
  return label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatEventDate(value) {
  if (!value) return "Próximamente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Próximamente";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ArtistDetail({
  artist,
  prevNext,
  releases = [],
  editorials = [],
  events = [],
}) {
  const [tab, setTab] = useState("overview");
  const [expandedBio, setExpandedBio] = useState(false);

  const releasesByYear = useMemo(() => {
    const grouped = releases.reduce((result, release) => {
      const year = release.release_date?.slice(0, 4) || release.year || "—";
      if (!result[year]) result[year] = [];
      result[year].push(release);
      return result;
    }, {});
    return Object.entries(grouped).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [releases]);

  if (!artist) return null;

  const heroImage = artist.photos?.coverUrl || artist.photos?.portraitUrl || artist.image?.url;
  const portraitImage = artist.photos?.portraitUrl || artist.image?.url || artist.photos?.coverUrl;
  const links = {
    web: Object.entries(artist.web || {}).filter(([, url]) => Boolean(url)),
    social: Object.entries(artist.social || {}).filter(([, url]) => Boolean(url)),
    streaming: Object.entries(artist.streaming || {}).filter(([, url]) => Boolean(url)),
  };
  const hasAnyLinks = Object.values(links).some((group) => group.length > 0);
  const validEvents = events.filter((event) => event && (event.title || event.city || event.venue));
  const location = [artist.city, artist.country].filter(Boolean).join(", ");

  return (
    <main className="artist-detail">
      <nav className="artist-detail__tabs" aria-label="Contenido del artista">
        <button className={tab === "overview" ? "is-active" : ""} onClick={() => setTab("overview")}>↳ Perfil</button>
        <button className={tab === "releases" ? "is-active" : ""} onClick={() => setTab("releases")}>↳ Discografía</button>
        <button className={tab === "links" ? "is-active" : ""} onClick={() => setTab("links")} disabled={!hasAnyLinks}>↳ Enlaces</button>
      </nav>

      <header className="artist-detail__hero">
        <div className="artist-detail__identity">
          <p className="artist-detail__kicker">Artista / Caribe Records</p>
          <h1>{artist.name}<span aria-hidden="true">●</span></h1>
          <div className="artist-detail__facts">
            {artist.genres?.length > 0 && <span>{artist.genres.join(" / ")}</span>}
            {location && <span>{location}</span>}
            {artist.formedYear && <span>Desde {artist.formedYear}</span>}
          </div>
        </div>
        <div className={`artist-detail__visual ${heroImage ? "" : "is-empty"}`}>
          {heroImage ? <img src={heroImage} alt={artist.name} /> : <span>CR</span>}
        </div>
      </header>

      {tab === "overview" && (
        <div className="artist-detail__overview">
          <section className="artist-detail__bio">
            <p className="detail-section-label">Biografía</p>
            {artist.bio ? (
              <>
                <p className={expandedBio ? "is-expanded" : ""}>{artist.bio}</p>
                {artist.bio.length > 430 && (
                  <button className="artist-detail__more" onClick={() => setExpandedBio((value) => !value)}>
                    {expandedBio ? "Mostrar menos −" : "Seguir leyendo +"}
                  </button>
                )}
              </>
            ) : <p className="artist-detail__empty-copy">Biografía próximamente.</p>}
          </section>

          <aside className="artist-detail__rail">
            {portraitImage && portraitImage !== heroImage && <img src={portraitImage} alt="" />}
            {LINK_GROUPS.map(([key, title]) => links[key].length > 0 && (
              <section key={key}>
                <p className="detail-section-label">{title}</p>
                <ul>
                  {links[key].map(([label, url]) => (
                    <li key={label}><a href={url} target="_blank" rel="noreferrer">↳ {humanizeLabel(label)}</a></li>
                  ))}
                </ul>
              </section>
            ))}
          </aside>
        </div>
      )}

      {tab === "releases" && (
        <section className="artist-detail__catalogue">
          <div className="artist-detail__catalogue-heading">
            <p className="detail-section-label">Discografía</p>
            <span>{String(releases.length).padStart(2, "0")}</span>
          </div>
          {releasesByYear.length ? releasesByYear.map(([year, items]) => (
            <div className="artist-detail__year" key={year}>
              <h2>{year}</h2>
              <div>
                {items.map((release) => (
                  <Link className="artist-release" to={`/releases/${release._id}`} key={release._id}>
                    {(release.cover?.url || release.cover_image) ? (
                      <img src={release.cover?.url || release.cover_image} alt={release.cover?.alt || release.title} />
                    ) : <span className="artist-release__placeholder">CR</span>}
                    <span className="artist-release__name">{release.title}</span>
                    <small>{release.format?.toUpperCase() || "RELEASE"} ↗</small>
                  </Link>
                ))}
              </div>
            </div>
          )) : <p className="artist-detail__empty-copy">No hay lanzamientos publicados todavía.</p>}
        </section>
      )}

      {tab === "links" && (
        <section className="artist-detail__links-view">
          {LINK_GROUPS.map(([key, title]) => links[key].length > 0 && (
            <div key={key}>
              <p className="detail-section-label">{title}</p>
              {links[key].map(([label, url]) => (
                <a href={url} target="_blank" rel="noreferrer" key={label}><span>{humanizeLabel(label)}</span><span>↗</span></a>
              ))}
            </div>
          ))}
        </section>
      )}

      {tab === "overview" && (releases.length > 0 || editorials.length > 0 || validEvents.length > 0) && (
        <section className="artist-detail__related">
          {releases.length > 0 && (
            <div className="artist-related-block">
              <p className="detail-section-label">Últimos lanzamientos</p>
              {releases.slice(0, 4).map((release) => (
                <Link to={`/releases/${release._id}`} key={release._id}><span>{release.title}</span><small>{release.release_date?.slice(0, 4) || "—"} ↗</small></Link>
              ))}
            </div>
          )}
          {editorials.length > 0 && (
            <div className="artist-related-block">
              <p className="detail-section-label">Editorial</p>
              {editorials.slice(0, 4).map((editorial) => (
                <Link to={`/editorial/${editorial.slug}`} key={editorial._id}><span>{editorial.title}</span><small>Leer ↗</small></Link>
              ))}
            </div>
          )}
          {validEvents.length > 0 && (
            <div className="artist-related-block">
              <p className="detail-section-label">Próximas fechas</p>
              {validEvents.slice(0, 4).map((event) => (
                <Link to={`/eventos/${event.slug}`} key={event._id}><span>{event.title || event.venue}</span><small>{formatEventDate(event.date)} ↗</small></Link>
              ))}
            </div>
          )}
        </section>
      )}

      {(prevNext?.prev || prevNext?.next) && (
        <nav className="detail-pagination artist-detail__pagination" aria-label="Más artistas">
          {prevNext.prev ? <Link to={`/artistas/${prevNext.prev.slug}`}><small>Anterior</small><span>← {prevNext.prev.name}</span></Link> : <span />}
          {prevNext.next ? <Link to={`/artistas/${prevNext.next.slug}`}><small>Siguiente</small><span>{prevNext.next.name} →</span></Link> : <span />}
        </nav>
      )}
    </main>
  );
}
