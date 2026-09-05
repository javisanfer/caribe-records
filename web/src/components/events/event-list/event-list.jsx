// src/components/events/event-list/event-list.jsx
import React, { useMemo } from "react";
import EventItem from "../event-item/event-item";

/**
 * Espera events con forma:
 * {
 *   id: string,
 *   artist: string,
 *   artistId?: string,
 *   artistSlug?: string,
 *   title?: string,
 *   city?: string,
 *   country?: string,
 *   venue?: string,
 *   datetime?: string,  // ISO
 *   url?: string
 * }
 */
export default function EventList({ events = [] }) {
  const getDate = (e) => {
    if (!e) return null;
    const raw =
      e.datetime || e.date || e.startDate || e.startsAt || null;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const sorted = useMemo(() => {
    const safeEvents = Array.isArray(events) ? events : [];
    return [...safeEvents]
      .filter(Boolean)
      .sort((a, b) => {
        const da = getDate(a);
        const db = getDate(b);
        const ta = da ? da.getTime() : 0;
        const tb = db ? db.getTime() : 0;
        return ta - tb;
      });
  }, [events]);

  return (
    <section className="events-wrap">
      <header className="event-index__labels" aria-hidden="true">
        <span>Artista</span>
        <span>Lugar</span>
        <span>Fecha</span>
        <span>Entradas</span>
      </header>

      {sorted.length > 0 ? (
        <ul className="event-index">
          {sorted.map((e, idx) => (
            <li
              key={e.id || e._id || idx}
            >
              <EventItem event={e} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="public-index__status">
          No hay eventos programados.
        </div>
      )}
    </section>
  );
}
