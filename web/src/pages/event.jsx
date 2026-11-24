import React, { useEffect, useState } from "react";
import EventList from "../components/events/event-list/event-list";
import PublicIndexPage from "../components/layouts/public-index-page/public-index-page";
import SiteLoader from "../components/ui/site-loader.jsx";
import { curatedEvents } from "../data/curated-events.js";

// Registros antiguos de prueba que llegaron a publicarse en el catálogo local.
const previewSlugs = new Set(["prueba-1", "prueba-2", "aeronave-adolescente-live-at-apolo"]);
const eventKey = (event) => [event.datetime?.slice(0, 10), event.city?.toLowerCase(), event.venue?.toLowerCase()].join("|");

export default function EventPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);

        const rawEvents = [];
        let page = 1;
        let totalPages = 1;
        do {
          const res = await fetch(`/api/v1/events?limit=50&page=${page}`, { cache: "no-store" });
          if (!res.ok) throw new Error("Error al cargar eventos");
          const json = await res.json();
          rawEvents.push(...(Array.isArray(json) ? json : json.data || []));
          totalPages = Array.isArray(json) ? 1 : json.totalPages || 1;
          page += 1;
        } while (page <= totalPages);

        const normalized = rawEvents
          .filter((event) => event && !previewSlugs.has(event.slug))
          .map((e, idx) => {
            const mainArtist =
              Array.isArray(e.lineup) && e.lineup.length > 0
                ? e.lineup[0]
                : null;

            return {
              id: e._id || idx,
              slug: e.slug || null,
              artist: e.artistName || mainArtist?.name || "Caribe Records",
              artistId: mainArtist?._id || null,
              artistSlug: mainArtist?.slug || null,
              title: e.title || "",
              city: e.city || "",
              country: e.country || "",
              venue: e.venue || "",
              datetime: e.date || e.datetime || null,
              ticketUrl: e.ticketUrl || e.url || null,
              sourceUrl: e.sourceUrl || null,
            };
          });

        const known = new Set(normalized.map(eventKey));
        setEvents([...normalized, ...curatedEvents.filter((event) => !known.has(eventKey(event)))]);
      } catch (err) {
        console.error("Error cargando eventos", err);
        setEvents(curatedEvents);
        setError("No se pudieron cargar todas las fechas del archivo.");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  return (
    <PublicIndexPage
      className="events-page"
      title="Eventos"
      count={loading ? null : events.length}
      countLabel="eventos"
    >
        {loading && <SiteLoader />}

        {error && (
          <p className="public-index__status public-index__status--error" role="alert">{error}</p>
        )}

        {!loading && (
          <EventList events={events} />
        )}
    </PublicIndexPage>
  );
}
