// src/pages/admin/new-artist.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import {
  adminCreateArtist,
  uploadImage,
} from "../../services/api-services";

const API_BASE = "http://localhost:3000/api/v1";

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

  const titleText = isEditMode ? "Edit Artist" : "Create Artist";
  const headerText = isEditMode
    ? "Caribe Records · Edit Artist"
    : "Caribe Records · New Artist";

  return (
    <div className="bg-black text-white min-vh-100">
      {/* Header */}
      <header className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-dark">
        <button
          type="button"
          className="btn btn-sm btn-outline-light"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <span className="text-uppercase small letter-spaced">
          {headerText}
        </span>
        <span />
      </header>

      {/* Form */}
      <div className="container py-4">
        <h1 className="h5 text-uppercase mb-3">{titleText}</h1>

        {isEditMode && loadingInitial ? (
          <p className="text-muted">Loading artist…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="row g-3">
            {/* Name */}
            <div className="col-12 col-md-6">
              <label className="form-label">Name</label>
              <input
                className={`form-control bg-dark text-white border-secondary ${
                  errors.name ? "is-invalid" : ""
                }`}
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && (
                <div className="invalid-feedback">{errors.name.message}</div>
              )}
            </div>

            {/* Slug */}
            <div className="col-12 col-md-6">
              <label className="form-label">Slug</label>
              <input
                className={`form-control bg-dark text-white border-secondary ${
                  errors.slug ? "is-invalid" : ""
                }`}
                placeholder="artist-slug (opcional)"
                {...register("slug")}
              />
              {errors.slug && (
                <div className="invalid-feedback">{errors.slug.message}</div>
              )}
            </div>

            {/* City */}
            <div className="col-12 col-md-6">
              <label className="form-label">City</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                {...register("city")}
              />
            </div>

            {/* Country */}
            <div className="col-12 col-md-6">
              <label className="form-label">Country</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="ES, PT, FR…"
                {...register("country")}
              />
            </div>

            {/* Portrait Image File */}
            <div className="col-12 col-md-6">
              <label className="form-label">Portrait Image</label>
              <input
                type="file"
                accept="image/*"
                className="form-control bg-dark text-white border-secondary"
                {...register("portraitFile")}
              />
              <div className="form-text text-secondary">
                Imagen principal del artista (JPG/PNG).
              </div>
            </div>

            {/* Cover Image File */}
            <div className="col-12 col-md-6">
              <label className="form-label">Cover Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                className="form-control bg-dark text-white border-secondary"
                {...register("coverFile")}
              />
              <div className="form-text text-secondary">
                Si no subes ninguna, usaremos la portrait como cover.
              </div>
            </div>

            {/* Bio */}
            <div className="col-12">
              <label className="form-label">Bio</label>
              <textarea
                rows={6}
                className="form-control bg-dark text-white border-secondary"
                {...register("bio")}
              />
            </div>

            {/* Botones */}
            <div className="col-12 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-outline-light"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isEditMode
                    ? "Updating…"
                    : "Saving…"
                  : isEditMode
                  ? "Update artist"
                  : "Save artist"}
              </button>

              {isEditMode && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Delete artist
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}