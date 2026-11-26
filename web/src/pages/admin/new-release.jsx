import PanelBackLink from "../../components/admin/panel-back-link";
import { imageUrlInput } from "../../components/admin/image-url-input";
import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { adminCreateRelease, adminListArtists, uploadImage } from "../../services/api-services";
import AdminImagePreview from "../../components/admin/admin-image-preview";

const API_BASE = "/api/v1";

export default function NewReleasePage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loadingRelease, setLoadingRelease] = useState(isEditMode);
  const [loadError, setLoadError] = useState("");
  const [initialRelease, setInitialRelease] = useState(null);
  const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm({ defaultValues: { catalogType: "own", catalogVisible: true, tracklist: [{ title: "", duration: "" }] } });
  const { fields, append, remove } = useFieldArray({ control, name: "tracklist" });
  const currentCoverUrl = watch("coverUrl") || "";

  useEffect(() => {
    adminListArtists().then((response) => setArtists(Array.isArray(response) ? response : response.data || [])).catch((error) => { console.error("No se pudieron cargar los artistas", error); setArtists([]); });
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    const fetchRelease = async () => {
      try {
        setLoadingRelease(true);
        const response = await fetch(`${API_BASE}/admin/releases/${id}`, { credentials: "include" });
        if (!response.ok) throw new Error("Error loading release");
        const data = await response.json();
        setInitialRelease(data);
        reset({
          title: data.title || "", artist: data.artist?._id || data.artist || "", catalog: data.catalog || "", serialNumber: data.serialNumber || "", format: data.format || "",
          labelName: data.labelName || "", catalogType: data.catalogType || "own", catalogVisible: data.catalogVisible !== false,
          artistName: data.artistName || "", appleMusicUrl: data.appleMusicUrl || "", barcode: data.barcode || "",
          bandcampUrl: data.bandcampUrl || "",
          release_date: data.release_date ? data.release_date.slice(0, 10) : "", country: data.country || "", spotifyUrl: data.spotifyUrl || "",
          coverUrl: data.cover?.url || data.cover_image || "", coverAlt: data.cover?.alt || "",
          tracklist: data.tracklist?.length ? data.tracklist.map((track) => ({ position: track.position, title: track.title || "", duration: track.duration || "" })) : [{ title: "", duration: "" }],
        });
      } catch (error) { setLoadError(error.message || "No se pudo cargar el lanzamiento."); } finally { setLoadingRelease(false); }
    };
    fetchRelease();
  }, [id, isEditMode, reset]);

  const onSubmit = async (data) => {
    try {
      let coverUrl = data.coverUrl?.trim() || "";
      if (data.coverFile?.[0]) { const uploadResponse = await uploadImage(data.coverFile[0]); coverUrl = uploadResponse.imageUrl || coverUrl; }
      const payload = {
        title: data.title.trim(), artist: data.artist || null, format: data.format.trim().toLowerCase(), release_date: data.release_date || null,
        labelName: data.labelName?.trim() || "", catalogType: data.catalogType || "own", catalogVisible: data.catalogVisible !== false,
        artistName: data.artistName.trim(), appleMusicUrl: data.appleMusicUrl.trim(), barcode: data.barcode.trim(),
        bandcampUrl: data.bandcampUrl?.trim() || "",
        country: data.country?.trim() || "", spotifyUrl: data.spotifyUrl?.trim() || "", catalog: data.catalog?.trim() || "", serialNumber: data.serialNumber?.trim() || "",
        tracklist: (data.tracklist || []).filter((track) => track.title?.trim()).map((track, index) => ({ position: Number(track.position) || index + 1, title: track.title.trim(), duration: track.duration?.trim() || "" })),
      };
      if (isEditMode && initialRelease?.release_date?.slice(0, 10) === data.release_date) delete payload.release_date;
      payload.cover = { url: coverUrl, alt: data.coverAlt?.trim() || "" };
      payload.cover_image = coverUrl;
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
      <header className="admin-form-header"><PanelBackLink /></header>
      <div className="admin-form-container">
        <div className="admin-form-intro"><h1>{pageTitle}</h1></div>
        {loadError ? <p role="alert">{loadError}</p> : isEditMode && loadingRelease ? <p className="admin-loading-state">Cargando lanzamiento…</p> : (
          <form onSubmit={handleSubmit(onSubmit)} className="admin-form admin-editor-form">
            <div className="admin-editor-layout">
              <div className="admin-editor-main">
                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><h2>Datos principales</h2></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field"><label htmlFor="new-release-title" className="form-label">Título <b>Obligatorio</b></label><input id="new-release-title" className={`form-control ${errors.title ? "is-invalid" : ""}`} placeholder="Título del lanzamiento" {...register("title", { required: "Escribe un título" })} />{errors.title && <div className="invalid-feedback">{errors.title.message}</div>}</div>
                    <div className="admin-field"><label htmlFor="new-release-artist" className="form-label">Artista</label><select id="new-release-artist" className={`form-select ${errors.artist ? "is-invalid" : ""}`} {...register("artist")}><option value="">Seleccionar artista…</option>{artists.map((artist) => <option key={artist._id} value={artist._id}>{artist.name}</option>)}</select>{errors.artist && <div className="invalid-feedback">{errors.artist.message}</div>}</div>
                    <label className="admin-field">Crédito de artista<input className="form-control" {...register("artistName")} /></label>
                    <div className="admin-field"><label htmlFor="new-release-format" className="form-label">Formato <b>Obligatorio</b></label><select id="new-release-format" className={`form-select ${errors.format ? "is-invalid" : ""}`} {...register("format", { required: "Selecciona un formato" })}><option value="">Seleccionar formato…</option><option value="single">Single</option><option value="ep">EP</option><option value="lp">LP</option><option value="recopilatorio">Recopilatorio</option></select>{errors.format && <div className="invalid-feedback">{errors.format.message}</div>}</div>
                    <div className="admin-field"><label htmlFor="new-release-release_date" className="form-label">Fecha de lanzamiento</label><input id="new-release-release_date" type="date" className="form-control" {...register("release_date")} /></div>
                  </div>
                </section>
                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><h2>Catálogo</h2></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field"><label htmlFor="new-release-catalog" className="form-label">Número de catálogo</label><input id="new-release-catalog" className="form-control" placeholder="CRB-001" {...register("catalog")} /></div>
                    <div className="admin-field"><label htmlFor="new-release-labelName" className="form-label">Sello</label><input id="new-release-labelName" className="form-control" placeholder="Caribe Records/Buenos Amigos" {...register("labelName")} /></div>
                    <div className="admin-field"><label htmlFor="new-release-catalogType" className="form-label">Relación con el catálogo</label><select id="new-release-catalogType" className="form-select" {...register("catalogType")}><option value="own">Edición propia</option><option value="distribution">Distribución</option></select></div>
                    <div className="admin-field"><label className="form-label"><input type="checkbox" {...register("catalogVisible")} /> Visible en el catálogo público</label></div>
                    <div className="admin-field"><label htmlFor="new-release-serialNumber" className="form-label">Número de serie</label><input id="new-release-serialNumber" className="form-control" placeholder="#023/300" {...register("serialNumber")} /></div>
                    <div className="admin-field"><label htmlFor="new-release-country" className="form-label">País</label><input id="new-release-country" className="form-control" placeholder="ES" {...register("country")} /></div>
                    <div className="admin-field"><label htmlFor="new-release-spotifyUrl" className="form-label">Spotify</label><input id="new-release-spotifyUrl" type="url" className={`form-control ${errors.spotifyUrl ? "is-invalid" : ""}`} placeholder="https://open.spotify.com/album/…" {...register("spotifyUrl", { validate: (value) => !value || /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:album|track)\/[A-Za-z0-9]{22}(?:\?.*)?$/i.test(value.trim()) || "Introduce un enlace válido de álbum o canción de Spotify" })} />{errors.spotifyUrl && <div className="invalid-feedback">{errors.spotifyUrl.message}</div>}</div>
                    <label className="admin-field">Código de barras<input className="form-control" {...register("barcode")} /></label>
                    <label className="admin-field">Apple Music<input type="url" className="form-control" {...register("appleMusicUrl")} /></label>
                    <div className="admin-field"><label htmlFor="new-release-bandcampUrl" className="form-label">Bandcamp</label><input id="new-release-bandcampUrl" type="url" className="form-control" placeholder="https://artista.bandcamp.com/album/…" {...register("bandcampUrl")} /></div>
                  </div>
                </section>
                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><h2>Portada</h2></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field admin-field--wide"><AdminImagePreview src={currentCoverUrl} alt="Portada actual del lanzamiento" label="Portada guardada" /></div>
                    <div className="admin-field"><label htmlFor="new-release-coverFile" className="form-label">Archivo</label><input id="new-release-coverFile" type="file" accept="image/*" className="form-control" {...register("coverFile")} /><div className="form-text">El archivo tiene prioridad sobre la URL.</div></div>
                    <div className="admin-field"><label htmlFor="new-release-coverUrl" className="form-label">URL alternativa</label><input id="new-release-coverUrl" {...imageUrlInput} className="form-control" placeholder="https://…" {...register("coverUrl")} /></div>
                    <div className="admin-field admin-field--wide"><label htmlFor="new-release-coverAlt" className="form-label">Texto alternativo</label><input id="new-release-coverAlt" className="form-control" placeholder="Describe brevemente la portada" {...register("coverAlt")} /></div>
                  </div>
                </section>
                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><h2>Lista de temas</h2><p>Añade las canciones en el orden definitivo.</p></div>
                  <div className="admin-tracklist" role="group" aria-label="Lista de temas">{fields.map((field, index) => <div key={field.id} className="admin-track-row"><input aria-label={`Posición del tema ${index + 1}`} type="number" min="1" className="form-control" placeholder={String(index + 1)} {...register(`tracklist.${index}.position`)} /><input aria-label={`Título del tema ${index + 1}`} className="form-control" placeholder="Título del tema" {...register(`tracklist.${index}.title`)} /><input aria-label={`Duración del tema ${index + 1}`} className="form-control" placeholder="3:34" {...register(`tracklist.${index}.duration`)} /><button type="button" className="admin-track-remove" aria-label={`Eliminar tema ${index + 1}`} onClick={() => remove(index)}>×</button></div>)}</div>
                  <button type="button" className="btn admin-secondary-action" onClick={() => append({ title: "", duration: "" })}>+ Añadir tema</button>
                </section>
              </div>
              <aside className="admin-editor-sidebar">
                <section className="admin-action-card"><p>Los temas vacíos no se incluirán al guardar.</p><button type="submit" className="btn admin-primary-action" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : isEditMode ? "Actualizar lanzamiento" : "Guardar lanzamiento"}</button></section>
                {isEditMode && <section className="admin-danger-card"><h3>Zona sensible</h3><p>Eliminarás la ficha y su tracklist.</p><button type="button" className="btn btn-danger" onClick={handleDelete}>Eliminar lanzamiento</button></section>}
              </aside>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
