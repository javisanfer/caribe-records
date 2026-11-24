import React, { useEffect, useState } from "react";
import EditorialList from "../components/editorials/editorial-list/editorial-list";
import PublicIndexPage from "../components/layouts/public-index-page/public-index-page";
import { featuredEditorials } from "../data/featured-editorial";
import SiteLoader from "../components/ui/site-loader.jsx";

export default function EditorialPage() {
  const [editorials, setEditorials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/editorials")
      .then((res) => {
        if (!res.ok) throw new Error("Editorials unavailable");
        return res.json();
      })
      .then((json) => setEditorials(Array.isArray(json) ? json : json.data || []))
      .catch(() => setEditorials(featuredEditorials))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PublicIndexPage
      className="editorial-page"
      title="Editorial"
      count={loading ? null : editorials.length}
      countLabel="historias"
    >
      {loading ? <SiteLoader /> : <EditorialList editorials={editorials} />}
    </PublicIndexPage>
  );
}
