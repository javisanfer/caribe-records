import React from "react";

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
  const url = [event.ticketUrl, event.url].find(
    (value) => typeof value === "string" && /^https?:\/\//i.test(value)
  );

  const EventRoot = url ? "a" : "article";

  return (
    <EventRoot
      className="event-row"
      aria-label={`${artist} en ${city}${country ? ", " + country : ""} — ${dateLabel}`}
      {...(url ? { href: url, target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
    >
      <div className="event-row__artist">
        <strong>{artist}</strong>
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
        <span>{url ? <>Entradas <span aria-hidden="true">↗</span></> : "Próximamente"}</span>
      </div>
    </EventRoot>
  );
}
