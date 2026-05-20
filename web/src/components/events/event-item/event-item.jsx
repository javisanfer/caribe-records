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
      ? d.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "TBA";

  // 🛡️ Normalización de strings
  const artist = event.artist || "Unknown Artist";
  const city = event.city || "";
  const country = event.country || "";
  const venue = event.venue || "—";
  const url = event.url || "#";

  // 👇 NUEVO: slug del artista si existe
  const artistSlug = event.artistSlug;

  return (
    <div
      className="d-flex align-items-center text-decoration-none event-row px-3 py-2"
      aria-label={`${artist} en ${city}${country ? ", " + country : ""} — ${dateLabel}`}
    >
      {/* 1) ARTISTA (link si hay slug, texto si no) */}
      <div className="flex-grow-1 fw-semibold text-white text-truncate">
        {artistSlug ? (
          <Link
            to={`/artistas/${artistSlug}`}
            className="text-white text-decoration-none"
          >
            {artist}
          </Link>
        ) : (
          artist
        )}
      </div>

      {/* 2) CIUDAD / PAÍS */}
      <div className="event-cell text-white-50 text-truncate">
        {city}
        {country ? `, ${country}` : ""}
      </div>

      {/* 3) VENUE */}
      <div className="event-cell text-white-50 text-truncate">
        {venue}
      </div>

      {/* 4) FECHA */}
      <div className="event-cell text-end text-white text-nowrap">
        {dateLabel}
      </div>

      {/* 5) LINK TICKETS */}
      <div className="ms-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="btn btn-sm btn-outline-light rounded-0"
        >
          Tickets
        </a>
      </div>
    </div>
  );
}