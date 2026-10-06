import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function EditorialItem({ editorial, index }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [editorial?.hero?.url]);

  if (!editorial) return null;

  const slug = editorial.slug || "#";
  const authorName =
    editorial.author?.name ||
    editorial.authorName ||
    editorial.credits?.find((credit) => /autor|author/i.test(credit.role || ""))?.name ||
    "Caribe Records";

  return (
    <Link
      to={`/editorial/${slug}`}
      className="editorial-item"
      style={{ cursor: slug === "#" ? "default" : "pointer" }}
    >
      <div className="editorial-item__media">
        {editorial.hero?.url && !imageFailed ? (
          <img
            src={editorial.hero.url}
            alt={editorial.hero.alt || editorial.title}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span aria-hidden="true">CR</span>
        )}
      </div>
      <div className="editorial-item__copy">
        <p>{String(index).padStart(2, "0")} · {authorName}</p>
        <h2>{editorial.title}</h2>
        {editorial.subtitle && (
          <p className="editorial-item__subtitle">{editorial.subtitle}</p>
        )}
        <span>Leer historia <span aria-hidden="true">↗</span></span>
      </div>
    </Link>
  );
}
