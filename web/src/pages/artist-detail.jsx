import { usePageMeta } from "../utils/page-meta";
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
    const controller = new AbortController();
    async function loadArtistAndRelated() {
      try {
        setLoading(true);
        setError(null);

        // 1) ARTISTA POR SLUG
        const read = async (url) => {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error(String(res.status));
          return res.json();
        };
        const profile = read(`/api/v1/artists/slug/${encodeURIComponent(slug)}`);
        const related = profile.then((item) => {
          const id = encodeURIComponent(item._id);
          return Promise.all([
            read(`/api/v1/releases?artist=${id}`),
            read(`/api/v1/editorials?artist=${id}`),
            read(`/api/v1/events?artist=${id}&from=${encodeURIComponent(new Date().toISOString())}`),
          ]);
        });
        const [artistData, list, [records, articles, dates]] = await Promise.all([
          profile, read("/api/v1/artists"), related,
        ]);
        if (controller.signal.aborted) return;
        setArtist(artistData);
        const ordered = list.sort((a, b) =>
          a.name.localeCompare(b.name, "es", { sensitivity: "base" })
        );
        const index = ordered.findIndex((a) => a.slug === slug);
        setPrevNext({
          prev: ordered[index - 1] || null,
          next: ordered[index + 1] || null,
        });

        setReleases(records);
        setEditorials(articles.data || []);
        setEvents(dates.data || []);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Error en ArtistDetailPage:", err);
        setError("No se pudo cargar el artista.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadArtistAndRelated();
    return () => controller.abort();
  }, [slug]);

  usePageMeta(`/artistas/${encodeURIComponent(slug)}`, artist?.name, artist?.bio?.slice(0, 180), artist?.photos?.coverUrl);

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
