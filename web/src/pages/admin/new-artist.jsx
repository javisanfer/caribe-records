// src/pages/admin/new-artist.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import {
  adminCreateArtist,
  uploadImage,
} from "../../services/api-services";

const API_BASE = "/api/v1";

export default function NewArtistPage({ isEditMode = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm();

  const navigate = useNavigate();
  const { slug } = useParams(); // /admin/edit-artist/:slug

  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [existingPhotos, setExistingPhotos] = useState({
    portraitUrl: undefined,
    coverUrl: undefined,
  });

  // -------------------------------------------
  // CARGAR ARTISTA EXISTENTE (solo en edición)
  // -------------------------------------------
  useEffect(() => {
    if (!isEditMode || !slug) return;

    const loadArtist = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/admin/artists/slug/${encodeURIComponent(slug)}`,
          { credentials: "include" }
        );

        if (!res.ok) {
          console.error(
            "Error response loadArtist:",
            await res.json().catch(() => ({}))
          );
          return;
        }

        const data = await res.json();

        // Guardamos URLs actuales de fotos para reutilizarlas si no se suben nuevas
        setExistingPhotos({
          portraitUrl: data.photos?.portraitUrl,
          coverUrl: data.photos?.coverUrl,
        });

        // Pre-rellenamos el formulario
        reset({
          name: data.name || "",
          slug: data.slug || "",
          city: data.city || "",
          country: data.country || "",
          bio: data.bio || "",
        });
      } catch (err) {
        console.error("Error cargando artista:", err);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadArtist();
  }, [isEditMode, slug, reset]);

  // -------------------------------------------
  // SUBMIT (CREATE o UPDATE)
  // -------------------------------------------
  const onSubmit = async (data) => {
    try {
      // 1) Subimos imágenes a Cloudinary si se han seleccionado
      let portraitUrl = existingPhotos.portraitUrl;
      let coverUrl = existingPhotos.coverUrl;

      const portraitFile = data.portraitFile?.[0];
      const coverFile = data.coverFile?.[0];

      if (portraitFile) {
        const res = await uploadImage(portraitFile);
        portraitUrl = res.imageUrl;
      }

      if (coverFile) {
        const res = await uploadImage(coverFile);
        coverUrl = res.imageUrl;
      }

      // 2) Construimos el payload para el artista
      const payload = {
        name: data.name.trim(),
        slug: data.slug?.trim() || undefined, // si lo dejas vacío, lo genera/ajusta el backend

        city: data.city?.trim() || undefined,
        country: data.country?.trim() || undefined,
        bio: data.bio?.trim() || undefined,

        photos: {
          portraitUrl: portraitUrl || undefined,
          coverUrl: coverUrl || portraitUrl || undefined,
        },
      };

      if (!isEditMode) {
        // ------- CREAR -------
        await adminCreateArtist(payload);
      } else {
        // ------- ACTUALIZAR POR SLUG -------
        const res = await fetch(
          `${API_BASE}/admin/artists/slug/${encodeURIComponent(slug)}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          console.error("Error response (update):", errorBody);

          if (res.status === 409 && errorBody.error?.slug) {
            setError("slug", { message: "Slug ya está en uso" });
            return;
          }

          throw new Error("Error al actualizar artista");
        }
      }

      // Después de crear/actualizar volvemos al dashboard
      navigate("/admin");
    } catch (err) {
      console.error(err);

      // ejemplo: slug duplicado al crear vía adminCreateArtist
      if (err.response?.status === 409 && err.response.data?.error?.slug) {
        setError("slug", { message: "Slug ya está en uso" });
      } else {
        alert(
          isEditMode
            ? "No se pudo actualizar el artista."
            : "No se pudo crear el artista."
        );
      }
    }
  };

  // -------------------------------------------
  // DELETE (solo en edición)
  // -------------------------------------------
  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que quieres borrar este artista?")) return;

    try {
      const res = await fetch(
        `${API_BASE}/admin/artists/slug/${encodeURIComponent(slug)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        console.error("Error delete:", errorBody);
        throw new Error("Error al borrar artista");
      }

      navigate("/admin");
    } catch (err) {
      console.error(err);
      alert("No se pudo borrar el artista.");
    }
  };

  const titleText = isEditMode ? "Editar artista" : "Nuevo artista";
  const headerText = isEditMode
    ? "Caribe Records · Editar artista"
    : "Caribe Records · Nuevo artista";

  return (
    <main className="admin-page admin-form-page">
      {/* Header */}
      <header className="admin-form-header">
        <button
          type="button"
          className="admin-back"
          onClick={() => navigate(-1)}
        >
          ← Panel
        </button>
        <span>
          {headerText}
        </span>
        <span />
      </header>

      <div className="admin-form-container">
        <div className="admin-form-intro">
          <div>
            <p>Artistas / {isEditMode ? "Editar" : "Crear"}</p>
            <h1>{titleText}</h1>
          </div>
          <span>Completa primero la información esencial. Podrás volver a editarla cuando quieras.</span>
        </div>

        {isEditMode && loadingInitial ? (
          <p className="text-muted">Loading artist…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="admin-form admin-editor-form">
            <div className="admin-editor-layout">
              <div className="admin-editor-main">
                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><span>01</span><div><h2>Identidad</h2><p>El nombre público y la dirección de su ficha.</p></div></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field">
                      <label className="form-label">Nombre <b>Obligatorio</b></label>
                      <input className={`form-control ${errors.name ? "is-invalid" : ""}`} placeholder="Nombre del artista" {...register("name", { required: "Escribe el nombre del artista" })} />
                      {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                    </div>
                    <div className="admin-field">
                      <label className="form-label">Slug <em>Opcional</em></label>
                      <input className={`form-control ${errors.slug ? "is-invalid" : ""}`} placeholder="se-genera-automaticamente" {...register("slug")} />
                      <div className="form-text">Déjalo vacío para generarlo desde el nombre.</div>
                      {errors.slug && <div className="invalid-feedback">{errors.slug.message}</div>}
                    </div>
                  </div>
                </section>

                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><span>02</span><div><h2>Origen</h2><p>Información breve que aparecerá en su perfil.</p></div></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field"><label className="form-label">Ciudad</label><input className="form-control" placeholder="A Coruña" {...register("city")} /></div>
                    <div className="admin-field"><label className="form-label">País</label><input className="form-control" placeholder="ES" {...register("country")} /></div>
                  </div>
                </section>

                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><span>03</span><div><h2>Imágenes</h2><p>Retrato para listados y cabecera para la ficha.</p></div></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field"><label className="form-label">Retrato</label><input type="file" accept="image/*" className="form-control" {...register("portraitFile")} /><div className="form-text">Imagen vertical o cuadrada en JPG, PNG o WebP.</div></div>
                    <div className="admin-field"><label className="form-label">Cabecera <em>Opcional</em></label><input type="file" accept="image/*" className="form-control" {...register("coverFile")} /><div className="form-text">Si no eliges una, se utilizará el retrato.</div></div>
                  </div>
                </section>

                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><span>04</span><div><h2>Biografía</h2><p>Cuenta quién es y sitúa su trabajo.</p></div></div>
                  <div className="admin-field"><label className="form-label">Texto</label><textarea rows={9} className="form-control admin-writing-area" placeholder="Escribe la biografía del artista…" {...register("bio")} /></div>
                </section>
              </div>

              <aside className="admin-editor-sidebar">
                <section className="admin-action-card">
                  <span className="admin-action-card__status">{isEditMode ? "Ficha existente" : "Nueva ficha"}</span>
                  <h2>{isEditMode ? "Guardar cambios" : "Crear artista"}</h2>
                  <p>Revisa los campos obligatorios antes de guardar.</p>
                  <div className="admin-action-checks"><span><i>01</i> Identidad pública</span><span><i>02</i> Origen y contexto</span><span><i>03</i> Material visual</span><span><i>04</i> Biografía</span></div>
                  <button type="submit" className="btn admin-primary-action" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : isEditMode ? "Actualizar artista" : "Guardar artista"}</button>
                </section>
                {isEditMode && <section className="admin-danger-card"><h3>Zona sensible</h3><p>Esta acción elimina definitivamente la ficha.</p><button type="button" className="btn btn-danger" onClick={handleDelete}>Eliminar artista</button></section>}
              </aside>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
