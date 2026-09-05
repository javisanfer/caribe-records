import React, { useEffect, useState } from "react";
import ArtistList from "../components/artists/artist-list/artist-list";
import PublicIndexPage from "../components/layouts/public-index-page/public-index-page";

export default function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadArtists() {
      try {
        setLoading(true);
        setError(null);

        // URL correcta según tu API
        const res = await fetch("/api/v1/artists");

        if (!res.ok) {
          throw new Error(`Respuesta no válida: ${res.status}`);
        }

        const data = await res.json();

        // 🔧 Normalizar para garantizar id y slug
        const normalized = (data || []).map((a) => {
          const fallbackSlug = a.name
            ? a.name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^\w-]+/g, "")
            : undefined;

          return {
            ...a,
            id: a._id || a.id,
            slug: a.slug || fallbackSlug,              
            photo: a.photos?.portraitUrl || null,
          };
        });

        setArtists(normalized);
      } catch (err) {
        console.error("Error cargando artistas", err);
        setError("No se pudieron cargar los artistas.");
      } finally {
        setLoading(false);
      }
    }

    loadArtists();
  }, []);

  return (
    <PublicIndexPage
      className="artists-page"
      tone="blue"
      title="Artistas"
      description="Proyectos con voz propia, desde Madrid hacia cualquier lugar."
      count={loading ? null : artists.length}
      countLabel="artistas"
    >
        {loading && (
          <p className="public-index__status">Cargando artistas…</p>
        )}

        {error && (
          <p className="public-index__status public-index__status--error" role="alert">{error}</p>
        )}

        {!loading && !error && (
          <ArtistList artists={artists} />
        )}
    </PublicIndexPage>
  );
}
