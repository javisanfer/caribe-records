import React, { useEffect, useState } from "react";
import EventList from "../components/events/event-list/event-list";
import PublicIndexPage from "../components/layouts/public-index-page/public-index-page";
import SiteLoader from "../components/ui/site-loader.jsx";

import { isPublicEventDate, madridDate } from "../utils/public-event-date";

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

        const today = madridDate(new Date());
        const normalized = rawEvents
          .filter((event) => isPublicEventDate(event?.date || event?.datetime, today))
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
              posterUrl: typeof e.posterUrl === "string" && /^(?:https?:\/\/|\/(?![/\\]))/i.test(e.posterUrl.trim())
                ? e.posterUrl.trim() : null,
            };
          });

        setEvents(normalized);
      } catch (err) {
        console.error("Error cargando eventos", err);
        setEvents([]);
        setError("No se pudo cargar la agenda.");
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
