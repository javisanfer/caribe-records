import { releaseArtists } from "../../utils/release-artists";
import AdminFormHeading from "../../components/admin/admin-form-heading";
import { imageUrlInput } from "../../components/admin/image-url-input";
import DOMPurify from "dompurify";
import React, { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import EditorialBlockEditor from "../../components/admin/editorial-block-editor";
import { createTextBlock } from "../../components/admin/editorial-block-utils";
import AdminImagePreview from "../../components/admin/admin-image-preview";

import { adminListArtists, adminListReleases } from "../../services/api-services";
import AdminRelations from "../../components/admin/admin-relations";
import { localDateTime } from "../../utils/local-datetime";

const API_BASE = "/api/v1";

export default function NewEditorialPage({ isEditMode = false }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const effectiveEditMode = isEditMode && Boolean(slug);
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [blocks, setBlocks] = useState([createTextBlock()]);
  const [uploadingBlock, setUploadingBlock] = useState(false);
  const [artists, setArtists] = useState([]);
  const [releases, setReleases] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const { control, register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({ defaultValues: { status: "draft", title: "", credits: [], relatedArtists: [], relatedReleases: [] } });
  const credits = useFieldArray({ control, name: "credits" });
  useEffect(() => {
    Promise.all([adminListArtists(), adminListReleases()]).then(([people, catalogue]) => {
      setArtists(people); setReleases(catalogue);
    }).catch(() => setOptionsError("No se pudieron cargar las asociaciones disponibles."));
  }, []);
  const selectedArtists = watch("relatedArtists");
  const selectedReleases = watch("relatedReleases");
  const forArtists = (ids) => (releases || []).filter((release) => releaseArtists(release).some((artist) => ids.includes(artist._id || artist)));
  const availableReleases = forArtists(selectedArtists);
  const eligibleIds = new Set(availableReleases.map((release) => release._id));
  const hasLegacyLinks = releases && selectedReleases.some((id) => !eligibleIds.has(id));

  function changeArtists(ids) {
    const eligible = new Set(forArtists(ids).map((release) => release._id));
    setValue("relatedArtists", ids);
    setValue("relatedReleases", selectedReleases.filter((id) => eligible.has(id)));
  }

  const title = watch("title") || "";
  const currentStatus = watch("status") || "draft";
  const excerpt = watch("excerpt") || "";
  const heroUrl = watch("heroUrl") || "";
  const tags = watch("tags") || "";
  const seoTitle = watch("seoTitle") || "";
  const seoDescription = watch("seoDescription") || "";
  const plainText = useMemo(() => blocks.map((block) => block.text || block.quote || block.image?.caption || "").join(" ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim(), [blocks]);
  const wordCount = useMemo(() => plainText ? plainText.split(/\s+/).length : 0, [plainText]);
  const readingTime = Math.max(1, Math.ceil(wordCount / 220));
  useEffect(() => {
    if (!effectiveEditMode) return;
    const fetchEditorial = async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/editorials/slug/${encodeURIComponent(slug)}`, { credentials: "include" });
        if (!response.ok) throw new Error("Error loading editorial");
        const data = await response.json();
        setValue("title", data.title || ""); setValue("slug", data.slug || ""); setValue("subtitle", data.subtitle || "");
        setValue("status", data.status || "draft"); setValue("section", data.section || ""); setValue("series", data.series || "");
        if (data.publishAt) setValue("publishAt", localDateTime(data.publishAt));
        const hero = typeof data.hero === "string" ? { url: data.hero } : data.hero || {};
        setValue("heroUrl", hero.url || data.heroUrl || ""); setValue("heroAlt", hero.alt || ""); setValue("heroCaption", hero.caption || ""); setValue("heroCredit", hero.credit || "");
        const contentBlocks = data.blocks || [];
        setBlocks(contentBlocks.length ? contentBlocks.map((block, index) => ({ ...block, id: `${block.type}-${index}-${Date.now()}` })) : [createTextBlock()]);
        setValue("credits", data.credits || []);
        setValue("relatedArtists", (data.relatedArtists || []).map((artist) => artist._id || artist));
        setValue("relatedReleases", (data.relatedReleases || []).map((release) => release._id || release));
        setValue("excerpt", data.excerpt || ""); setValue("tags", data.tags?.join(", ") || "");
        if (data.seo) { setValue("seoTitle", data.seo.title || ""); setValue("seoDescription", data.seo.description || ""); setValue("seoOgImage", data.seo.ogImage || ""); }
      } catch (error) { setLoadError(error.message || "No se pudo cargar la editorial."); } finally { setLoadingInitial(false); }
    };
    fetchEditorial();
  }, [effectiveEditMode, setValue, slug]);

  const onSubmit = async (data) => {
    try {
      if (uploadingBlock) return;
      if (blocks.some((block) => block.type === "gallery" && block.gallery.some((image) => !image.url?.trim()))) {
        alert("Selecciona una imagen para cada fotografía de la galería.");
        return;
      }
      const usableBlocks = blocks.filter((block) => block.type === "separator" || block.text && DOMPurify.sanitize(block.text, { RETURN_DOM_FRAGMENT: true }).textContent.trim() || block.quote?.trim() || block.image?.url?.trim() || block.gallery?.some((image) => image.url) || block.embed?.trim());
      if (data.status !== "draft" && !usableBlocks.length) {
        alert("Añade al menos un bloque de contenido antes de publicar.");
        return;
      }
      if (data.status !== "draft" && !data.heroFile?.[0] && !data.heroUrl?.trim()) {
        alert("Añade una imagen principal antes de publicar.");
        return;
      }
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "heroFile" || value === undefined || value === null) return;
        if (key === "credits") formData.append(key, JSON.stringify(value));
        else if (key === "publishAt") formData.append(key, value ? new Date(value).toISOString() : "");
        else formData.append(key, value);
      });
      // Both generations of the API append embedHtml after the ordered blocks.
      const lastBlock = usableBlocks.at(-1);
      const orderedBlocks = lastBlock?.type === "embed" ? usableBlocks.slice(0, -1) : usableBlocks;
      if (orderedBlocks.some((block) => ["embed", "gallery", "heading"].includes(block.type))) {
        // The earlier local API silently drops these types from the blocks array.
        const versionCheck = await fetch(`${API_BASE}/sessions/current`, { credentials: "include" });
        if (versionCheck.status === 404) {
          throw new Error("Esta API es anterior al editor de bloques. Reinicia la API con el código actualizado y vuelve a guardar para conservar el orden y el contenido.");
        }
        if (!versionCheck.ok) throw new Error("No se pudo comprobar la API. Vuelve a intentar guardar.");
      }
      formData.append("blocks", JSON.stringify(orderedBlocks));
      if (lastBlock?.type === "embed") {
        formData.append("embedHtml", lastBlock.embed);
      }
      if (data.heroFile?.[0]) formData.append("heroFile", data.heroFile[0]);
      const response = await fetch(effectiveEditMode ? `${API_BASE}/admin/editorials/slug/${encodeURIComponent(slug)}` : `${API_BASE}/admin/editorials`, { method: effectiveEditMode ? "PATCH" : "POST", credentials: "include", body: formData });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Error saving editorial");
      }
      navigate("/admin");
    } catch (error) { console.error(error); alert(error.message || "No se pudo guardar la editorial."); }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que quieres borrar esta editorial? Esta acción es permanente.")) return;
    try { const response = await fetch(`${API_BASE}/admin/editorials/slug/${encodeURIComponent(slug)}`, { method: "DELETE", credentials: "include" }); if (!response.ok) throw new Error("Error deleting editorial"); navigate("/admin"); }
    catch (error) { console.error(error); alert("No se pudo borrar la editorial."); }
  };

  const pageTitle = effectiveEditMode ? "Editar editorial" : "Nueva editorial";

  return (
    <main className="admin-page admin-form-page admin-wordpress-page">
      <div className="admin-form-container">
        <AdminFormHeading title={pageTitle}>
          <a className="editor-settings-jump" href="#editorial-publicacion">Publicación ↓</a>
        </AdminFormHeading>
        {loadError ? <p role="alert">{loadError}</p> : effectiveEditMode && loadingInitial ? <p className="admin-loading-state">Cargando editorial…</p> : (
          <form onSubmit={handleSubmit(onSubmit)} className="admin-form admin-editor-form admin-editorial-form">
            <div className="admin-editorial-layout">
              <div className="admin-editorial-canvas">
                <div className="admin-editorial-document">
                  <label className="visually-hidden" htmlFor="editorial-title">Título</label>
                  <textarea id="editorial-title" rows={1} className={`form-control admin-title-input ${errors.title ? "is-invalid" : ""}`} placeholder="Añadir título" {...register("title", { required: "Escribe un título" })} />
                  {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                  <input className="form-control admin-subtitle-input" placeholder="Añadir subtítulo o entradilla…" aria-label="Subtítulo" {...register("subtitle")} />

                  <EditorialBlockEditor blocks={blocks} onChange={setBlocks} busy={uploadingBlock} setBusy={setUploadingBlock} />
                  <div className="admin-document-footer admin-document-footer--floating"><span>{wordCount} {wordCount === 1 ? "palabra" : "palabras"} · {readingTime} min de lectura</span></div>
                </div>

                <section className="admin-form-panel admin-visible-panel"><div className="admin-visible-panel__heading"><span>Extracto</span><small>{excerpt.length}/240 caracteres recomendados</small></div><div className="admin-form-panel__body"><textarea rows={4} maxLength={320} className="form-control" placeholder="Resume el artículo en dos o tres frases…" {...register("excerpt")} /></div></section>
                <section className="admin-form-panel admin-visible-panel">
                  <div className="admin-visible-panel__heading"><span>Autoría y créditos</span></div>
                  <div className="admin-form-panel__body admin-panel-fields">
                    {credits.fields.map((field, index) => <div key={field.id} className="admin-field-grid admin-field-grid--2">
                      <label>Función<input required className="form-control" {...register(`credits.${index}.role`)} /></label>
                      <label>Nombre<input required className="form-control" {...register(`credits.${index}.name`)} /></label>
                      <label>Enlace<input type="url" className="form-control" {...register(`credits.${index}.url`)} /></label>
                      <button type="button" className="btn admin-secondary-action" onClick={() => credits.remove(index)}>Quitar crédito</button>
                    </div>)}
                    <button type="button" className="btn admin-secondary-action" onClick={() => credits.append({ role: "Autor", name: "", url: "" })}>Añadir autor o crédito</button>
                  </div>
                </section>
                <details className="admin-form-panel admin-visible-panel">
                  <summary className="admin-visible-panel__heading"><span>Asociaciones</span></summary>
                  <div className="admin-form-panel__body admin-panel-fields">
                    {optionsError ? <p role="alert">{optionsError}</p> : releases === null ? <p>Cargando catálogo…</p> : <>
                      <AdminRelations title="Artistas relacionados" items={artists} selected={selectedArtists} onChange={changeArtists} />
                      {availableReleases.length > 0
                        ? <AdminRelations title="Lanzamientos relacionados" items={availableReleases} selected={selectedReleases}
                            onChange={(ids) => setValue("relatedReleases", ids.filter((id) => eligibleIds.has(id)))} />
                        : <p>{selectedArtists.length ? "Sin lanzamientos para los artistas seleccionados." : "Elige un artista para ver su catálogo."}</p>}
                      {hasLegacyLinks && <div>
                        <p>Hay asociaciones anteriores fuera de esta selección. Se conservarán hasta que cambies las asociaciones.</p>
                        <button type="button" className="btn admin-secondary-action" onClick={() => changeArtists(selectedArtists)}>Desvincular lanzamientos fuera de la selección</button>
                      </div>}
                    </>}
                  </div>
                </details>
              </div>

              <aside className="admin-editor-sidebar admin-editorial-sidebar">
                <section id="editorial-publicacion" className="admin-action-card admin-publish-card">
                  <h2>Publicación</h2>
                  <div className="admin-field"><label className="form-label" htmlFor="editorial-status">Estado</label><select id="editorial-status" className="form-select" {...register("status")}><option value="draft">Borrador</option><option value="published">Publicada</option><option value="scheduled">Programada</option></select></div>
                  <div className="admin-field"><label className="form-label" htmlFor="editorial-date">Fecha de publicación</label><input id="editorial-date" type="datetime-local" step="1" required={currentStatus === "scheduled"} className="form-control" {...register("publishAt")} /></div>
                  <button type="submit" className="btn admin-primary-action" disabled={isSubmitting || uploadingBlock}>{isSubmitting ? "Guardando…" : effectiveEditMode ? "Actualizar editorial" : currentStatus === "published" ? "Publicar editorial" : currentStatus === "scheduled" ? "Programar editorial" : "Guardar borrador"}</button>
                </section>

                <section className="admin-form-panel admin-visible-panel"><div className="admin-visible-panel__heading"><span>Imagen principal</span></div><div className="admin-form-panel__body admin-panel-fields"><AdminImagePreview src={heroUrl} alt="Imagen principal actual del artículo" label="Imagen guardada" /><div className="admin-field"><label htmlFor="new-editorial-heroFile" className="form-label">Subir imagen</label><input id="new-editorial-heroFile" type="file" accept="image/*" className="form-control" {...register("heroFile")} /><div className="form-text">Déjalo vacío para conservar la imagen actual.</div></div><div className="admin-field"><label htmlFor="new-editorial-heroUrl" className="form-label">O usar URL</label><input id="new-editorial-heroUrl" {...imageUrlInput} className="form-control" placeholder="https://…" {...register("heroUrl")} /></div><div className="admin-field"><label htmlFor="new-editorial-heroAlt" className="form-label">Texto alternativo</label><input id="new-editorial-heroAlt" className="form-control" placeholder="Describe lo que aparece en la imagen" {...register("heroAlt")} /></div><div className="admin-field-grid admin-field-grid--2"><div className="admin-field"><label htmlFor="new-editorial-heroCaption" className="form-label">Pie</label><input id="new-editorial-heroCaption" className="form-control" {...register("heroCaption")} /></div><div className="admin-field"><label htmlFor="new-editorial-heroCredit" className="form-label">Crédito</label><input id="new-editorial-heroCredit" className="form-control" {...register("heroCredit")} /></div></div></div></section>

                <details className="admin-form-panel admin-visible-panel"><summary className="admin-visible-panel__heading"><span>Organización</span><small>Ruta, sección y etiquetas</small></summary><div className="admin-form-panel__body admin-panel-fields"><div className="admin-field"><label htmlFor="new-editorial-slug" className="form-label">Slug <em>Automático si está vacío</em></label><input id="new-editorial-slug" className="form-control" placeholder="titulo-del-articulo" {...register("slug")} /></div><div className="admin-field-grid admin-field-grid--2"><div className="admin-field"><label htmlFor="new-editorial-section" className="form-label">Sección</label><input id="new-editorial-section" className="form-control" placeholder="Editorial" {...register("section")} /></div><div className="admin-field"><label htmlFor="new-editorial-series" className="form-label">Serie</label><input id="new-editorial-series" className="form-control" placeholder="Memory of Music" {...register("series")} /></div></div><div className="admin-field"><label htmlFor="new-editorial-tags" className="form-label">Etiquetas</label><input id="new-editorial-tags" className="form-control" placeholder="Galicia, shoegaze, entrevista" {...register("tags")} /><div className="form-text">{tags ? `${tags.split(",").filter(Boolean).length} etiquetas` : "Separa cada etiqueta con una coma."}</div></div></div></details>

                <details className="admin-form-panel admin-visible-panel"><summary className="admin-visible-panel__heading"><span>SEO y redes</span><small>Vista previa en buscadores</small></summary><div className="admin-form-panel__body admin-panel-fields"><div className="admin-search-preview"><small>{window.location.host}</small><strong>{seoTitle || title || "Título de la editorial"}</strong><p>{seoDescription || excerpt || "La descripción aparecerá aquí cuando completes el campo SEO o el extracto."}</p></div><div className="admin-field"><label htmlFor="new-editorial-seoTitle" className="form-label">Título SEO <em>{seoTitle.length}/60</em></label><input id="new-editorial-seoTitle" maxLength={70} className="form-control" {...register("seoTitle")} /></div><div className="admin-field"><label htmlFor="new-editorial-seoDescription" className="form-label">Descripción SEO <em>{seoDescription.length}/160</em></label><textarea id="new-editorial-seoDescription" maxLength={180} rows={3} className="form-control" {...register("seoDescription")} /></div><div className="admin-field"><label htmlFor="new-editorial-seoOgImage" className="form-label">Imagen social</label><input id="new-editorial-seoOgImage" {...imageUrlInput} className="form-control" placeholder="Por defecto usa la imagen principal" {...register("seoOgImage")} /></div></div></details>

                {effectiveEditMode && <section className="admin-danger-card"><h3>Zona sensible</h3><p>La editorial se eliminará definitivamente.</p><button type="button" className="btn btn-danger" onClick={handleDelete}>Eliminar editorial</button></section>}
              </aside>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
