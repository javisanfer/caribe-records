import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EditorialDetail from "../components/editorials/editorial-detail/editorial-detail";
import { featuredEditorial } from "../data/featured-editorial";
import SiteLoader from "../components/ui/site-loader.jsx";

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
      .catch(() => setEditorial(slug === featuredEditorial.slug ? featuredEditorial : null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <SiteLoader />;
  if (!editorial) {
    return <p className="detail-state detail-state--error">No se encontró este artículo editorial.</p>;
  }

  return (
    <main className="editorial-detail-page">
      <Link to="/editoriales" className="detail-back-link">← Editorial</Link>
      <EditorialDetail editorial={editorial} />
    </main>
  );
}
