import React from "react";

export default function EventItem({ event = {}, past = false, onOpenPoster }) {
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

  const ticketProps = {
    href: url, target: "_blank", rel: "noopener noreferrer nofollow",
    "data-outbound": "ticket", "data-content-type": "event", "data-content-slug": event.slug,
  };
  const heading = <><strong>{artist}</strong>{event.title && <span>{event.title}</span>}</>;

  return (
    <article
      className={`event-row${past ? " event-row--past" : ""}`}
      aria-label={`${artist} en ${city}${country ? ", " + country : ""} — ${dateLabel}`}
    >
      {!past && url ? (
        <a className="event-row__artist content-permalink" {...ticketProps}>{heading}</a>
      ) : <div className="event-row__artist">{heading}</div>}

      <div className="event-row__place">
        <strong>{venue}</strong>
        <span>{[city, country].filter(Boolean).join(", ") || "Ubicación por confirmar"}</span>
      </div>

      <time className="event-row__date" dateTime={rawDate || undefined}>
        {dateLabel}
      </time>

      <div className="event-row__ticket">
        {past && event.posterUrl ? (
          <button type="button" className="event-poster-trigger" aria-haspopup="dialog"
            onClick={(click) => onOpenPoster(event.id, click.currentTarget)}>
            Ver cartel
          </button>
        ) : url ? <a {...ticketProps} data-outbound={past ? undefined : "ticket"} className="content-permalink">{past ? "Ver cartel" : "Entradas"} <span aria-hidden="true">↗</span></a> : <span>{past ? "Finalizado" : "Próximamente"}</span>}
      </div>
    </article>
  );
}
