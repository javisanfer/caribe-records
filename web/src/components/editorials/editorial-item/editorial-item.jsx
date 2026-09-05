import React from "react";
import { Link } from "react-router-dom";

export default function EditorialItem({ editorial, index }) {
  if (!editorial) return null;

  const slug = editorial.slug || "#";

  return (
    <Link
      to={`/editorial/${slug}`}
      className="editorial-item"
      style={{ cursor: slug === "#" ? "default" : "pointer" }}
    >
      <div className="editorial-item__media">
        {editorial.hero?.url ? (
          <img
            src={editorial.hero.url}
            alt={editorial.hero.alt || editorial.title}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span aria-hidden="true">CR</span>
        )}
      </div>
      <div className="editorial-item__copy">
        <p>{String(index).padStart(2, "0")} · Caribe Editorial</p>
        <h2>{editorial.title}</h2>
        {editorial.subtitle && (
          <p className="editorial-item__subtitle">{editorial.subtitle}</p>
        )}
        <span>Leer historia <span aria-hidden="true">↗</span></span>
      </div>
    </Link>
  );
}
