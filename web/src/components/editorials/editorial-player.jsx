import { useContext, useState } from "react";
import { PlayerConsent } from "../../analytics/use-audience";

export default function EditorialPlayer({ media, preview = false }) {
  const allowPlayers = useContext(PlayerConsent);
  if (preview || allowPlayers) return <PlayerFrame media={media} preview={preview} />;
  return <OptionalPlayer key={media.src} media={media} />;
}

function OptionalPlayer({ media }) {
  const [allowed, setAllowed] = useState(false);
  if (!allowed) {
    return <div className="editorial-player-consent">
      <p>Al cargar el reproductor, {media.provider} recibirá tu dirección IP y podrá usar cookies.</p>
      <button type="button" onClick={() => setAllowed(true)}>Cargar reproductor de {media.provider}</button>
    </div>;
  }
  return <PlayerFrame media={media} />;
}

function PlayerFrame({ media, preview = false }) {
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
