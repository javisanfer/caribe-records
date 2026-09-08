import React, { useMemo, useState } from "react";
import ReleaseItem from "../release-item/release-item";
import AdminEditLink from "../../admin/admin-edit-link";
import { releaseDate, sortReleases } from "../../../utils/release-order";

export default function ReleaseList({ releases = [] }) {
  const [view, setView] = useState("list"); // "list" | "grid"
  const [order, setOrder] = useState("newest");

  const sorted = useMemo(
    () => sortReleases(releases, order),
    [releases, order]
  );

  const yearsRange = useMemo(() => {
    if (!sorted.length) return "";
    const years = sorted
      .map((r) => {
        return releaseDate(r)?.getFullYear();
      })
      .filter((y) => Number.isFinite(y));
    if (!years.length) return "";
    return `${Math.min(...years)}–${Math.max(...years)}`;
  }, [sorted]);

  return (
    <section className="releases-wrap">
      <header className="index-toolbar">
          <p>{yearsRange || "Archivo completo"}</p>
          <label className="catalogue-filter">Orden
            <select value={order} onChange={(event) => setOrder(event.target.value)}>
              <option value="newest">Más recientes primero</option>
              <option value="oldest">Más antiguos primero</option>
            </select>
          </label>
          <div className="index-toolbar__views" role="group" aria-label="Vista de discografía">
            <button
              className={view === "list" ? "is-active" : ""}
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
            >
              Lista
            </button>
            <button
              className={view === "grid" ? "is-active" : ""}
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
            >
              Retícula
            </button>
          </div>
      </header>

      {sorted.length === 0 && (
        <p className="public-index__status">No hay lanzamientos.</p>
      )}

      {view === "grid" ? (
        <div className="release-grid">
          {sorted.map((rel) => (
            <div className="admin-edit-context" key={rel.id || rel._id}>
              <ReleaseItem release={rel} view="grid" />
              <AdminEditLink
                to={`/admin/edit-release/${rel.id || rel._id}`}
                label={`el lanzamiento ${rel.title}`}
              />
            </div>
          ))}
        </div>
      ) : (
        <ul className="release-index">
          {sorted.map((rel) => (
            <li
              className="admin-edit-context"
              key={rel.id || rel._id}
            >
              <ReleaseItem release={rel} view="list" />
              <AdminEditLink
                to={`/admin/edit-release/${rel.id || rel._id}`}
                label={`el lanzamiento ${rel.title}`}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
