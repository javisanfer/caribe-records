import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EditorialDetail from "../components/editorials/editorial-detail/editorial-detail";
import AdminEditLink from "../components/admin/admin-edit-link";

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
        const [detailRes, listRes] = await Promise.all([
          fetch(`/api/v1/editorials/slug/${slug}`),
          fetch("/api/v1/editorials"),
        ]);
        if (!detailRes.ok) throw new Error("No se pudo cargar el editorial");

        const detail = await detailRes.json();
        setEditorial(detail);

        if (listRes.ok) {
          const payload = await listRes.json();
          const items = Array.isArray(payload) ? payload : payload.data || [];
          const ordered = [...items].sort(
            (a, b) => new Date(b.publishAt || b.createdAt || 0) - new Date(a.publishAt || a.createdAt || 0)
          );
          const index = ordered.findIndex((item) => item.slug === slug);
          setPrevNext({
            prev: index > 0 ? ordered[index - 1] : null,
            next: index >= 0 ? ordered[index + 1] || null : null,
          });
        }
      } catch (err) {
        console.error(err);
        setError("No se encontró este artículo editorial.");
      } finally {
        setLoading(false);
      }
    }
    loadEditorial();
  }, [slug]);

  if (loading) return <p className="detail-state">Cargando artículo…</p>;
  if (error) return <p className="detail-state detail-state--error">{error}</p>;

  return (
    <main className="editorial-detail-page">
      <Link to="/editoriales" className="detail-back-link">← Editorial</Link>
      <div className="admin-edit-detail__action">
        <AdminEditLink
          to={`/admin/edit-editorial/${editorial.slug}`}
          label={`el editorial ${editorial.title}`}
        />
      </div>
      <EditorialDetail editorial={editorial} prevNext={prevNext} />
    </main>
  );
}
