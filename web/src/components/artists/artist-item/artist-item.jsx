import React from "react";
import { Link } from "react-router-dom";

export default function ArtistItem({ artist, isActive, onHover }) {
  const safeSlug =
    artist.slug ||
    (artist.name
      ? artist.name.toLowerCase().trim().replace(/\s+/g, "-")
      : "");

  if (!safeSlug) return null;

  return (
    <Link
      to={`/artistas/${safeSlug}`}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={`d-block w-100 py-1 text-start text-decoration-none ${
        isActive ? "text-white text-decoration-underline" : "text-white"
      }`}
      style={{
        fontSize: "clamp(1.1rem, 2.4vw, 1.75rem)",
        textUnderlineOffset: 4,
      }}
      aria-current={isActive ? "true" : "false"}
    >
      {artist.name}
    </Link>
  );
}