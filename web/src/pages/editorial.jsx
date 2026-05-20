import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EditorialList from "../components/editorials/editorial-list/editorial-list";

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
    <div className="editorial-page bg-black text-white min-vh-100">
  
      {/* Contenido */}
      <section>
        {loading && (
          <div className="text-center text-secondary py-4">
            Cargando editoriales…
          </div>
        )}

        {error && (
          <div className="alert alert-danger rounded-0 m-3" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <EditorialList editorials={editorials} />
        )}
      </section>
    </div>
  );
}