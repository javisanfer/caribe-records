import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3000/api/v1";

const TYPE_LABELS = {
  artist: "Artist",
  release: "Release",
  event: "Event",
  editorial: "Editorial",
};

const PAGE_SIZE = 15;

export default function AdminDashboardPage() {
  const [items, setItems] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  const loadData = async (type = "all") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "200");
      if (type !== "all") params.set("type", type);

      const res = await fetch(
        `${API_BASE}/admin/activity?${params.toString()}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setItems(data.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error loading activity:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(typeFilter);
  }, [typeFilter]);

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return d.toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getEditUrl = (item) => {
    switch (item.type) {
      case "artist":
        return `/admin/edit-artist/${item.slug}`;
      case "event":
        return `/admin/edit-event/${item.slug}`;
      case "editorial":
        return `/admin/edit-editorial/${item.slug}`;
      case "release":
        return `/admin/edit-release/${item.id}`;
      default:
        return "#";
    }
  };

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pageItems = items.slice(startIndex, endIndex);

  return (
    <div className="text-white">
      {/* HEADER */}
      <header className="d-flex justify-content-between align-items-center mb-4 p-2 rounded-3 bg-dark border border-secondary">
        <h1 className="h5 text-uppercase mb-0 fw-bold">Admin Dashboard</h1>

        <div className="d-flex align-items-center gap-3">
          {/* FILTRO */}
          <select
            className="form-select form-select-sm bg-black text-white border-secondary"
            style={{ width: "180px" }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="artist">Artists</option>
            <option value="release">Releases</option>
            <option value="event">Events</option>
            <option value="editorial">Editorials</option>
          </select>

          {/* BOTONES DE CREAR */}
          <div className="btn-group">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate("/admin/new-artist")}
            >
              + Artist
            </button>
            <button
              className="btn btn-sm btn-success"
              onClick={() => navigate("/admin/new-release")}
            >
              + Release
            </button>
            <button
              className="btn btn-sm btn-warning text-black"
              onClick={() => navigate("/admin/new-editorial")}
            >
              + Editorial
            </button>
            <button
              className="btn btn-sm btn-info text-black"
              onClick={() => navigate("/admin/new-event")}
            >
              + Event
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT CARD */}
      <div className="bg-black rounded-4 p-4 border border-secondary shadow-sm">
        {loading ? (
          <p className="text-muted mb-0">Loading activity…</p>
        ) : totalItems === 0 ? (
          <p className="text-muted mb-0">No activity yet.</p>
        ) : (
          <>
            <div className="table-responsive mb-3">
              <table className="table table-dark table-hover table-sm align-middle">
                <thead>
                  <tr className="text-secondary text-uppercase small border-bottom border-secondary">
                    <th style={{ width: "120px" }}>Type</th>
                    <th>Title / Name</th>
                    <th style={{ width: "150px" }}>Created</th>
                    <th style={{ width: "150px" }}>Updated</th>
                    <th style={{ width: "80px" }}>Edit</th>
                  </tr>
                </thead>

                <tbody>
                  {pageItems.map((item) => (
                    <tr key={`${item.type}-${item.id}`}>
                      <td className="text-uppercase small">{TYPE_LABELS[item.type]}</td>
                      <td className="fw-light">{item.title}</td>
                      <td className="text-secondary small">{formatDateTime(item.createdAt)}</td>
                      <td className="text-secondary small">{formatDateTime(item.updatedAt)}</td>
                      <td>
                        <a
                          href={getEditUrl(item)}
                          className="btn btn-sm btn-outline-light"
                        >
                          Edit
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FOOTER PAGINACIÓN */}
            <div className="d-flex justify-content-between align-items-center">
              <span className="small text-muted">
                Showing {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}
              </span>

              <div className="btn-group btn-group-sm">
                <button
                  className="btn btn-outline-light"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  ‹ Prev
                </button>
                <button
                  className="btn btn-outline-light"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}