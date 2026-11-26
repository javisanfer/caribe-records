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
    editorial.credits?.filter((credit) => /autor|author/i.test(credit.role)).map((credit) => credit.name).filter(Boolean).join(", ") ||
    editorial.author?.name || editorial.authorName ||
    "Caribe Records";

  return (
    <Link
      to={`/editorial/${slug}`}
      className="editorial-item"
      style={{ cursor: slug === "#" ? "default" : "pointer" }}
    >
      {editorial.hero?.url && !imageFailed && <div className="editorial-item__media">
          <img
            src={editorial.hero.url}
            alt={editorial.hero.alt || editorial.title}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
      </div>}
      <div className="editorial-item__copy">
        <p>{String(index).padStart(2, "0")} · {authorName}</p>
        <h2>{editorial.title}</h2>
        {editorial.subtitle && (
          <p className="editorial-item__subtitle">{editorial.subtitle}</p>
        )}
      </div>
    </Link>
  );
}
