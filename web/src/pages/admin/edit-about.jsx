import PanelBackLink from "../../components/admin/panel-back-link";
import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { http, uploadImage } from "../../services/api-services";
import defaults from "../../data/about.json";

export default function EditAboutPage() {
  const { register, control, reset, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm();
  const photos = useFieldArray({ control, name: "photographs" });
  const links = useFieldArray({ control, name: "links" });
  const [version, setVersion] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    http.get("/admin/about", { signal: controller.signal }).then((page) => {
      reset(page.content || defaults);
      setVersion(page.version);
    }).catch(() => { if (!controller.signal.aborted) setMessage("No se ha podido cargar About."); });
    return () => controller.abort();
  }, [reset]);

  async function replacePhoto(index, file) {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const { imageUrl } = await uploadImage(file);
      setValue(`photographs.${index}.url`, imageUrl, { shouldDirty: true });
    } catch { setMessage("No se ha podido subir la imagen. La fotografía anterior sigue guardada."); }
    finally { setUploading(false); }
  }
  async function save(values) {
    try {
      const page = await http.put("/admin/about", { version, content: values });
      setVersion(page.version);
      setMessage("Cambios guardados en About.");
    } catch (error) { setMessage(error.response?.data?.message || "No se han podido guardar los cambios."); }
  }
  return <main className="admin-page admin-form-page">
      <header className="admin-form-header"><PanelBackLink /></header>
      <div className="admin-form-container">
    <div className="admin-form-intro"><h1>Editar About</h1></div>
    <p role="status" aria-live="polite">{message || (version === null ? "Cargando…" : "")}</p>
    {version !== null && <form className="admin-form" onSubmit={handleSubmit(save)}>
      <fieldset disabled={uploading || isSubmitting} className="admin-panel-fields admin-form-card">
        <label>Título<textarea required className="form-control" {...register("heading")} /></label>
        <label>Texto del sello<textarea required rows={5} className="form-control" {...register("statement")} /></label>
        <h2>Fotografías</h2>
        {photos.fields.map((row, i) => <fieldset key={row.id} className="admin-panel-fields">
          <legend>Fotografía {i + 1}</legend>
          <img src={watch(`photographs.${i}.url`) || undefined} alt="" width="140" loading="lazy" />
          <label>Imagen<input required className="form-control" {...register(`photographs.${i}.url`)} /></label>
          <label>Subir imagen<input type="file" className="form-control" accept="image/jpeg,image/png,image/webp" onChange={(e) => replacePhoto(i, e.target.files[0])} /></label>
          <label>Texto alternativo<input required className="form-control" {...register(`photographs.${i}.alt`)} /></label>
          <div><button className="btn admin-secondary-action" type="button" disabled={!i} onClick={() => photos.move(i, i - 1)}>Subir posición</button>{" "}
          <button className="btn admin-secondary-action" type="button" onClick={() => photos.remove(i)}>Quitar del archivo</button></div>
        </fieldset>)}
        <button className="btn admin-secondary-action" type="button" onClick={() => photos.append({ url: "", alt: "" })}>Añadir fotografía</button>
        <h2>Enlaces</h2>
        {links.fields.map((row, i) => <fieldset key={row.id} className="admin-panel-fields">
          <legend>Enlace {i + 1}</legend>
          {[["label", "Nombre"], ["detail", "Texto visible"], ["href", "Destino"]].map(([key, label]) =>
            <label key={key}>{label}<input required className="form-control" {...register(`links.${i}.${key}`)} /></label>)}
          <button className="btn admin-secondary-action" type="button" onClick={() => links.remove(i)}>Quitar enlace</button>
        </fieldset>)}
        <button className="btn admin-secondary-action" type="button" onClick={() => links.append({ label: "", detail: "", href: "" })}>Añadir enlace</button>
        <button className="btn admin-primary-action" type="submit">{isSubmitting ? "Guardando…" : "Guardar cambios"}</button>
      </fieldset>
    </form>}
  </div>
    </main>;
}
