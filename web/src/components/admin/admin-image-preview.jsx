import React from "react";

export default function AdminImagePreview({ src, alt = "", label = "Imagen actual" }) {
  if (!src) return null;

  return (
    <figure className="admin-image-preview">
      <img src={src} alt={alt} />
      <figcaption>{label}</figcaption>
    </figure>
  );
}
