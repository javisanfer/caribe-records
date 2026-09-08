import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../../services/api-services";

const PAGE_SIZE = 15;

const TYPE_LABELS = {
  artist: "Artista",
  release: "Lanzamiento",
  event: "Evento",
  editorial: "Editorial",
  banner: "Banner",
};

const CREATE_LINKS = [
  ["01", "Artista", "/admin/new-artist"],
  ["02", "Lanzamiento", "/admin/new-release"],
  ["03", "Editorial", "/admin/new-editorial"],
  ["04", "Evento", "/admin/new-event"],
  ["05", "Banner", "/admin/new-banner"],
];

export default function AdminDashboardPage() {
  const [items, setItems] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ limit: "200" });
        if (typeFilter !== "all") params.set("type", typeFilter);
        const data = await http.get(`/admin/activity?${params}`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setItems(data.data || []);
        setCurrentPage(1);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        console.error("Error loading activity:", loadError);
        setError("No se ha podido cargar la actividad del panel.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadData();
    return () => controller.abort();
  }, [typeFilter]);

  const counts = useMemo(() => items.reduce((result, item) => {
    result[item.type] = (result[item.type] || 0) + 1;
    return result;
  }, {}), [items]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = items.slice(startIndex, startIndex + PAGE_SIZE);

  const formatDateTime = (value) => value
    ? new Date(value).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
    : "—";

  const getEditUrl = (item) => ({
    artist: `/admin/edit-artist/${item.slug}`,
    event: `/admin/edit-event/${item.slug}`,
    editorial: `/admin/edit-editorial/${item.slug}`,
    release: `/admin/edit-release/${item.id}`,
    banner: `/admin/edit-banner/${item.id}`,
  }[item.type] || "#");

  return (
    <main className="admin-page admin-dashboard">
      <header className="admin-dashboard__hero">
        <p>Caribe Records · Gestión</p>
        <div>
          <h1>Panel</h1>
          <span>{String(totalItems).padStart(2, "0")} registros</span>
        </div>
      </header>

      <section className="admin-create" aria-labelledby="admin-create-title">
        <div className="admin-section-heading">
          <h2 id="admin-create-title">Crear contenido</h2>
          <span>Accesos rápidos</span>
        </div>
        <div className="admin-create__grid">
          {CREATE_LINKS.map(([number, label, url]) => (
            <Link to={url} key={url}>
              <small>{number}</small>
              <span>{label}</span>
              <b aria-hidden="true">＋</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-activity" aria-labelledby="admin-activity-title">
        <div className="admin-section-heading admin-activity__heading">
          <div>
            <h2 id="admin-activity-title">Actividad</h2>
            <p>
              {Object.entries(TYPE_LABELS).map(([type, label]) => (
                <span key={type}>{label} {String(counts[type] || 0).padStart(2, "0")}</span>
              ))}
            </p>
          </div>
          <label>
            <span>Filtrar por</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">Todo</option>
              <option value="artist">Artistas</option>
              <option value="release">Lanzamientos</option>
              <option value="event">Eventos</option>
              <option value="editorial">Editorial</option>
              <option value="banner">Banners</option>
            </select>
          </label>
        </div>

        {loading ? (
          <p className="admin-status">Cargando actividad…</p>
        ) : error ? (
          <p className="admin-status admin-status--error">{error}</p>
        ) : totalItems === 0 ? (
          <p className="admin-status">Todavía no hay actividad.</p>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Tipo</th><th>Título / nombre</th><th>Creado</th><th>Actualizado</th><th><span className="visually-hidden">Acción</span></th></tr></thead>
                <tbody>
                  {pageItems.map((item) => (
                    <tr key={`${item.type}-${item.id}`}>
                      <td><span className={`admin-type admin-type--${item.type}`}>{TYPE_LABELS[item.type]}</span></td>
                      <td>{item.title}</td>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>{formatDateTime(item.updatedAt)}</td>
                      <td><Link to={getEditUrl(item)} aria-label={`Editar ${item.title}`}>Editar ↗</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="admin-pagination">
              <span>{startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, totalItems)} de {totalItems}</span>
              <div>
                <button disabled={safePage === 1} onClick={() => setCurrentPage((page) => page - 1)}>← Anterior</button>
                <span>{String(safePage).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}</span>
                <button disabled={safePage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Siguiente →</button>
              </div>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}
