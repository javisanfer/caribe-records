import React, { useMemo, useState } from "react";
import PosterGallery from "../poster-gallery";
import EventItem from "../event-item/event-item";
import AdminEditLink from "../../admin/admin-edit-link";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
});
const madridDate = (date) => formatter.format(date);

function EventRows({ events, past = false, onOpenPoster }) {
  return (
    <ul className="event-index">
      {events.map((event) => (
        <li className="admin-edit-context" key={event.id}>
          <EventItem event={event} past={past} onOpenPoster={onOpenPoster} />
          <AdminEditLink
            to={`/admin/edit-event/${event.slug || event.id}`}
            label={`el evento ${event.title || event.artist}`}
          />
        </li>
      ))}
    </ul>
  );
}

export default function EventList({ events = [] }) {
  const [openedPoster, setOpenedPoster] = useState(null);
  const { upcoming, history, posters } = useMemo(() => {
    const today = madridDate(new Date());
    const dated = (Array.isArray(events) ? events : [])
      .filter((event) => event?.datetime)
      .map((event) => ({ ...event, parsedDate: new Date(event.datetime) }))
      .filter((event) => !Number.isNaN(event.parsedDate.getTime()));
    const upcoming = dated.filter((event) => madridDate(event.parsedDate) >= today)
      .sort((a, b) => a.parsedDate - b.parsedDate);
    const past = dated.filter((event) => madridDate(event.parsedDate) < today)
      .sort((a, b) => b.parsedDate - a.parsedDate);
    const byYear = new Map();
    past.forEach((event) => {
      const year = madridDate(event.parsedDate).slice(0, 4);
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push(event);
    });
    return { upcoming, history: [...byYear], posters: past.filter((event) => event.posterUrl) };
  }, [events]);

  if (!upcoming.length && !history.length) {
    return <div className="public-index__status">No hay eventos publicados.</div>;
  }

  return (
    <div className="events-wrap">
      <section className="event-section" aria-labelledby="event-upcoming-title">
        <header className="event-section__heading">
          <h2 id="event-upcoming-title">Próximos conciertos</h2>
          <span>{String(upcoming.length).padStart(2, "0")}</span>
        </header>
        {upcoming.length ? (
          <>
            <div className="event-index__labels" aria-hidden="true"><span>Artista</span><span>Lugar</span><span>Fecha</span><span>Entradas</span></div>
            <EventRows events={upcoming} />
          </>
        ) : <p className="event-section__empty">Próximas fechas por anunciar.</p>}
      </section>

      {history.length > 0 && (
        <section className="event-section event-section--archive" aria-labelledby="event-archive-title">
          <header className="event-section__heading">
            <h2 id="event-archive-title">Conciertos pasados</h2>
            <span>{String(history.reduce((total, [, items]) => total + items.length, 0)).padStart(2, "0")}</span>
          </header>
          {history.map(([year, items]) => (
            <details className="event-year" key={year}>
              <summary>
                <span className="event-year__year">{year}</span>
                <span className="event-year__count">{items.length} {items.length === 1 ? "concierto" : "conciertos"}</span>
                <span className="event-year__toggle" aria-hidden="true">↗</span>
              </summary>
              <EventRows events={items} past onOpenPoster={(id, trigger) => setOpenedPoster({ id, trigger })} />
            </details>
          ))}
        </section>
      )}
      {openedPoster && (
        <PosterGallery posters={posters} opened={openedPoster} onClose={() => setOpenedPoster(null)} />
      )}
    </div>
  );
}
