import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import EditorialDetail from "../components/editorials/editorial-detail/editorial-detail";

export default function EditorialDetailPage() {
  const { slug } = useParams();

  const [editorial, setEditorial] = useState(null);
  const [prevNext, setPrevNext] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadEditorial() {
      try {
        setLoading(true);
        setError(null);

        // 👇 OJO: tu backend expone /editorials/slug/:slug
        const res = await fetch(`/api/v1/editorials/slug/${slug}`);

        if (!res.ok) throw new Error("No se pudo cargar el editorial");

        const data = await res.json();

        // Tu controller devuelve el doc directamente (no { editorial })
        setEditorial(data);
        setPrevNext({}); // de momento vacío, si luego haces prev/next lo rellenamos
      } catch (err) {
        console.error(err);
        setError("No se encontró este artículo editorial.");
      } finally {
        setLoading(false);
      }
    }

    loadEditorial();
  }, [slug]);

  if (loading)
    return (
      <div className="text-center text-secondary py-5">
        Cargando artículo…
      </div>
    );

  if (error)
    return <div className="alert alert-danger m-3">{error}</div>;

  return (
    <div className="editorial-detail-page">
      <Link
        to="/editoriales"
        className="text-white text-decoration-none small d-block px-3 py-2"
      >
        ← Volver
      </Link>

      <EditorialDetail editorial={editorial} prevNext={prevNext} />
    </div>
  );
}