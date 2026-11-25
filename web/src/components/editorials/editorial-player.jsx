export default function EditorialPlayer({ media, preview = false }) {
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
