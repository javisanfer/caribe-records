import { useState } from "react";
import { publicUrl } from "../../utils/page-meta";

export default function EditorialShare({ slug, title }) {
  const [copyState, setCopyState] = useState("idle");
  const url = publicUrl("/editorial/" + encodeURIComponent(slug));
  const tweet = new URLSearchParams({ text: title, url });
  const whatsapp = new URLSearchParams({ text: title + "\n" + url });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      setCopyState("manual");
    }
  }

  return <div className="editorial-share" role="group" aria-label="Compartir artículo">
    <span>Compartir</span>
    <a href={`https://twitter.com/intent/tweet?${tweet}`} target="_blank" rel="noreferrer" aria-label="Compartir en X" title="Compartir en X">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.9-7.5L5.3 22H2.1l8.3-9.5L2 2h6.4l4.5 6.8L18.9 2ZM17.8 20h1.7L7.3 4H5.5l12.3 16Z"/></svg>
    </a>
    <a href={`https://wa.me/?${whatsapp}`} target="_blank" rel="noreferrer" aria-label="Compartir en WhatsApp" title="Compartir en WhatsApp">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.7a9 9 0 0 1-13.5 7.8L3 21l1.4-4.5A9 9 0 1 1 21 11.7Z" fill="none" stroke="currentColor" strokeWidth="1.8"/><path fill="currentColor" d="M8.1 6.8c.3-.2.8-.2 1 .1l1.2 2.3c.2.3 0 .6-.2.9l-.6.7c.7 1.6 2 2.8 3.7 3.4l.9-1c.2-.2.4-.3.7-.2l2.1 1c.3.1.4.4.4.7-.1 1.2-1 2.2-2.4 2.2-2.2-.1-4.3-1.5-5.9-3.1-1.3-1.4-2.4-3-2.5-4.4 0-1.1.6-2 1.6-2.6Z"/></svg>
    </a>
    <button type="button" onClick={copyLink} aria-label="Copiar enlace" title="Copiar enlace">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M10 13a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5M14 11a4 4 0 0 0-6-.4l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/></svg>
    </button>
    <span role="status">{copyState === "copied" && "Enlace copiado"}</span>
    {copyState === "manual" && <label>Selecciona y copia el enlace
      <input readOnly value={url} onFocus={(event) => event.target.select()} />
    </label>}
  </div>;
}
