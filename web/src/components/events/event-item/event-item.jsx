import { Link } from "react-router-dom";
import React from "react";

export default function EventItem({ event = {}, past = false }) {
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
          timeZone: "Europe/Madrid",
        })
      : "TBA";

  // 🛡️ Normalización de strings
  const artist = event.artist || "Unknown Artist";
  const city = event.city || "";
  const country = event.country || "";
  const venue = event.venue || "Por confirmar";
  const url = (past ? [event.sourceUrl] : [event.ticketUrl, event.url]).find(
    (value) => typeof value === "string" && /^https?:\/\//i.test(value)
  );



  return (
    <article
      className={`event-row${past ? " event-row--past" : ""}`}
      aria-label={`${artist} en ${city}${country ? ", " + country : ""} — ${dateLabel}`}
    >
      <div className="event-row__artist">
        <strong>{event.slug ? <Link className="content-permalink" to={`/eventos/${encodeURIComponent(event.slug)}`}>{artist}</Link> : artist}</strong>
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
        {url ? <a className="content-permalink" href={url} target="_blank" rel="noopener noreferrer nofollow">{past ? "Ver cartel" : "Entradas"} <span aria-hidden="true">↗</span></a> : <span>{past ? "Finalizado" : "Próximamente"}</span>}
      </div>
    </article>
  );
}
