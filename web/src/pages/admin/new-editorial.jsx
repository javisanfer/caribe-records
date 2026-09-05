import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "/api/v1";

export default function NewEditorialPage({ isEditMode = false }) {
  const { slug } = useParams(); // /admin/edit-editorial/:slug
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      status: "draft",
      featured: false,
    },
  });

  const [loadingInitial, setLoadingInitial] = useState(isEditMode);

  const effectiveEditMode = isEditMode && !!slug;

  /* -----------------------------------------------
   * FETCH editorial existente si estamos editando
   * ----------------------------------------------- */
  useEffect(() => {
    if (!effectiveEditMode) return;

    const fetchEditorial = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/admin/editorials/slug/${encodeURIComponent(slug)}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error("Error loading editorial");
        const data = await res.json();

        // Básico
        setValue("title", data.title || "");
        setValue("slug", data.slug || "");
        setValue("subtitle", data.subtitle || "");
        setValue("status", data.status || "draft");
        setValue("featured", !!data.featured);
        setValue("section", data.section || "");
        setValue("series", data.series || "");

        // publishAt → datetime-local requiere formato YYYY-MM-DDTHH:mm
        if (data.publishAt) {
          setValue("publishAt", data.publishAt.slice(0, 16));
        }

        // Hero
        if (data.hero) {
          setValue("heroUrl", data.hero.url || "");
          setValue("heroAlt", data.hero.alt || "");
          setValue("heroCaption", data.hero.caption || "");
          setValue("heroCredit", data.hero.credit || "");
        }

        // Body (primer bloque paragraph)
        const paragraph =
          data.blocks?.find((b) => b.type === "paragraph")?.text || "";
        setValue("body", paragraph);

        // Embed (primer bloque embed)
        const embed =
          data.blocks?.find((b) => b.type === "embed")?.embed || "";
        setValue("embedHtml", embed);

        // Excerpt
        setValue("excerpt", data.excerpt || "");

        // Tags → string separada por comas
        setValue("tags", data.tags?.join(", ") || "");

        // SEO
        if (data.seo) {
          setValue("seoTitle", data.seo.title || "");
          setValue("seoDescription", data.seo.description || "");
          setValue("seoOgImage", data.seo.ogImage || "");
        }
      } catch (err) {
        console.error(err);
        alert("Error loading editorial");
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchEditorial();
  }, [effectiveEditMode, slug, setValue]);

  /* -----------------------------------------------
   * SUBMIT (POST o PATCH por slug)
   * ----------------------------------------------- */
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();

      // Campos normales (menos heroFile)
      Object.entries(data).forEach(([key, value]) => {
        if (key === "heroFile") return;
        if (value === undefined || value === null) return;

        if (key === "featured") {
          formData.append(key, value ? "true" : "false");
        } else {
          formData.append(key, value);
        }
      });

      // Archivo de imagen
      if (data.heroFile && data.heroFile[0]) {
        formData.append("heroFile", data.heroFile[0]);
      }

      const method = effectiveEditMode ? "PATCH" : "POST";
      const url = effectiveEditMode
        ? `${API_BASE}/admin/editorials/slug/${encodeURIComponent(slug)}`
        : `${API_BASE}/admin/editorials`;

      const res = await fetch(url, {
        method,
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        console.error("Error saving editorial:", error);
        throw new Error("Error saving editorial");
      }

      // Después de crear/editar volvemos al dashboard
      navigate("/admin");
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar la editorial.");
    }
  };

  /* -----------------------------------------------
   * DELETE (solo en edición)
   * ----------------------------------------------- */
  const handleDelete = async () => {
    if (
      !window.confirm("¿Seguro que quieres borrar esta editorial? Esta acción es permanente.")
    )
      return;

    try {
      const res = await fetch(
        `${API_BASE}/admin/editorials/slug/${encodeURIComponent(slug)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        console.error("Error deleting editorial:", error);
        throw new Error("Error deleting editorial");
      }

      navigate("/admin");
    } catch (err) {
      console.error(err);
      alert("No se pudo borrar la editorial.");
    }
  };

  /* -----------------------------------------------
   * UI
   * ----------------------------------------------- */
  const headerLabel = effectiveEditMode ? "Editar editorial" : "Nueva editorial";
  const titleLabel = effectiveEditMode ? "Editar editorial" : "Nueva editorial";

  return (
    <main className="admin-page admin-form-page">
      <header className="admin-form-header">
        <button
          type="button"
          className="admin-back"
          onClick={() => navigate(-1)}
        >
          ← Panel
        </button>
        <span>
          Caribe Records · {headerLabel}
        </span>
        <span />
      </header>

      <div className="admin-form-container">
        <div className="admin-form-intro">
          <p>03 / Editorial</p>
          <h1>{titleLabel}</h1>
          <span>Portada, contenido, publicación y SEO.</span>
        </div>

        {effectiveEditMode && loadingInitial ? (
          <p className="text-muted">Loading editorial…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="row g-3 admin-form">
            {/* --- Basic Fields --- */}
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

            <div className="col-12 col-md-6">
              <label className="form-label">
                Slug{" "}
                <span className="text-muted">(opcional, se autogenera)</span>
              </label>
              <input
                className="form-control bg-dark text-white border-secondary"
                {...register("slug")}
              />
            </div>

            <div className="col-12">
              <label className="form-label">Subtítulo</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                {...register("subtitle")}
              />
            </div>

            {/* --- Status + publishAt --- */}
            <div className="col-12 col-md-4">
              <label className="form-label">Estado</label>
              <select
                className="form-select bg-dark text-white border-secondary"
                {...register("status")}
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicada</option>
                <option value="scheduled">Programada</option>
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">
                Publicar el <span className="text-muted">(si está programada)</span>
              </label>
              <input
                type="datetime-local"
                className="form-control bg-dark text-white border-secondary"
                {...register("publishAt")}
              />
            </div>

            <div className="col-12 col-md-4 d-flex align-items-end">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="featuredCheck"
                  {...register("featured")}
                />
                <label className="form-check-label" htmlFor="featuredCheck">
                  Destacada
                </label>
              </div>
            </div>

            {/* --- Section / Series --- */}
            <div className="col-12 col-md-6">
              <label className="form-label">Sección</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="Ej: Editorial"
                {...register("section")}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Serie</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="Ej: Memory of Music"
                {...register("series")}
              />
            </div>

            {/* --- Hero Image --- */}
            <div className="col-12 mt-3">
              <h2 className="h6 text-uppercase mb-2">Imagen principal</h2>
            </div>

            <div className="col-12">
              <label className="form-label">Subir imagen</label>
              <input
                type="file"
                accept="image/*"
                className="form-control bg-dark text-white"
                {...register("heroFile")}
              />
            </div>

            <div className="col-12">
              <label className="form-label">O usar una URL</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="https://..."
                {...register("heroUrl")}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Hero ALT</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="Descripción de la imagen"
                {...register("heroAlt")}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Pie de foto</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="Pie de foto"
                {...register("heroCaption")}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Crédito de imagen</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="Autor / agencia"
                {...register("heroCredit")}
              />
            </div>

            {/* --- Body --- */}
            <div className="col-12 mt-3">
              <label className="form-label">Cuerpo del artículo</label>
              <textarea
                rows={8}
                className={`form-control bg-dark text-white border-secondary ${
                  errors.body ? "is-invalid" : ""
                }`}
                {...register("body", { required: "Content is required" })}
              />
              {errors.body && (
                <div className="invalid-feedback">{errors.body.message}</div>
              )}
            </div>

            {/* --- Embed HTML (iframe) --- */}
            <div className="col-12">
              <label className="form-label">
                Embed HTML (iframe de Spotify / YouTube){" "}
                <span className="text-muted">(opcional)</span>
              </label>
              <textarea
                rows={4}
                className="form-control bg-dark text-white border-secondary"
                placeholder='<iframe src="https://open.spotify.com/embed/track/..." width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>'
                {...register("embedHtml")}
              />
            </div>

            {/* --- Excerpt / Tags --- */}
            <div className="col-12">
              <label className="form-label">Extracto</label>
              <textarea
                rows={3}
                className="form-control bg-dark text-white border-secondary"
                {...register("excerpt")}
              />
            </div>

            <div className="col-12">
              <label className="form-label">
                Tags{" "}
                <span className="text-muted">
                  (separadas por comas: Aeronave Adolescente, shoegaze, Galicia)
                </span>
              </label>
              <input
                className="form-control bg-dark text-white border-secondary"
                {...register("tags")}
              />
            </div>

            {/* --- SEO --- */}
            <div className="col-12 mt-3">
              <h2 className="h6 text-uppercase mb-2">SEO</h2>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">SEO Title</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                {...register("seoTitle")}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">SEO Description</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                {...register("seoDescription")}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">
                SEO ogImage <span className="text-muted">(por defecto la hero)</span>
              </label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="https://..."
                {...register("seoOgImage")}
              />
            </div>

            {/* --- Botones --- */}
            <div className="col-12 mt-4 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-outline-light"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? effectiveEditMode
                    ? "Saving…"
                    : "Saving…"
                  : effectiveEditMode
                  ? "Actualizar editorial"
                  : "Guardar editorial"}
              </button>

              {effectiveEditMode && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Eliminar editorial
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
