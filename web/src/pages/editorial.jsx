import React, { useEffect, useState } from "react";
import EditorialList from "../components/editorials/editorial-list/editorial-list";
import PublicIndexPage from "../components/layouts/public-index-page/public-index-page";

export default function EditorialPage() {
  const [editorials, setEditorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔁 Carga de datos
  useEffect(() => {
    async function loadEditorials() {
      try {
        setLoading(true);
        setError(null);

        // ✔️ URL correcta
        const res = await fetch("/api/v1/editorials");
        if (!res.ok) throw new Error("Error al cargar editoriales");

        // ✔️ El backend NO devuelve un array, sino { data: [...] }
        const json = await res.json();

        // ✔️ Este es el arreglo real
        setEditorials(json.data || []);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los artículos editoriales.");
      } finally {
        setLoading(false);
      }
    }

    loadEditorials();
  }, []);

  return (
    <PublicIndexPage
      className="editorial-page"
      title="Editorial"
      description="Historias, procesos y conversaciones alrededor de la música que editamos."
      count={loading ? null : editorials.length}
      countLabel="historias"
    >
        {loading && (
          <p className="public-index__status">Cargando editorial…</p>
        )}

        {error && (
          <p className="public-index__status public-index__status--error" role="alert">{error}</p>
        )}

        {!loading && !error && (
          <EditorialList editorials={editorials} />
        )}
    </PublicIndexPage>
  );
}
