import { useContentView } from "../analytics/use-audience";
import { usePageMeta } from "../utils/page-meta";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EditorialDetail from "../components/editorials/editorial-detail/editorial-detail";
import SiteLoader from "../components/ui/site-loader.jsx";
import AdminEditLink from "../components/admin/admin-edit-link";

export default function EditorialDetailPage() {
  const { slug } = useParams();
  const [editorial, setEditorial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/editorials/slug/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Editorial unavailable");
        return res.json();
      })
      .then(setEditorial)
      .catch(() => setEditorial(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useContentView("editorial", editorial);
  usePageMeta(`/editorial/${encodeURIComponent(slug)}`, editorial?.seo?.title || editorial?.title, editorial?.seo?.description || editorial?.excerpt || editorial?.subtitle, editorial?.seo?.ogImage || editorial?.hero?.url, "article");

  if (loading) return <SiteLoader />;
  if (!editorial) {
    return <p className="detail-state detail-state--error">No se encontró este artículo editorial.</p>;
  }

  return (
    <main className="editorial-detail-page">
      <Link to="/editoriales" className="detail-back-link">← Editorial</Link>
      <AdminEditLink to={`/admin/edit-editorial/${encodeURIComponent(editorial.slug)}`} label={editorial.title}>Editar editorial</AdminEditLink>
      <EditorialDetail editorial={editorial} />
    </main>
  );
}
