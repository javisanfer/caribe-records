// src/pages/admin/new-release.jsx
import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import {
  listArtists,
  adminCreateRelease,
  uploadImage,
} from "../../services/api-services";

const API_BASE = "/api/v1";

export default function NewReleasePage() {
  const { id } = useParams();
  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      tracklist: [{ title: "", duration: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tracklist",
  });

  const [artists, setArtists] = useState([]);
  const [loadingRelease, setLoadingRelease] = useState(false);
  const navigate = useNavigate();

  /* -------------------------------
   * Cargar artistas para el <select>
   * ------------------------------- */
  useEffect(() => {
    async function loadArtists() {
      try {
        const res = await listArtists();
        const items = Array.isArray(res) ? res : res.data || [];
        setArtists(items);
      } catch (err) {
        console.error("No se pudieron cargar los artistas", err);
        setArtists([]);
      }
    }

    loadArtists();
  }, []);

  /* --------------------------------
   * Cargar release existente (editar)
   * -------------------------------- */
  useEffect(() => {
    if (!isEditMode) return;

    async function fetchRelease() {
      try {
        setLoadingRelease(true);
        const res = await fetch(`${API_BASE}/admin/releases/${id}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Error loading release");
        }

        const data = await res.json();

        reset({
          title: data.title || "",
          artist: data.artist?._id || data.artist || "",
          catalog: data.catalog || "",
          serialNumber: data.serialNumber || "",
          format: data.format || "",
          release_date: data.release_date
            ? data.release_date.slice(0, 10)
            : "",
          country: data.country || "",
          spotifyUrl: data.spotifyUrl || "",
          coverUrl:
            data.cover?.url || data.cover_image || "",
          coverAlt: data.cover?.alt || "",
          tracklist:
            (data.tracklist || []).map((t) => ({
              title: t.title || "",
              duration: t.duration || "",
            })) || [{ title: "", duration: "" }],
        });
      } catch (err) {
        console.error(err);
        alert("Error loading release");
      } finally {
        setLoadingRelease(false);
      }
    }

    fetchRelease();
  }, [isEditMode, id, reset]);

  /* -------------
   * Guardar (POST/PATCH)
   * ------------- */
  const onSubmit = async (data) => {
    try {
      // 1) Subir cover si se ha elegido archivo
      let coverUrl = data.coverUrl?.trim() || "";

      const coverFile = data.coverFile?.[0];
      if (coverFile) {
        const uploadRes = await uploadImage(coverFile);
        coverUrl = uploadRes.imageUrl || coverUrl;
      }

      // 2) Construir payload para el backend
      const payload = {
        title: data.title.trim(),
        artist: data.artist, // ObjectId del artista
        format: data.format.trim().toLowerCase(),
        release_date: data.release_date || null,
        country: data.country?.trim() || "",
        spotifyUrl: data.spotifyUrl?.trim() || "",
        catalog: data.catalog?.trim() || "",
        serialNumber: data.serialNumber?.trim() || "",
        tracklist: (data.tracklist || [])
          .filter((t) => t.title && t.title.trim() !== "")
          .map((t, index) => ({
            position: index + 1,
            title: t.title.trim(),
            duration: t.duration?.trim() || "",
          })),
      };

      if (coverUrl) {
        payload.cover = {
          url: coverUrl,
          alt: data.coverAlt?.trim() || data.title.trim(),
        };
        payload.cover_image = coverUrl;
      }

      if (isEditMode) {
        // PATCH /admin/releases/:id
        const res = await fetch(`${API_BASE}/admin/releases/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          console.error("Error updating release:", errBody);
          throw new Error("Error updating release");
        }
      } else {
        // Crear como antes
        await adminCreateRelease(payload);
      }

      navigate("/admin");
    } catch (err) {
      console.error(err);
      alert(
        isEditMode
          ? "No se pudo actualizar el release."
          : "No se pudo crear el release."
      );
    }
  };

  /* -------------
   * Delete
   * ------------- */
  const handleDelete = async () => {
    if (!isEditMode) return;
    if (!window.confirm("¿Seguro que quieres borrar este release?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/releases/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("Error deleting release:", errBody);
        throw new Error("Error deleting release");
      }

      navigate("/admin");
    } catch (err) {
      console.error(err);
      alert("No se pudo borrar el release.");
    }
  };

  /* -------------
   * UI
   * ------------- */
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
          Caribe Records · {isEditMode ? "Editar lanzamiento" : "Nuevo lanzamiento"}
        </span>
        <span />
      </header>

      {/* Form */}
      <div className="admin-form-container">
        <div className="admin-form-intro admin-form-intro--with-action">
          <div>
            <p>02 / Lanzamiento</p>
            <h1>
            {isEditMode ? "Editar lanzamiento" : "Nuevo lanzamiento"}
            </h1>
            <span>Ficha de catálogo, portada y tracklist.</span>
          </div>

          {isEditMode && (
            <button
              type="button"
              className="admin-delete"
              onClick={handleDelete}
            >
              Eliminar lanzamiento
            </button>
          )}
        </div>

        {isEditMode && loadingRelease ? (
          <p className="text-muted">Loading release…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="row g-3 admin-form">
            {/* Title */}
            <div className="col-12 col-md-6">
              <label className="form-label">Título</label>
              <input
                className={`form-control bg-dark text-white border-secondary ${
                  errors.title ? "is-invalid" : ""
                }`}
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <div className="invalid-feedback">{errors.title.message}</div>
              )}
            </div>

            {/* Artist - Select by ID */}
            <div className="col-12 col-md-6">
              <label className="form-label">Artista</label>
              <select
                className={`form-control bg-dark text-white border-secondary ${
                  errors.artist ? "is-invalid" : ""
                }`}
                {...register("artist", { required: "Artist is required" })}
              >
                <option value="">Seleccionar artista…</option>
                {artists.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {errors.artist && (
                <div className="invalid-feedback">
                  {errors.artist.message}
                </div>
              )}
            </div>

            {/* Catalog */}
            <div className="col-12 col-md-4">
              <label className="form-label">Número de catálogo</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="CRB-001"
                {...register("catalog")}
              />
            </div>

            {/* Serial number */}
            <div className="col-12 col-md-4">
              <label className="form-label">Número de serie</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="#023/300"
                {...register("serialNumber")}
              />
            </div>

            {/* Format */}
            <div className="col-12 col-md-4">
              <label className="form-label">Formato</label>
              <select
                className={`form-control bg-dark text-white border-secondary ${
                  errors.format ? "is-invalid" : ""
                }`}
                {...register("format", { required: "Format is required" })}
              >
                <option value="">Seleccionar formato…</option>
                <option value="single">Single</option>
                <option value="ep">EP</option>
                <option value="lp">LP</option>
                <option value="recopilatorio">Recopilatorio</option>
              </select>
              {errors.format && (
                <div className="invalid-feedback">
                  {errors.format.message}
                </div>
              )}
            </div>

            {/* Release date */}
            <div className="col-12 col-md-4">
              <label className="form-label">Fecha de lanzamiento</label>
              <input
                type="date"
                className="form-control bg-dark text-white border-secondary"
                {...register("release_date")}
              />
            </div>

            {/* Country */}
            <div className="col-12 col-md-4">
              <label className="form-label">País</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="ES / US / AR…"
                {...register("country")}
              />
            </div>

            {/* Spotify URL */}
            <div className="col-12 col-md-4">
              <label className="form-label">Spotify URL</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="https://open.spotify.com/album/..."
                {...register("spotifyUrl")}
              />
            </div>

            {/* Cover URL */}
            <div className="col-12 col-md-6">
              <label className="form-label">URL de portada (opcional)</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="https://..."
                {...register("coverUrl")}
              />
              <div className="form-text text-secondary">
                Si subes un archivo, esta URL se ignora.
              </div>
            </div>

            {/* Cover file */}
            <div className="col-12 col-md-6">
              <label className="form-label">Archivo de portada</label>
              <input
                type="file"
                accept="image/*"
                className="form-control bg-dark text-white border-secondary"
                {...register("coverFile")}
              />
              <div className="form-text text-secondary">
                Se sube a Cloudinary vía /upload.
              </div>
            </div>

            {/* Cover alt */}
            <div className="col-12 col-md-6">
              <label className="form-label">Texto alternativo de portada</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="Alt text para accesibilidad"
                {...register("coverAlt")}
              />
            </div>

            {/* Tracklist header */}
            <div className="col-12 mt-4">
              <h5>Lista de temas</h5>
              <div className="row g-2 small text-secondary mb-1">
                <div className="col-1">#</div>
                <div className="col-7">Title</div>
                <div className="col-2">Duration</div>
                <div className="col-2" />
              </div>
            </div>

            {/* Tracklist rows */}
            {fields.map((item, index) => (
              <div key={item.id} className="row g-2 mb-2">
                <div className="col-1 d-flex align-items-center">
                  <span className="text-secondary">{index + 1}</span>
                </div>

                <div className="col-7">
                  <input
                    placeholder="Track title"
                    className="form-control bg-dark text-white border-secondary"
                    {...register(`tracklist.${index}.title`)}
                  />
                </div>

                <div className="col-2">
                  <input
                    placeholder="3:34"
                    className="form-control bg-dark text-white border-secondary"
                    {...register(`tracklist.${index}.duration`)}
                  />
                </div>

                <div className="col-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger w-100"
                    onClick={() => remove(index)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {/* Add track */}
            <div className="col-12">
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={() => append({ title: "", duration: "" })}
              >
                + Añadir tema
              </button>
            </div>

            {/* Submit */}
            <div className="col-12 mt-3">
              <button
                type="submit"
                className="btn btn-outline-light"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving…"
                  : isEditMode
                  ? "Actualizar lanzamiento"
                  : "Guardar lanzamiento"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
