// src/pages/artist-detail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ArtistDetail from "../components/artists/artist-detail/artist-detail";
import AdminEditLink from "../components/admin/admin-edit-link";
import SiteLoader from "../components/ui/site-loader.jsx";
export default function ArtistDetailPage() {
  const { slug } = useParams();

  const [artist, setArtist] = useState(null);
  const [prevNext, setPrevNext] = useState(null);

  const [releases, setReleases] = useState([]);
  const [editorials, setEditorials] = useState([]);
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadArtistAndRelated() {
      try {
        setLoading(true);
        setError(null);

        // 1) ARTISTA POR SLUG
        const res = await fetch(`/api/v1/artists/slug/${slug}`);
        if (!res.ok) {
          throw new Error(`No encontrado: ${res.status}`);
        }
        const artistData = await res.json();
        setArtist(artistData);

        // 2) LISTA PARA PREV / NEXT
        const resList = await fetch("/api/v1/artists");
        const list = await resList.json();

        const ordered = list.sort((a, b) =>
          a.name.localeCompare(b.name, "es", { sensitivity: "base" })
        );
        const index = ordered.findIndex((a) => a.slug === slug);
        setPrevNext({
          prev: ordered[index - 1] || null,
          next: ordered[index + 1] || null,
        });

        // 3) RELEASES + EDITORIALS + EVENTS EN PARALELO
        const [relRes, edRes, evRes] = await Promise.all([
          fetch("/api/v1/releases"),
          fetch(`/api/v1/editorials?artist=${artistData._id}`),
          fetch(`/api/v1/events?artist=${artistData._id}&from=${encodeURIComponent(new Date().toISOString())}`),
        ]);

        // RELEASES
        const relJson = await relRes.json();
        const allReleases = Array.isArray(relJson) ? relJson : relJson.data || [];
        const artistReleases = allReleases.filter((r) => {
          const artistId =
            typeof r.artist === "string" ? r.artist : r.artist?._id;
          return artistId === artistData._id || r.artist?.slug === artistData.slug;
        });
        setReleases(artistReleases);

        const edJson = edRes?.ok ? await edRes.json() : null;
        const allEditorials = Array.isArray(edJson) ? edJson : edJson?.data || [];
        setEditorials(allEditorials);

        // La ficha solo muestra próximos conciertos; el histórico queda en Eventos.
        const evJson = await evRes.json();
        const artistEvents = Array.isArray(evJson) ? evJson : evJson.data || [];
        setEvents(artistEvents);
      } catch (err) {
        console.error("Error en ArtistDetailPage:", err);
        setError("No se pudo cargar el artista.");
      } finally {
        setLoading(false);
      }
    }

    loadArtistAndRelated();
  }, [slug]);

  // Loading
  if (loading) {
    return <SiteLoader />;
  }

  // Error
  if (error) {
    return (
      <div className="alert alert-danger text-center mt-4">
        {error}
      </div>
    );
  }

  // No encontrado
  if (!artist) {
    return (
      <div className="text-center text-white py-5">
        Artista no encontrado.
      </div>
    );
  }

  // Render principal
  return (
    <div className="admin-edit-detail">
      <AdminEditLink to={`/admin/edit-artist/${artist.slug}`} label={`a ${artist.name}`} />
      <ArtistDetail key={artist._id}
        artist={artist}
        prevNext={prevNext}
        releases={releases}
        editorials={editorials}
        events={events}
      />
    </div>
  );
}
