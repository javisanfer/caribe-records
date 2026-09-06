// src/pages/artist-detail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ArtistDetail from "../components/artists/artist-detail/artist-detail";
import AdminEditLink from "../components/admin/admin-edit-link";

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
          fetch("/api/v1/editorials"),
          fetch(`/api/v1/events?artist=${artistData._id}`), // 👈 aquí filtramos por artista
        ]);

        // RELEASES
        const relJson = await relRes.json();
        const allReleases = Array.isArray(relJson) ? relJson : relJson.data || [];
        const artistReleases = allReleases.filter((r) => {
          const artistId =
            typeof r.artist === "string" ? r.artist : r.artist?._id;
          return artistId === artistData._id;
        });
        setReleases(artistReleases);

        // EDITORIALS (si usas un campo "artists" en la editorial)
        const edJson = await edRes.json();
        const allEditorials = Array.isArray(edJson) ? edJson : edJson.data || [];
        const artistEditorials = allEditorials.filter((e) => {
          if (!Array.isArray(e.artists)) return false;
          return e.artists.some((a) => {
            if (!a) return false;
            if (typeof a === "string") return a === artistData._id;
            return a._id === artistData._id;
          });
        });
        setEditorials(artistEditorials);

        // EVENTS (ya vienen filtrados por ?artist=)
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
    return (
      <div className="text-center text-secondary py-5">
        Cargando artista…
      </div>
    );
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
      <ArtistDetail
        artist={artist}
        prevNext={prevNext}
        releases={releases}
        editorials={editorials}
        events={events}
      />
    </div>
  );
}
