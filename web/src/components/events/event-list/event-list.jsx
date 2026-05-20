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
export default function EventList({
  title = "All Events",
  scope = "Worldwide",
  events = [],
}) {
  const safeEvents = Array.isArray(events) ? events : [];

  const getDate = (e) => {
    if (!e) return null;
    const raw =
      e.datetime || e.date || e.startDate || e.startsAt || null;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const sorted = useMemo(() => {
    return [...safeEvents]
      .filter(Boolean)
      .sort((a, b) => {
        const da = getDate(a);
        const db = getDate(b);
        const ta = da ? da.getTime() : 0;
        const tb = db ? db.getTime() : 0;
        return ta - tb;
      });
  }, [safeEvents]);

  return (
    <section className="events-wrap container-fluid px-0 bg-black text-white">
      <header className="events-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-dark">
        <h2 className="m-0 text-uppercase small">
          {title} ({sorted.length})
        </h2>
        <div className="text-uppercase small">{scope}</div>
      </header>

      {sorted.length > 0 ? (
        <ul className="list-unstyled m-0">
          {sorted.map((e, idx) => (
            <li
              key={e.id || e._id || idx}
              className="border-bottom border-dark"
            >
              <EventItem event={e} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-3 py-4 text-secondary">
          No hay eventos programados.
        </div>
      )}
    </section>
  );
}