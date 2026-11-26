import { releaseListenUrl } from "../../../utils/release-listen-url";
import { cleanBiography } from "../../../utils/artist-biography";
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../../index.css";
import { sortReleases } from "../../../utils/release-order";

import { artistPhotoUrl } from "../../../utils/artist-photo";
import { artistLinks } from "../../../utils/artist-links";

const LINK_GROUPS = [
  ["links", "Enlaces"],
  ["streaming", "Escucha"],
];

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

function releaseFormat(format) {
  const normalized = format?.toLowerCase();
  if (normalized === "single") return "Single";
  if (normalized === "ep") return "EP";
  if (["lp", "album", "álbum", "disco"].includes(normalized)) return "Disco";
  return "Lanzamiento";
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
  const [heroRatio, setHeroRatio] = useState(4 / 3);
  const [failedPhotoUrls, setFailedPhotoUrls] = useState([]);
  const sortedReleases = useMemo(() => sortReleases(releases), [releases]);

  const releasesByYear = useMemo(() => {
    const grouped = sortedReleases.reduce((result, release) => {
      const year = release.release_date?.slice(0, 4) || release.year || "—";
      if (!result[year]) result[year] = [];
      result[year].push(release);
      return result;
    }, {});
    return Object.entries(grouped).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [sortedReleases]);

  if (!artist) return null;

  const photos = [artist.photos?.coverUrl, artist.photos?.portraitUrl, artist.image?.url].map(artistPhotoUrl);
  const heroImage = photos.find((url) => url && !failedPhotoUrls.includes(url));
  const hasHeroImage = Boolean(heroImage);
  const portraitImage = photos[1] && !failedPhotoUrls.includes(photos[1]) ? photos[1] : null;
  const profileLinks = artistLinks(artist);
  const links = {
    links: profileLinks.filter((link) => link.group !== "streaming"),
    streaming: profileLinks.filter((link) => link.group === "streaming"),
  };
  const hasAnyLinks = Object.values(links).some((group) => group.length > 0);
  const validEvents = events.filter((event) => event && (event.title || event.city || event.venue));
  const location = [artist.city, artist.country].filter(Boolean).join(", ");
  const members = artist.members || [];

  return (
    <main
      className={`artist-detail artist-detail--${tab} artist-detail--${artist.slug}${hasHeroImage ? " artist-detail--has-photo" : ""}`}
      style={hasHeroImage ? { "--artist-photo-ratio": heroRatio } : undefined}
    >
      <header className="artist-detail__hero">
        <div className="artist-detail__identity">
          <h1>{artist.name}<span aria-hidden="true">●</span></h1>
          <div className="artist-detail__facts">
            {artist.genres?.length > 0 && <span>{artist.genres.join(" / ")}</span>}
            {location && <span>{location}</span>}
            {artist.formedYear && <span>Desde {artist.formedYear}</span>}
          </div>
        </div>
        {hasHeroImage && <div className="artist-detail__visual">
            <img
              src={heroImage}
              alt={artist.name}
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                if (naturalWidth && naturalHeight) setHeroRatio(naturalWidth / naturalHeight);
              }}
              onError={() => setFailedPhotoUrls((urls) => [...urls, heroImage])}
            />
        </div>}
      </header>

      <nav className="artist-detail__tabs" aria-label="Contenido del artista">
        <button className={tab === "overview" ? "is-active" : ""} aria-pressed={tab === "overview"} onClick={() => setTab("overview")}>↳ Perfil</button>
        <button className={tab === "releases" ? "is-active" : ""} aria-pressed={tab === "releases"} onClick={() => setTab("releases")}>↳ Catálogo</button>
        <button className={tab === "links" ? "is-active" : ""} aria-pressed={tab === "links"} onClick={() => setTab("links")} disabled={!hasAnyLinks}>↳ Enlaces</button>
      </nav>

      {tab === "overview" && (
        <div className="artist-detail__overview">
          <section className="artist-detail__bio">
            <p className="detail-section-label">Biografía</p>
            {artist.bio ? (
              <>
                {artist.bioHtml
                  ? <div className={`artist-bio-copy${expandedBio || artist.bio.length <= 430 ? " is-expanded" : ""}`} dangerouslySetInnerHTML={{ __html: cleanBiography(artist.bioHtml) }} />
                  : <p className={expandedBio ? "is-expanded" : ""}>{artist.bio}</p>}
                {artist.bio.length > 430 && (
                  <button className="artist-detail__more" aria-expanded={expandedBio} onClick={() => setExpandedBio((value) => !value)}>
                    {expandedBio ? "Mostrar menos −" : "Seguir leyendo +"}
                  </button>
                )}
              </>
            ) : <p className="artist-detail__empty-copy">Biografía próximamente.</p>}
            {members.length > 1 && <p>{members.join(" · ")}</p>}
            {artist.gallery?.length > 0 && <div className="artist-profile-gallery">
              {artist.gallery.map((image, index) => <figure key={index}>
                <img src={image.url} alt={image.alt || ""} loading="lazy" />
                {image.caption && <figcaption>{image.caption}</figcaption>}
              </figure>)}
            </div>}
          </section>

          <aside className="artist-detail__rail">
            {portraitImage && portraitImage !== heroImage && <img src={portraitImage} alt="" />}
            {LINK_GROUPS.map(([key, title]) => links[key].length > 0 && (
              <section key={key}>
                <p className="detail-section-label">{title}</p>
                <ul>
                  {links[key].map(({ label, url }, index) => (
                    <li key={index}><a data-outbound={key === "streaming" ? "listen" : undefined} href={url} target="_blank" rel="noreferrer">↳ {label}</a></li>
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
            <p className="detail-section-label">Catálogo</p>
            <span>{String(releases.length).padStart(2, "0")}</span>
          </div>
          {releasesByYear.length ? releasesByYear.map(([year, items]) => (
            <div className="artist-detail__year" key={year}>
              <h2>{year}</h2>
              <div>
                {items.map((release) => (
                  <a
                    className="artist-release"
                    data-outbound="listen" href={releaseListenUrl(release) || undefined}
                    target={releaseListenUrl(release) ? "_blank" : undefined}
                    rel={releaseListenUrl(release) ? "noopener noreferrer" : undefined}
                    key={release._id}
                  >
                    {(release.cover?.url || release.cover_image) ? (
                      <img src={release.cover?.url || release.cover_image} alt={release.cover?.alt || release.title} />
                    ) : <span className="artist-release__placeholder" aria-hidden="true" />}
                    <span className="artist-release__name">{release.title}</span>
                    <small>{releaseFormat(release.format)}{releaseListenUrl(release) ? " ↗" : ""}</small>
                  </a>
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
              {links[key].map(({ label, url }, index) => (
                <a data-outbound={key === "streaming" ? "listen" : undefined} href={url} target="_blank" rel="noreferrer" key={index}><span>{label}</span><span>↗</span></a>
              ))}
            </div>
          ))}
        </section>
      )}

      {tab === "overview" && (releases.length > 0 || editorials.length > 0 || validEvents.length > 0) && (
        <section className="artist-detail__related">
          {releases.length > 0 && (
            <div className="artist-related-block">
              <p className="detail-section-label">Catálogo</p>
              {sortedReleases.slice(0, 4).map((release) => {
                const listenUrl = releaseListenUrl(release);
                const content = <><span>{release.title}</span><small>{releaseFormat(release.format)} · {release.release_date?.slice(0, 4) || "—"}{listenUrl ? " ↗" : ""}</small></>;
                return listenUrl ? (
                  <a data-outbound="listen" href={listenUrl} target="_blank" rel="noopener noreferrer" key={release._id}>{content}</a>
                ) : (
                  <div className="artist-related-block__unavailable" key={release._id}>{content}</div>
                );
              })}
            </div>
          )}
          {editorials.length > 0 && (
            <div className="artist-related-block artist-related-block--events">
              <p className="detail-section-label">Editorial</p>
              {editorials.slice(0, 4).map((editorial) => (
                <Link to={`/editorial/${editorial.slug}`} key={editorial._id || editorial.slug}><span>{editorial.title}</span><small>Leer ↗</small></Link>
              ))}
            </div>
          )}
          {validEvents.length > 0 && (
            <div className="artist-related-block">
              <p className="detail-section-label">Próximas fechas</p>
              {validEvents.slice(0, 4).map((event) => {
                const ticketUrl = [event.ticketUrl, event.url].find(
                  (url) => typeof url === "string" && /^https?:\/\//i.test(url)
                );
                const content = <><span>{event.title || event.venue}</span><small>{formatEventDate(event.date)} · {ticketUrl ? "Entradas ↗" : "Entradas próximamente"}</small></>;
                return ticketUrl ? (
                  <a data-outbound="ticket" href={ticketUrl} target="_blank" rel="noopener noreferrer" key={event._id}>{content}</a>
                ) : (
                  <div className="artist-related-block__unavailable" key={event._id}>{content}</div>
                );
              })}
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
