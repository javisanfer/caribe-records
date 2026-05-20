import React, { useMemo, useState } from "react";
import ReleaseItem from "../release-item/release-item";

export default function ReleaseList({ title = "All Releases", releases = [] }) {
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
    <section className="releases-wrap container-fluid px-0 bg-black text-white">
      <header className="releases-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-dark">
        <div className="d-flex align-items-center gap-3">
          <h2 className="m-0 text-uppercase small">
            {title} ({sorted.length})
          </h2>
          <nav className="small d-none d-md-flex align-items-center gap-2">
            <button
              className={`btn btn-sm ${
                view === "list"
                  ? "btn-outline-light"
                  : "btn-outline-secondary border-dark text-secondary"
              }`}
              onClick={() => setView("list")}
            >
              LIST
            </button>
            <span>•</span>
            <button
              className={`btn btn-sm ${
                view === "grid"
                  ? "btn-outline-light"
                  : "btn-outline-secondary border-dark text-secondary"
              }`}
              onClick={() => setView("grid")}
            >
              GRID
            </button>
          </nav>
        </div>
        <div className="text-uppercase small">{yearsRange}</div>
      </header>

      {sorted.length === 0 && (
        <div className="px-3 py-4 text-secondary">No hay releases.</div>
      )}

      {view === "grid" ? (
        <div className="row g-3 p-3">
          {sorted.map((rel) => (
            <div
              key={rel.id || rel._id}
              className="col-12 col-sm-6 col-lg-4"
            >
              <ReleaseItem release={rel} view="grid" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="list-unstyled m-0">
          {sorted.map((rel) => (
            <li
              key={rel.id || rel._id}
              className="border-bottom border-dark"
            >
              <ReleaseItem release={rel} view="list" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}