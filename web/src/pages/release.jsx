import React, { useEffect, useState } from "react";
import ReleaseList from "../components/releases/release-list/release-list";
import PublicIndexPage from "../components/layouts/public-index-page/public-index-page";

export default function ReleasePage() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReleases() {
      try {
        setLoading(true);
        setError(null);

        // 👈 ruta correcta al backend
        const res = await fetch("/api/v1/releases");
        if (!res.ok) {
          throw new Error(`Error al cargar releases: ${res.status}`);
        }

        const data = await res.json();

        // 🔧 Normalización para adaptarlo a ReleaseList / ReleaseItem
        const normalized = (data || []).map((r, idx) => {
          const artistObj = r.artist;

          const artistName =
            typeof artistObj === "string"
              ? artistObj
              : artistObj?.name || "Unknown Artist";

          return {
            id: r._id || idx,

            // datos “bonitos” para el front
            artistName,
            artistSlug:
              artistObj && typeof artistObj === "object"
                ? artistObj.slug
                : undefined,

            title: r.title || r.name || "Untitled",

            // fecha
            date: r.release_date || r.date || null,

            // portada
            cover: r.cover_image
              ? { url: r.cover_image, alt: r.title || r.name || "Cover" }
              : null,

            // tracklist
            tracks: (r.tracklist || []).map((t, i) => ({
              id: t._id || i,
              no: t.position || i + 1,
              title: t.title,
              artist: artistName,
              time: t.duration,
            })),

            // label / catálogo
            label: r.labelName || (typeof r.label === "object" ? r.label?.name : r.label) || "",
            catalogType: r.catalogType || "own",
            spotifyUrl: r.spotifyUrl || "",
            bandcampUrl: r.bandcampUrl || "",
            catalog: r.catalog || r.catNo || null,
          };
        });

        setReleases(normalized);
      } catch (err) {
        console.error("Error cargando releases", err);
        setError("No se pudieron cargar los releases.");
      } finally {
        setLoading(false);
      }
    }

    loadReleases();
  }, []);

  return (
    <PublicIndexPage
      className="release-page"
      title="Discografía"
      description="El catálogo completo de Caribe Records: lanzamientos, créditos y escucha."
      count={loading ? null : releases.length}
      countLabel="referencias"
    >
        {loading && (
          <p className="public-index__status">Cargando discografía…</p>
        )}

        {error && (
          <p className="public-index__status public-index__status--error" role="alert">{error}</p>
        )}

        {!loading && !error && (
          <ReleaseList releases={releases} />
        )}
    </PublicIndexPage>
  );
}
