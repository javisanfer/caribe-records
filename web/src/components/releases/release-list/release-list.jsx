import React, { useMemo, useState } from "react";
import ReleaseItem from "../release-item/release-item";
import AdminEditLink from "../../admin/admin-edit-link";

export default function ReleaseList({ releases = [] }) {
  const [view, setView] = useState("list"); // "list" | "grid"

  const sorted = useMemo(
    () =>
      [...releases].sort((a, b) => {
        const dA = new Date(a.date || a.releaseDate || a.year || 0);
        const dB = new Date(b.date || b.releaseDate || b.year || 0);
        return dB - dA;
      }),
    [releases]
  );

  const yearsRange = useMemo(() => {
    if (!sorted.length) return "";
    const years = sorted
      .map((r) => {
        const d = new Date(r.date || r.releaseDate);
        return d.getFullYear();
      })
      .filter((y) => !Number.isNaN(y));
    if (!years.length) return "";
    return `${Math.min(...years)}–${Math.max(...years)}`;
  }, [sorted]);

  return (
    <section className="releases-wrap">
      <header className="index-toolbar">
          <p>{yearsRange || "Archivo completo"}</p>
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
