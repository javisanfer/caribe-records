import React, { useEffect, useState } from "react";
import EditorialList from "../components/editorials/editorial-list/editorial-list";
import PublicIndexPage from "../components/layouts/public-index-page/public-index-page";
import { listEditorials } from "../services/api-services";
import SiteLoader from "../components/ui/site-loader.jsx";

export default function EditorialPage() {
  const [editorials, setEditorials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    listEditorials().then(setEditorials)
      .catch(() => setError("No se pudo cargar el archivo editorial."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PublicIndexPage
      className="editorial-page"
      title="Editorial"
      count={loading ? null : editorials.length}
      countLabel="historias"
    >
      {loading ? <SiteLoader /> : error ? <p role="alert">{error}</p> : <EditorialList editorials={editorials} />}
    </PublicIndexPage>
  );
}
