import React, { useLayoutEffect, useRef, useState } from "react";
import "./poster-gallery.css";

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" });

function PosterImage({ event }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <p role="status">No se ha podido cargar este cartel.</p>;
  return <img src={event.posterUrl} alt={`Cartel de ${event.title || event.artist} en ${event.venue}`}
    onError={() => setFailed(true)} />;
}

export default function PosterGallery({ posters, opened, onClose }) {
  const dialogRef = useRef(null);
  const [index, setIndex] = useState(() => posters.findIndex((event) => event.id === opened.id));
  const event = posters[index];
  const move = (step) => setIndex((current) => (current + step + posters.length) % posters.length);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      dialog.close();
      opened.trigger.focus({ preventScroll: true });
    };
  }, [opened]);

  function onKeyDown(key) {
    if (key.altKey || key.ctrlKey || key.metaKey || posters.length < 2) return;
    if (key.key === "ArrowLeft" || key.key === "ArrowRight") {
      key.preventDefault();
      move(key.key === "ArrowLeft" ? -1 : 1);
    }
  }

  return (
    <dialog ref={dialogRef} className="poster-gallery" aria-label="Galería de carteles"
      onKeyDown={onKeyDown} onCancel={(e) => { e.preventDefault(); onClose(); }}>
      <header>
        <span>Carteles</span>
        <button type="button" onClick={onClose} aria-label="Cerrar galería">Cerrar ×</button>
      </header>
      <div className="poster-gallery__image"><PosterImage key={event.posterUrl} event={event} /></div>
      <footer>
        <div aria-live="polite" aria-atomic="true">
          <strong>{event.title || event.artist}</strong>
          <span>{[event.venue, event.city, dateFormat.format(event.parsedDate)].filter(Boolean).join(" · ")}</span>
          {/^https?:\/\//i.test(event.sourceUrl || "") && <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">Ver publicación original ↗</a>}
        </div>
        {posters.length > 1 && <nav aria-label="Navegar por los carteles">
          <button type="button" aria-label="Cartel anterior" onClick={() => move(-1)}>←</button>
          <span>{index + 1} / {posters.length}</span>
          <button type="button" aria-label="Cartel siguiente" onClick={() => move(1)}>→</button>
        </nav>}
      </footer>
    </dialog>
  );
}
