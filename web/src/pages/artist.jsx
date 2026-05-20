import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ArtistList from "../components/artists/artist-list/artist-list";

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
                .replace(/[^\w\-]+/g, "")
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
    <div className="artists-page bg-black text-white min-vh-100">

      <section className="artists-content">
        {loading && (
          <div className="text-center text-secondary py-4">
            Cargando artistas…
          </div>
        )}

        {error && (
          <div className="alert alert-danger rounded-0 mb-0" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <ArtistList title="Current Artists" artists={artists} />
        )}
      </section>
    </div>
  );
}