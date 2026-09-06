import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import EditorialBlockEditor from "../../components/admin/editorial-block-editor";
import { createTextBlock } from "../../components/admin/editorial-block-utils";
import AdminImagePreview from "../../components/admin/admin-image-preview";

const API_BASE = "/api/v1";

export default function NewEditorialPage({ isEditMode = false }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const effectiveEditMode = isEditMode && Boolean(slug);
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [blocks, setBlocks] = useState([createTextBlock()]);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({ defaultValues: { status: "draft", featured: false, title: "" } });
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
  const completedChecks = [title, plainText, excerpt, heroUrl, tags, seoTitle, seoDescription].filter(Boolean).length;
  const completion = Math.round((completedChecks / 7) * 100);

  useEffect(() => {
    if (!effectiveEditMode) return;
    const fetchEditorial = async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/editorials/slug/${encodeURIComponent(slug)}`, { credentials: "include" });
        if (!response.ok) throw new Error("Error loading editorial");
        const data = await response.json();
        setValue("title", data.title || ""); setValue("slug", data.slug || ""); setValue("subtitle", data.subtitle || "");
        setValue("status", data.status || "draft"); setValue("featured", Boolean(data.featured)); setValue("section", data.section || ""); setValue("series", data.series || "");
        if (data.publishAt) setValue("publishAt", data.publishAt.slice(0, 16));
        const hero = typeof data.hero === "string" ? { url: data.hero } : data.hero || {};
        setValue("heroUrl", hero.url || data.heroUrl || ""); setValue("heroAlt", hero.alt || ""); setValue("heroCaption", hero.caption || ""); setValue("heroCredit", hero.credit || "");
        const contentBlocks = data.blocks?.filter((block) => block.type !== "embed") || [];
        setBlocks(contentBlocks.length ? contentBlocks.map((block, index) => ({ ...block, id: `${block.type}-${index}-${Date.now()}` })) : [createTextBlock()]);
        setValue("embedHtml", data.blocks?.find((block) => block.type === "embed")?.embed || "");
        setValue("excerpt", data.excerpt || ""); setValue("tags", data.tags?.join(", ") || "");
        if (data.seo) { setValue("seoTitle", data.seo.title || ""); setValue("seoDescription", data.seo.description || ""); setValue("seoOgImage", data.seo.ogImage || ""); }
      } catch (error) { console.error(error); alert("No se pudo cargar la editorial."); } finally { setLoadingInitial(false); }
    };
    fetchEditorial();
  }, [effectiveEditMode, setValue, slug]);

  const onSubmit = async (data) => {
    try {
      const usableBlocks = blocks.filter((block) => block.type === "separator" || block.text?.replace(/<[^>]*>/g, "").trim() || block.quote?.trim() || block.image?.url?.trim());
      if (!usableBlocks.length) {
        alert("Añade al menos un bloque de contenido antes de guardar.");
        return;
      }
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "heroFile" || value === undefined || value === null) return;
        formData.append(key, key === "featured" ? (value ? "true" : "false") : value);
      });
      formData.append("blocks", JSON.stringify(usableBlocks.map((block) => block.type === "image" ? { type: "image", image: block.image } : block.type === "quote" ? { type: "quote", quote: block.quote, cite: block.cite } : block.type === "separator" ? { type: "separator" } : { type: "paragraph", text: block.text })));
      if (data.heroFile?.[0]) formData.append("heroFile", data.heroFile[0]);
      const response = await fetch(effectiveEditMode ? `${API_BASE}/admin/editorials/slug/${encodeURIComponent(slug)}` : `${API_BASE}/admin/editorials`, { method: effectiveEditMode ? "PATCH" : "POST", credentials: "include", body: formData });
      if (!response.ok) throw new Error("Error saving editorial");
      navigate("/admin");
    } catch (error) { console.error(error); alert("No se pudo guardar la editorial."); }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que quieres borrar esta editorial? Esta acción es permanente.")) return;
    try { const response = await fetch(`${API_BASE}/admin/editorials/slug/${encodeURIComponent(slug)}`, { method: "DELETE", credentials: "include" }); if (!response.ok) throw new Error("Error deleting editorial"); navigate("/admin"); }
    catch (error) { console.error(error); alert("No se pudo borrar la editorial."); }
  };

  const pageTitle = effectiveEditMode ? "Editar editorial" : "Nueva editorial";
  const statusLabel = { draft: "Borrador", published: "Publicada", scheduled: "Programada" }[currentStatus];

  return (
    <main className="admin-page admin-form-page admin-wordpress-page">
      <header className="admin-form-header"><button type="button" className="admin-back" onClick={() => navigate(-1)}>← Panel</button><span>Caribe Records · Editorial</span><span /></header>
      <div className="admin-form-container">
        <div className="admin-form-intro admin-form-intro--editorial"><div><p>Editorial / {effectiveEditMode ? "Editar" : "Crear"}</p><h1>{pageTitle}</h1></div><span>Escribe en el lienzo y prepara la publicación desde la barra lateral.</span></div>
        {effectiveEditMode && loadingInitial ? <p className="admin-loading-state">Cargando editorial…</p> : (
          <form onSubmit={handleSubmit(onSubmit)} className="admin-form admin-editor-form admin-editorial-form">
            <div className="admin-editorial-layout">
              <div className="admin-editorial-canvas">
                <div className="admin-editorial-document">
                  <div className="admin-editorial-document__meta"><span>{statusLabel}</span><span>{wordCount} palabras · {readingTime} min de lectura</span></div>
                  <label className="visually-hidden" htmlFor="editorial-title">Título</label>
                  <textarea id="editorial-title" rows={2} className={`form-control admin-title-input ${errors.title ? "is-invalid" : ""}`} placeholder="Añadir título" {...register("title", { required: "Escribe un título" })} />
                  {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                  <input className="form-control admin-subtitle-input" placeholder="Añadir subtítulo o entradilla…" aria-label="Subtítulo" {...register("subtitle")} />

                </div>

                <EditorialBlockEditor blocks={blocks} onChange={setBlocks} />
                <div className="admin-document-footer admin-document-footer--floating"><span>{wordCount} palabras · {readingTime} min</span><span>{plainText.length} caracteres</span></div>

                <section className="admin-form-panel admin-visible-panel"><div className="admin-visible-panel__heading"><span>Extracto</span><small>{excerpt.length}/240 caracteres recomendados</small></div><div className="admin-form-panel__body"><textarea rows={4} maxLength={320} className="form-control" placeholder="Resume el artículo en dos o tres frases…" {...register("excerpt")} /></div></section>
                <section className="admin-form-panel admin-visible-panel"><div className="admin-visible-panel__heading"><span>Contenido incrustado</span><small>Spotify, YouTube u otro iframe</small></div><div className="admin-form-panel__body"><label className="form-label">Código HTML <em>Opcional</em></label><textarea rows={5} className="form-control admin-code-input" placeholder='<iframe src="https://…"></iframe>' {...register("embedHtml")} /></div></section>
              </div>

              <aside className="admin-editor-sidebar admin-editorial-sidebar">
                <section className="admin-action-card admin-publish-card">
                  <div className="admin-publish-card__top"><span className="admin-action-card__status">{statusLabel}</span><span>{title ? "Con título" : "Sin título"}</span></div>
                  <h2>Publicación</h2>
                  <div className="admin-completion"><div><span>Preparación</span><b>{completion}%</b></div><progress max="100" value={completion}>{completion}%</progress><small>Título, contenido, extracto, imagen, etiquetas y SEO.</small></div>
                  <div className="admin-field"><label className="form-label">Estado</label><select className="form-select" {...register("status")}><option value="draft">Borrador</option><option value="published">Publicada</option><option value="scheduled">Programada</option></select></div>
                  <div className="admin-field"><label className="form-label">Fecha de publicación</label><input type="datetime-local" className="form-control" {...register("publishAt")} /></div>
                  <label className="admin-switch"><input type="checkbox" {...register("featured")} /><span /><b>Marcar como destacada</b></label>
                  <button type="submit" className="btn admin-primary-action" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : effectiveEditMode ? "Actualizar editorial" : currentStatus === "published" ? "Publicar editorial" : "Guardar borrador"}</button>
                </section>

                <section className="admin-form-panel admin-visible-panel"><div className="admin-visible-panel__heading"><span>Imagen principal</span><small>Portada del artículo</small></div><div className="admin-form-panel__body admin-panel-fields"><AdminImagePreview src={heroUrl} alt="Imagen principal actual del artículo" label="Imagen guardada" /><div className="admin-field"><label className="form-label">Subir imagen</label><input type="file" accept="image/*" className="form-control" {...register("heroFile")} /><div className="form-text">Déjalo vacío para conservar la imagen actual.</div></div><div className="admin-field"><label className="form-label">O usar URL</label><input type="url" className="form-control" placeholder="https://…" {...register("heroUrl")} /></div><div className="admin-field"><label className="form-label">Texto alternativo</label><input className="form-control" placeholder="Describe lo que aparece en la imagen" {...register("heroAlt")} /></div><div className="admin-field-grid admin-field-grid--2"><div className="admin-field"><label className="form-label">Pie</label><input className="form-control" {...register("heroCaption")} /></div><div className="admin-field"><label className="form-label">Crédito</label><input className="form-control" {...register("heroCredit")} /></div></div></div></section>

                <section className="admin-form-panel admin-visible-panel"><div className="admin-visible-panel__heading"><span>Organización</span><small>Ruta, sección y etiquetas</small></div><div className="admin-form-panel__body admin-panel-fields"><div className="admin-field"><label className="form-label">Slug <em>Automático si está vacío</em></label><input className="form-control" placeholder="titulo-del-articulo" {...register("slug")} /></div><div className="admin-field-grid admin-field-grid--2"><div className="admin-field"><label className="form-label">Sección</label><input className="form-control" placeholder="Editorial" {...register("section")} /></div><div className="admin-field"><label className="form-label">Serie</label><input className="form-control" placeholder="Memory of Music" {...register("series")} /></div></div><div className="admin-field"><label className="form-label">Etiquetas</label><input className="form-control" placeholder="Galicia, shoegaze, entrevista" {...register("tags")} /><div className="form-text">{tags ? `${tags.split(",").filter(Boolean).length} etiquetas` : "Separa cada etiqueta con una coma."}</div></div></div></section>

                <section className="admin-form-panel admin-visible-panel"><div className="admin-visible-panel__heading"><span>SEO y redes</span><small>Vista previa en buscadores</small></div><div className="admin-form-panel__body admin-panel-fields"><div className="admin-search-preview"><small>{window.location.host}</small><strong>{seoTitle || title || "Título de la editorial"}</strong><p>{seoDescription || excerpt || "La descripción aparecerá aquí cuando completes el campo SEO o el extracto."}</p></div><div className="admin-field"><label className="form-label">Título SEO <em>{seoTitle.length}/60</em></label><input maxLength={70} className="form-control" {...register("seoTitle")} /></div><div className="admin-field"><label className="form-label">Descripción SEO <em>{seoDescription.length}/160</em></label><textarea maxLength={180} rows={3} className="form-control" {...register("seoDescription")} /></div><div className="admin-field"><label className="form-label">Imagen social</label><input type="url" className="form-control" placeholder="Por defecto usa la imagen principal" {...register("seoOgImage")} /></div></div></section>

                {effectiveEditMode && <section className="admin-danger-card"><h3>Zona sensible</h3><p>La editorial se eliminará definitivamente.</p><button type="button" className="btn btn-danger" onClick={handleDelete}>Eliminar editorial</button></section>}
              </aside>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
