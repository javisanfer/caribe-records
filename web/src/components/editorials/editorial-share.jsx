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
    <a href={`https://twitter.com/intent/tweet?${tweet}`} target="_blank" rel="noreferrer" aria-label="Compartir en X">X</a>
    <a href={`https://wa.me/?${whatsapp}`} target="_blank" rel="noreferrer" aria-label="Compartir en WhatsApp">WhatsApp</a>
    <button type="button" onClick={copyLink}>Copiar enlace</button>
    <span role="status">{copyState === "copied" && "Enlace copiado"}</span>
    {copyState === "manual" && <label>Selecciona y copia el enlace
      <input readOnly value={url} onFocus={(event) => event.target.select()} />
    </label>}
  </div>;
}
