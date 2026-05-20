import React from "react";
import { Link } from "react-router-dom";

export default function EditorialItem({ editorial }) {
  if (!editorial) return null;

  const slug = editorial.slug || "#";

  return (
    <Link
      to={`/editorial/${slug}`}
      className="editorial-item d-block position-relative text-decoration-none text-white"
      style={{ cursor: slug === "#" ? "default" : "pointer" }}
    >
      {/* Imagen de portada */}
      {editorial.hero?.url && (
        <div className="ratio ratio-1x1 overflow-hidden">
          <img
            src={editorial.hero.url}
            alt={editorial.hero.alt || editorial.title}
            className="w-100 h-100 object-fit-cover"
          />
        </div>
      )}

      {/* Overlay */}
      <div
        className="editorial-item-overlay position-absolute top-0 start-0 w-100 h-100
                   d-flex flex-column justify-content-center align-items-center
                   text-center px-3"
        style={{
          background: "rgba(0,0,0,0.55)",
          opacity: 0,
          transition: "opacity .35s ease",
        }}
      >
        <h2 className="fs-4 text-uppercase mb-2">{editorial.title}</h2>

        {editorial.subtitle && (
          <p className="small text-light mb-0">{editorial.subtitle}</p>
        )}
      </div>
    </Link>
  );
}