import React from "react";
import { Link } from "react-router-dom";

export default function ArtistItem({ artist, index }) {
  const safeSlug =
    artist.slug ||
    (artist.name
      ? artist.name.toLowerCase().trim().replace(/\s+/g, "-")
      : "");

  if (!safeSlug) return null;

  return (
    <Link
      to={`/artistas/${safeSlug}`}
      className="artist-index__link"
    >
      <span className="artist-index__number">{String(index).padStart(2, "0")}</span>
      <span className="artist-index__name">{artist.name}</span>
      <span className="artist-index__action">Ver artista <span aria-hidden="true">↗</span></span>
    </Link>
  );
}
