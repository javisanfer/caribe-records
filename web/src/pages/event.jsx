import React, { useEffect, useState } from "react";
import EventList from "../components/events/event-list/event-list";
import PublicIndexPage from "../components/layouts/public-index-page/public-index-page";

export default function EventPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/v1/events", {
          cache: "no-store",        // 👈 importante
        });

        if (!res.ok) throw new Error("Error al cargar eventos");

        const json = await res.json();

        const rawEvents = Array.isArray(json) ? json : json.data || [];

        const normalized = rawEvents
          .filter(Boolean)
          .map((e, idx) => {
            const mainArtist =
              Array.isArray(e.lineup) && e.lineup.length > 0
                ? e.lineup[0]
                : null;

            return {
              id: e._id || idx,
              slug: e.slug || null,
              artist: mainArtist?.name || "Caribe Records",
              artistId: mainArtist?._id || null,
              artistSlug: mainArtist?.slug || null,
              title: e.title || "",
              city: e.city || "",
              country: e.country || "",
              venue: e.venue || "",
              datetime: e.date || e.datetime || null,
              url: e.ticketUrl || e.url || "#",
            };
          });

        setEvents(normalized);
      } catch (err) {
        console.error("Error cargando eventos", err);
        setError("No se pudieron cargar los eventos.");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  return (
    <PublicIndexPage
      className="events-page"
      title="Agenda"
      description="Próximas fechas, encuentros y directos de la familia Caribe."
      count={loading ? null : events.length}
      countLabel="eventos"
    >
        {loading && (
          <p className="public-index__status">Cargando agenda…</p>
        )}

        {error && (
          <p className="public-index__status public-index__status--error" role="alert">{error}</p>
        )}

        {!loading && !error && (
          <EventList events={events} />
        )}
    </PublicIndexPage>
  );
}
