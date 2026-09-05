import React from "react";
import { Link } from "react-router-dom";

export default function EventItem({ event = {} }) {
  // 🛡️ Normalización de fecha
  const rawDate =
    event.datetime ||
    event.date ||
    event.startDate ||
    event.startsAt ||
    null;

  const d = rawDate ? new Date(rawDate) : null;

  const dateLabel =
    d && !Number.isNaN(d.getTime())
      ? d.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "TBA";

  // 🛡️ Normalización de strings
  const artist = event.artist || "Unknown Artist";
  const city = event.city || "";
  const country = event.country || "";
  const venue = event.venue || "Por confirmar";
  const url = event.url && event.url !== "#" ? event.url : null;

  // 👇 NUEVO: slug del artista si existe
  const artistSlug = event.artistSlug;

  return (
    <article
      className="event-row"
      aria-label={`${artist} en ${city}${country ? ", " + country : ""} — ${dateLabel}`}
    >
      <div className="event-row__artist">
        {artistSlug ? (
          <Link
            to={`/artistas/${artistSlug}`}
          >
            {artist}
          </Link>
        ) : (
          <strong>{artist}</strong>
        )}
        {event.title && <span>{event.title}</span>}
      </div>

      <div className="event-row__place">
        <strong>{venue}</strong>
        <span>{[city, country].filter(Boolean).join(", ") || "Ubicación por confirmar"}</span>
      </div>

      <time className="event-row__date" dateTime={rawDate || undefined}>
        {dateLabel}
      </time>

      <div className="event-row__ticket">
        {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          Entradas <span aria-hidden="true">↗</span>
        </a>
        ) : (
          <span>Próximamente</span>
        )}
      </div>
    </article>
  );
}
