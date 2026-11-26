import { useState } from "react";

export default function EditorialPlayer({ media, preview = false }) {
  const [allowedSource, setAllowedSource] = useState(null);
  if (!preview && allowedSource !== media.src) {
    return <div className="editorial-player-consent">
      <p>Al cargar el reproductor, {media.provider} recibirá tu dirección IP y podrá usar cookies.</p>
      <button type="button" onClick={() => setAllowedSource(media.src)}>Cargar reproductor de {media.provider}</button>
    </div>;
  }
  return <iframe
    className="editorial-player"
    src={media.src}
    title={`${preview ? "Vista previa" : "Reproductor"} de ${media.provider}`}
    style={{ maxWidth: media.width, height: media.height, aspectRatio: media.height ? "auto" : undefined }}
    loading="lazy"
    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen
  />;
}
