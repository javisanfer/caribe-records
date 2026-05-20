import React from "react";

function formatDate(d) {
  if (!d) return "";
  const dd = new Date(d);
  if (Number.isNaN(dd.getTime())) return "";
  return dd.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(t) {
  if (typeof t === "number") {
    const m = Math.floor(t / 60);
    const s = Math.round(t % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return t || "";
}

export default function ReleaseItem({ release, view = "list" }) {
  // 🔧 Normalizamos para encajar con tu backend

  // Título: el nuevo campo que añadiste al modelo
  const title = release.title || release.name || "Untitled";

  // Nombre de artista: viene ya normalizado desde ReleasePage,
  // pero por si acaso usamos varios fallbacks
  const artistName =
    release.artistName ||
    (typeof release.artist === "string"
      ? release.artist
      : release.artist?.name) ||
    "Unknown artist";

  // Catálogo / label
  const catalog = release.catalog || release.catNo || release.cat || "";

  // Fecha: tu API usa release_date
  const date =
    release.date ||
    release.releaseDate ||
    release.release_date ||
    release.year ||
    null;

  // Portada: tu modelo tiene cover_image
  const coverUrl =
    release.cover?.url ||
    release.coverUrl ||
    release.cover_image ||
    release.image?.url ||
    release.artwork?.url ||
    null;

  const coverAlt = release.cover?.alt || title;

  // Enlace de compra (de momento no lo tienes en la API, lo dejamos preparado)
  const buyUrl = release.buyUrl || release.storeUrl || release.shopUrl || "";

  // Tracklist: tu API usa `tracklist`, con campos { position, title, duration }
  const tracksRaw = release.tracks || release.tracklist || [];
  const tracks = tracksRaw.map((t, idx) => ({
    ...t,
    no: t.no ?? t.position ?? idx + 1,           // número de pista
    time: t.time ?? t.duration ?? "",           // duración
  }));

  // ================= GRID VIEW =================
  if (view === "grid") {
    return (
      <article className="release-card bg-black text-white border border-dark p-2 h-100">
        <div className="ratio ratio-1x1 mb-2">
          {coverUrl && (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img
              src={coverUrl}
              alt={coverAlt}
              className="w-100 h-100 object-fit-cover"
            />
          )}
        </div>
        <div className="small text-uppercase text-secondary">
          {artistName}
        </div>
        <h3 className="fs-6 fw-semibold text-white mb-1">{title}</h3>
        <div className="d-flex justify-content-between small text-secondary">
          <span>{catalog || release.label}</span>
          <span>{date ? formatDate(date) : ""}</span>
        </div>
        {buyUrl && (
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-light w-100 mt-2"
          >
            BUY
          </a>
        )}
      </article>
    );
  }

  // ================= LIST VIEW =================
  return (
    <article className="release-row d-grid gap-3 p-3">
      {/* IZQUIERDA */}
      <div className="release-left">
        <div className="release-meta small text-uppercase text-secondary mb-1">
          <strong className="text-white">{artistName}</strong>
          {title && (
            <>
              {" "}
              • <span className="text-white">{title}</span>
            </>
          )}
        </div>

        <div className="border border-dark p-2 mb-2">
          {coverUrl && (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img
              src={coverUrl}
              alt={coverAlt}
              className="w-100 h-auto d-block"
            />
          )}
        </div>

        <div className="d-flex justify-content-between small text-secondary mb-2">
          <span>{catalog || release.label || "—"}</span>
          <span>{date ? formatDate(date) : ""}</span>
        </div>

        {buyUrl && (
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-light w-100"
          >
            BUY
          </a>
        )}
      </div>

      {/* DERECHA: Tracklist */}
      <div className="release-right">
        <div className="tracktable">
          <div className="tracktable-head small text-secondary">
            <div>#</div>
            <div>TRACK</div>
            <div className="d-none d-md-block">ARTIST</div>
            <div className="text-end">TIME</div>
          </div>

          <ul className="list-unstyled m-0">
            {tracks.map((t, i) => (
              <li key={t.id || t._id || i} className="tracktable-row">
                <div className="mono">
                  {String(t.no ?? i + 1).padStart(2, "0")}
                </div>
                <div className="text-white text-truncate">
                  {t.title || "(untitled)"}
                </div>
                <div className="d-none d-md-block text-white-50 text-truncate">
                  {t.artist || artistName}
                </div>
                <div className="text-end text-white-50 mono">
                  {formatTime(t.time)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}