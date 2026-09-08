import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { adminCreateRelease, listArtists, uploadImage } from "../../services/api-services";
import AdminImagePreview from "../../components/admin/admin-image-preview";

const API_BASE = "/api/v1";

export default function NewReleasePage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loadingRelease, setLoadingRelease] = useState(false);
  const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm({ defaultValues: { catalogType: "own", catalogVisible: true, tracklist: [{ title: "", duration: "" }] } });
  const { fields, append, remove } = useFieldArray({ control, name: "tracklist" });
  const currentCoverUrl = watch("coverUrl") || "";

  useEffect(() => {
    listArtists().then((response) => setArtists(Array.isArray(response) ? response : response.data || [])).catch((error) => { console.error("No se pudieron cargar los artistas", error); setArtists([]); });
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    const fetchRelease = async () => {
      try {
        setLoadingRelease(true);
        const response = await fetch(`${API_BASE}/admin/releases/${id}`, { credentials: "include" });
        if (!response.ok) throw new Error("Error loading release");
        const data = await response.json();
        reset({
          title: data.title || "", artist: data.artist?._id || data.artist || "", catalog: data.catalog || "", serialNumber: data.serialNumber || "", format: data.format || "",
          labelName: data.labelName || "", catalogType: data.catalogType || "own", catalogVisible: data.catalogVisible !== false,
          bandcampUrl: data.bandcampUrl || "",
          release_date: data.release_date ? data.release_date.slice(0, 10) : "", country: data.country || "", spotifyUrl: data.spotifyUrl || "",
          coverUrl: data.cover?.url || data.cover_image || "", coverAlt: data.cover?.alt || "",
          tracklist: data.tracklist?.length ? data.tracklist.map((track) => ({ title: track.title || "", duration: track.duration || "" })) : [{ title: "", duration: "" }],
        });
      } catch (error) { console.error(error); alert("No se pudo cargar el lanzamiento."); } finally { setLoadingRelease(false); }
    };
    fetchRelease();
  }, [id, isEditMode, reset]);

  const onSubmit = async (data) => {
    try {
      let coverUrl = data.coverUrl?.trim() || "";
      if (data.coverFile?.[0]) { const uploadResponse = await uploadImage(data.coverFile[0]); coverUrl = uploadResponse.imageUrl || coverUrl; }
      const payload = {
        title: data.title.trim(), artist: data.artist, format: data.format.trim().toLowerCase(), release_date: data.release_date || null,
        labelName: data.labelName?.trim() || "", catalogType: data.catalogType || "own", catalogVisible: data.catalogVisible !== false,
        bandcampUrl: data.bandcampUrl?.trim() || "",
        country: data.country?.trim() || "", spotifyUrl: data.spotifyUrl?.trim() || "", catalog: data.catalog?.trim() || "", serialNumber: data.serialNumber?.trim() || "",
        tracklist: (data.tracklist || []).filter((track) => track.title?.trim()).map((track, index) => ({ position: index + 1, title: track.title.trim(), duration: track.duration?.trim() || "" })),
      };
      if (coverUrl) { payload.cover = { url: coverUrl, alt: data.coverAlt?.trim() || data.title.trim() }; payload.cover_image = coverUrl; }
      if (isEditMode) {
        const response = await fetch(`${API_BASE}/admin/releases/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
        if (!response.ok) throw new Error("Error updating release");
      } else { await adminCreateRelease(payload); }
      navigate("/admin");
    } catch (error) { console.error(error); alert(isEditMode ? "No se pudo actualizar el lanzamiento." : "No se pudo crear el lanzamiento."); }
  };

  const handleDelete = async () => {
    if (!isEditMode || !window.confirm("¿Seguro que quieres borrar este lanzamiento?")) return;
    try { const response = await fetch(`${API_BASE}/admin/releases/${id}`, { method: "DELETE", credentials: "include" }); if (!response.ok) throw new Error("Error deleting release"); navigate("/admin"); }
    catch (error) { console.error(error); alert("No se pudo borrar el lanzamiento."); }
  };

  const pageTitle = isEditMode ? "Editar lanzamiento" : "Nuevo lanzamiento";
  return (
    <main className="admin-page admin-form-page">
      <header className="admin-form-header"><button type="button" className="admin-back" onClick={() => navigate(-1)}>← Panel</button><span>Caribe Records · {pageTitle}</span><span /></header>
      <div className="admin-form-container">
        <div className="admin-form-intro"><div><p>Lanzamientos / {isEditMode ? "Editar" : "Crear"}</p><h1>{pageTitle}</h1></div><span>Construye la ficha de catálogo de lo general al detalle.</span></div>
        {isEditMode && loadingRelease ? <p className="admin-loading-state">Cargando lanzamiento…</p> : (
          <form onSubmit={handleSubmit(onSubmit)} className="admin-form admin-editor-form">
            <div className="admin-editor-layout">
              <div className="admin-editor-main">
                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><span>01</span><div><h2>Datos principales</h2><p>La información que identifica el lanzamiento.</p></div></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field"><label className="form-label">Título <b>Obligatorio</b></label><input className={`form-control ${errors.title ? "is-invalid" : ""}`} placeholder="Título del lanzamiento" {...register("title", { required: "Escribe un título" })} />{errors.title && <div className="invalid-feedback">{errors.title.message}</div>}</div>
                    <div className="admin-field"><label className="form-label">Artista <b>Obligatorio</b></label><select className={`form-select ${errors.artist ? "is-invalid" : ""}`} {...register("artist", { required: "Selecciona un artista" })}><option value="">Seleccionar artista…</option>{artists.map((artist) => <option key={artist._id} value={artist._id}>{artist.name}</option>)}</select>{errors.artist && <div className="invalid-feedback">{errors.artist.message}</div>}</div>
                    <div className="admin-field"><label className="form-label">Formato <b>Obligatorio</b></label><select className={`form-select ${errors.format ? "is-invalid" : ""}`} {...register("format", { required: "Selecciona un formato" })}><option value="">Seleccionar formato…</option><option value="single">Single</option><option value="ep">EP</option><option value="lp">LP</option><option value="recopilatorio">Recopilatorio</option></select>{errors.format && <div className="invalid-feedback">{errors.format.message}</div>}</div>
                    <div className="admin-field"><label className="form-label">Fecha de lanzamiento</label><input type="date" className="form-control" {...register("release_date")} /></div>
                  </div>
                </section>
                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><span>02</span><div><h2>Catálogo</h2><p>Referencias internas y disponibilidad.</p></div></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field"><label className="form-label">Número de catálogo</label><input className="form-control" placeholder="CRB-001" {...register("catalog")} /></div>
                    <div className="admin-field"><label className="form-label">Sello</label><input className="form-control" placeholder="Caribe Records/Buenos Amigos" {...register("labelName")} /></div>
                    <div className="admin-field"><label className="form-label">Relación con el catálogo</label><select className="form-select" {...register("catalogType")}><option value="own">Edición propia</option><option value="distribution">Distribución</option></select></div>
                    <div className="admin-field"><label className="form-label"><input type="checkbox" {...register("catalogVisible")} /> Visible en el catálogo público</label></div>
                    <div className="admin-field"><label className="form-label">Número de serie</label><input className="form-control" placeholder="#023/300" {...register("serialNumber")} /></div>
                    <div className="admin-field"><label className="form-label">País</label><input className="form-control" placeholder="ES" {...register("country")} /></div>
                    <div className="admin-field"><label className="form-label">Spotify</label><input type="url" className="form-control" placeholder="https://open.spotify.com/album/…" {...register("spotifyUrl")} /></div>
                    <div className="admin-field"><label className="form-label">Bandcamp</label><input type="url" className="form-control" placeholder="https://artista.bandcamp.com/album/…" {...register("bandcampUrl")} /></div>
                  </div>
                </section>
                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><span>03</span><div><h2>Portada</h2><p>Sube un archivo o pega una URL existente.</p></div></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field admin-field--wide"><AdminImagePreview src={currentCoverUrl} alt="Portada actual del lanzamiento" label="Portada guardada" /></div>
                    <div className="admin-field"><label className="form-label">Archivo</label><input type="file" accept="image/*" className="form-control" {...register("coverFile")} /><div className="form-text">El archivo tiene prioridad sobre la URL.</div></div>
                    <div className="admin-field"><label className="form-label">URL alternativa</label><input type="url" className="form-control" placeholder="https://…" {...register("coverUrl")} /></div>
                    <div className="admin-field admin-field--wide"><label className="form-label">Texto alternativo</label><input className="form-control" placeholder="Describe brevemente la portada" {...register("coverAlt")} /></div>
                  </div>
                </section>
                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><span>04</span><div><h2>Lista de temas</h2><p>Añade las canciones en el orden definitivo.</p></div></div>
                  <div className="admin-tracklist" role="group" aria-label="Lista de temas">{fields.map((field, index) => <div key={field.id} className="admin-track-row"><span>{String(index + 1).padStart(2, "0")}</span><input aria-label={`Título del tema ${index + 1}`} className="form-control" placeholder="Título del tema" {...register(`tracklist.${index}.title`)} /><input aria-label={`Duración del tema ${index + 1}`} className="form-control" placeholder="3:34" {...register(`tracklist.${index}.duration`)} /><button type="button" className="admin-track-remove" aria-label={`Eliminar tema ${index + 1}`} onClick={() => remove(index)}>×</button></div>)}</div>
                  <button type="button" className="btn admin-secondary-action" onClick={() => append({ title: "", duration: "" })}>+ Añadir tema</button>
                </section>
              </div>
              <aside className="admin-editor-sidebar">
                <section className="admin-action-card"><span className="admin-action-card__status">{isEditMode ? "Ficha existente" : "Nuevo catálogo"}</span><h2>{isEditMode ? "Guardar cambios" : "Crear lanzamiento"}</h2><p>Los temas vacíos no se incluirán al guardar.</p><div className="admin-action-checks"><span><i>01</i> Datos principales</span><span><i>02</i> Referencia de catálogo</span><span><i>03</i> Portada accesible</span><span><i>04</i> Tracklist ordenado</span></div><button type="submit" className="btn admin-primary-action" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : isEditMode ? "Actualizar lanzamiento" : "Guardar lanzamiento"}</button></section>
                {isEditMode && <section className="admin-danger-card"><h3>Zona sensible</h3><p>Eliminarás la ficha y su tracklist.</p><button type="button" className="btn btn-danger" onClick={handleDelete}>Eliminar lanzamiento</button></section>}
              </aside>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
