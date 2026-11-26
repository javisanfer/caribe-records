import { useEffect, useState } from "react";
import AdminFormHeading from "../../components/admin/admin-form-heading";
import { http } from "../../services/api-services";

export default function EditCarousel() {
  const [config, setConfig] = useState(null);
  const [entries, setEntries] = useState([]);
  const [choice, setChoice] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    http.get("/admin/home-carousel", { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      setConfig(data); setEntries(data.entries); setChoice(""); setMessage("");
    }).catch(() => { if (!controller.signal.aborted) setMessage("No se pudo cargar el carrusel."); });
    return () => controller.abort();
  }, [refresh]);

  function move(index, offset) {
    const next = [...entries];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setEntries(next); setMessage("");
  }

  async function save() {
    setSaving(true); setMessage("");
    try {
      const saved = await http.put("/admin/home-carousel", { version: config.version, entries });
      setConfig({ ...config, ...saved });
      setMessage("Orden de portada guardado.");
    } catch (error) {
      setMessage(error.response?.data?.message || "No se pudo guardar el carrusel.");
    } finally { setSaving(false); }
  }

  const available = config?.options.filter((item) => !entries.includes(item._id)) || [];
  return <main className="admin-page admin-form-page">
    <AdminFormHeading title="Carrusel de portada" />
    <div className="admin-form-container"><section className="admin-form admin-form-card carousel-settings">
      {config ? <fieldset disabled={saving}>
        <legend>Editoriales en portada</legend>
        <p>El primer artículo abre la portada. Puedes elegir hasta {config.maximum}. Los programados aparecerán en su fecha de publicación.</p>
        <ol>{entries.map((id, index) => {
          const item = config.options.find((option) => option._id === id);
          return <li key={id}><span>{item.title}{item.status === "scheduled" && <small> · Programada</small>}</span>
            <div>
              <button type="button" disabled={!index} onClick={() => move(index, -1)} aria-label={`Subir ${item.title}`}>↑</button>
              <button type="button" disabled={index === entries.length - 1} onClick={() => move(index, 1)} aria-label={`Bajar ${item.title}`}>↓</button>
              <button type="button" onClick={() => { setEntries(entries.filter((value) => value !== id)); setMessage(""); }} aria-label={`Quitar ${item.title}`}>Quitar</button>
            </div></li>;
        })}</ol>
        {!entries.length && <p>La portada mostrará la imagen del sello mientras el carrusel esté vacío.</p>}
        {entries.length < config.maximum && <div className="carousel-add">
          <label>Editorial<select className="form-select" value={choice} onChange={(event) => setChoice(event.target.value)}>
            <option value="">Selecciona una editorial</option>
            {available.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}
          </select></label>
          <button type="button" disabled={!choice} onClick={() => { setEntries([...entries, choice]); setChoice(""); setMessage(""); }}>Añadir</button>
        </div>}
        <button type="button" className="btn admin-primary-action" disabled={entries.join() === config.entries.join()} onClick={save}>{saving ? "Guardando…" : "Guardar carrusel"}</button>
      </fieldset> : !message && <p>Cargando carrusel…</p>}
      <p role="status">{message}</p>
      {message && message !== "Orden de portada guardado." && <button type="button" onClick={() => setRefresh(refresh + 1)}>Recargar selección</button>}
    </section></div>
  </main>;
}
