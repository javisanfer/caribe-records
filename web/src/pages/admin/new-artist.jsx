import PanelBackLink from "../../components/admin/panel-back-link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { adminCreateArtist, adminGetArtist, adminUpdateArtist, adminDeleteArtist, uploadImage } from "../../services/api-services";
import AdminImagePreview from "../../components/admin/admin-image-preview";
import { ArtistListFields } from "../../components/admin/artist-fields";
import { imageUrlInput } from "../../components/admin/image-url-input";
import { artistPhotoUrl } from "../../utils/artist-photo";
import { artistLinks, serializeLinks } from "../../utils/artist-links";

const defaults = { name: "", slug: "", city: "", country: "", bio: "", formedYear: "", rosterVisible: true,
  portraitUrl: "", coverUrl: "", genres: [], links: [] };

const textRow = (value) => ({ value });
const listFields = [
  ["genres", "Géneros", [{ key: "value", label: "Género", required: true }]],
  ["links", "Enlaces", [
    { key: "group", label: "Grupo", options: [["streaming", "Escucha"], ["social", "Redes sociales"], ["web", "Otros enlaces"]] },
    { key: "label", label: "Plataforma o nombre del enlace", required: true },
    { key: "url", label: "URL", type: "url", required: true, pattern: "https?://.+" },
  ]],
];

async function photoUrl(url, files) {
  return files?.[0] ? (await uploadImage(files[0])).imageUrl : url?.trim() || "";
}

export default function NewArtistPage({ isEditMode = false }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { register, control, reset, watch, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: defaults });
  const [loading, setLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditMode) return;
    let active = true;
    adminGetArtist(slug).then((artist) => {
      if (!active) return;
      reset({
        ...defaults, name: artist.name, slug: artist.slug, bio: artist.bio || "", country: artist.country || "",
        city: artist.city || "", formedYear: artist.formedYear || "", rosterVisible: artist.rosterVisible !== false,
        portraitUrl: artistPhotoUrl(artist.photos?.portraitUrl ?? artist.portraitUrl) || "",
        coverUrl: artistPhotoUrl(artist.photos?.coverUrl ?? artist.coverUrl) || "",
        genres: (artist.genres || []).map(textRow),
        links: artistLinks(artist),
      });
    }).catch(() => { if (active) setLoadError("No se pudo cargar el artista."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isEditMode, reset, slug]);

  async function save(data) {
    setError("");
    try {
      const payload = {
        name: data.name.trim(), slug: data.slug.trim() || undefined,
        country: data.country.trim(), city: data.city.trim(), bio: data.bio.trim(),
        formedYear: data.formedYear || null, rosterVisible: data.rosterVisible,
        genres: data.genres.map((row) => row.value.trim()).filter(Boolean),
        photos: { portraitUrl: await photoUrl(data.portraitUrl, data.portraitFile), coverUrl: await photoUrl(data.coverUrl, data.coverFile) },
        ...serializeLinks(data.links),
      };
      if (isEditMode) await adminUpdateArtist(slug, payload);
      else await adminCreateArtist(payload);
      navigate("/admin");
    } catch (err) { setError(err.response?.data?.error || err.message || "No se pudo guardar el artista."); }
  }

  async function removeArtist() {
    if (!window.confirm("¿Seguro que quieres borrar este artista?")) return;
    try { await adminDeleteArtist(slug); navigate("/admin"); }
    catch { setError("No se pudo borrar el artista."); }
  }

  return <main className="admin-page admin-form-page">
    <header className="admin-form-header"><PanelBackLink /></header>
    <div className="admin-form-container">
      <div className="admin-form-intro"><h1>{isEditMode ? "Editar artista" : "Nuevo artista"}</h1></div>
      {loading ? <p>Cargando artista…</p> : loadError ? <p role="alert">{loadError}</p> :
        <form className="admin-form admin-editor-form" onSubmit={handleSubmit(save)}>
          <div className="admin-editor-layout"><div className="admin-editor-main">
            <section className="admin-form-card"><h2>Identidad</h2>
              <div className="admin-field-grid admin-field-grid--2">
                {[["name", "Nombre"], ["slug", "Slug"], ["city", "Ciudad"], ["country", "País"], ["formedYear", "Año de formación"]].map(([key, label]) =>
                  <label key={key} className="admin-field">{label}<input className="form-control" type={key === "formedYear" ? "number" : "text"} required={key === "name"} {...register(key)} /></label>)}
              </div>
              <label className="admin-field">Biografía<textarea className="form-control admin-writing-area" rows={9} {...register("bio")} /></label>
            </section>
            <section className="admin-form-card"><h2>Fotografías</h2><div className="admin-field-grid admin-field-grid--2">
              {[["portrait", "Retrato"], ["cover", "Cabecera"]].map(([key, label]) => <div key={key}>
                <AdminImagePreview src={watch(key + "Url")} alt={label} label={label} />
                <label className="admin-field">{label}<input className="form-control" {...imageUrlInput} {...register(key + "Url")} /></label>
                <label className="admin-field">Subir {label.toLowerCase()}<input className="form-control" type="file" accept="image/*" {...register(key + "File")} /></label>
              </div>)}
            </div></section>
            {listFields.map(([name, title, columns]) => <ArtistListFields key={name} {...{ name, title, columns, control, register }} />)}
          </div><aside className="admin-editor-sidebar"><section className="admin-action-card">
            <label><input type="checkbox" {...register("rosterVisible")} /> Visible en Artistas</label>
            {error && <p role="alert">{error}</p>}
            <button className="btn admin-primary-action" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : isEditMode ? "Actualizar artista" : "Guardar artista"}</button>
          </section>{isEditMode && <section className="admin-danger-card"><button className="btn btn-danger" type="button" onClick={removeArtist}>Eliminar artista</button></section>}</aside></div>
        </form>}
    </div>
  </main>;
}
