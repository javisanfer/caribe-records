import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EventList from "../components/events/event-list/event-list";

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
    <div className="events-page bg-black text-white min-vh-100">
      <section>
        {loading && (
          <div className="text-center text-secondary py-4">
            Cargando eventos…
          </div>
        )}

        {error && (
          <div className="alert alert-danger rounded-0 m-3" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <EventList
            title="Upcoming Events"
            scope="Worldwide"
            events={events}
          />
        )}
      </section>
    </div>
  );
}