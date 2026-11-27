import AdminFormHeading from "../../components/admin/admin-form-heading";
import { imageUrlInput } from "../../components/admin/image-url-input";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { adminCreateBanner, adminDeleteBanner, adminGetBanner, adminUpdateBanner, uploadImage } from "../../services/api-services";

import { localDateTime } from "../../utils/local-datetime";

function bannerRequestError(error, uploading) {
  const action = uploading ? "subir la imagen" : "guardar el banner";
  const { status, data } = error.response || {};
  if (uploading && status === 413) return "La imagen es demasiado grande para el servidor. Reduce su tamaño y vuelve a elegirla.";
  if (status === 401) return "Tu sesión ha caducado. Inicia sesión de nuevo para guardar el banner.";
  if (status === 429) return "Has hecho varios intentos seguidos. Espera un momento antes de volver a guardar.";
  if (typeof data?.message === "string" && data.message && status < 500) {
    return uploading ? `No se ha podido subir la imagen. ${data.message}` : data.message;
  }
  if (status) return `No se ha podido ${action}. El servidor ha respondido con el código ${status}.`;
  return `No se ha recibido confirmación al ${action}. Comprueba la conexión y revisa el panel antes de reintentarlo.`;
}

export default function NewBannerPage({ isEditMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const { register, handleSubmit, reset, resetField, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { active: false, linkLabel: "Más información" },
  });

  useEffect(() => {
    if (!isEditMode || !id) return;
    adminGetBanner(id)
      .then((banner) => reset({
        title: banner.title || "",
        message: banner.message || "",
        imageUrl: banner.imageUrl || "",
        linkUrl: banner.linkUrl || "",
        linkLabel: banner.linkLabel || "Más información",
        active: Boolean(banner.active),
        startAt: localDateTime(banner.startAt),
        endAt: localDateTime(banner.endAt),
      }))
      .catch(() => setLoadError("No se ha podido cargar el banner."))
      .finally(() => setLoading(false));
  }, [id, isEditMode, reset]);

  const onSubmit = async (values) => {
    setSaveError("");
    let uploading = false;
    try {
      let imageUrl = values.imageUrl?.trim() || "";
      if (values.imageFile?.[0]) {
        uploading = true;
        const upload = await uploadImage(values.imageFile[0]);
        if (!upload?.imageUrl) {
          setSaveError("El servidor no ha devuelto la dirección de la imagen. El banner sigue sin guardar.");
          return;
        }
        imageUrl = upload.imageUrl;
        setValue("imageUrl", imageUrl);
        resetField("imageFile");
        uploading = false;
      }
      const payload = {
        active: values.active,
        title: values.title.trim(),
        message: values.message?.trim() || "",
        imageUrl,
        linkUrl: values.linkUrl?.trim() || "",
        linkLabel: values.linkLabel?.trim() || "Más información",
        startAt: values.startAt ? new Date(values.startAt).toISOString() : null,
        endAt: values.endAt ? new Date(values.endAt).toISOString() : null,
      };
      if (isEditMode) await adminUpdateBanner(id, payload);
      else await adminCreateBanner(payload);
      navigate("/admin");
    } catch (error) {
      setSaveError(bannerRequestError(error, uploading));
    }
  };

  const remove = async () => {
    if (!window.confirm("¿Seguro que quieres borrar este banner?")) return;
    try {
      await adminDeleteBanner(id);
      navigate("/admin");
    } catch {
      setSaveError("No se ha podido borrar el banner. Comprueba tu sesión y vuelve a intentarlo.");
    }
  };

  return (
    <main className="admin-page admin-form-page">
      <div className="admin-form-container">
        <AdminFormHeading title={isEditMode ? "Editar banner" : "Nuevo banner"} />
        {loadError && <p className="admin-status admin-status--error" role="alert">{loadError}</p>}
        {loading && <p>Cargando banner…</p>}
        {!loading && !loadError && (
          <form className="admin-form admin-editor-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="admin-editor-layout">
              <div className="admin-editor-main">
                <section className="admin-form-card">
                  <h2>Contenido</h2>
                  <label className="admin-field">
                    Título
                    <input className="form-control" id="new-banner-title" aria-invalid={!!errors.title}
                      aria-describedby={errors.title ? "banner-title-error" : undefined}
                      {...register("title", { required: true })} />
                  </label>
                  {errors.title && <span id="banner-title-error" className="invalid-feedback d-block" role="alert">Escribe un título.</span>}
                  <label className="admin-field">
                    Texto
                    <textarea className="form-control" id="new-banner-message" rows="3" {...register("message")} />
                  </label>
                </section>
                <section className="admin-form-card">
                  <h2>Portada</h2>
                  <div className="admin-field-grid admin-field-grid--2">
                    <label className="admin-field">
                      URL de la imagen
                      <input className="form-control" id="new-banner-imageUrl" {...imageUrlInput} placeholder="https://…" {...register("imageUrl")} />
                    </label>
                    <label className="admin-field">
                      Subir archivo
                      <input className="form-control" id="banner-image-file" type="file" accept="image/jpeg,image/png,image/webp"
                        aria-describedby={errors.imageFile ? "banner-file-error" : undefined}
                        {...register("imageFile", {
                          validate: (files) => {
                            const file = files?.[0];
                            if (!file) return true;
                            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Elige una imagen JPEG, PNG o WebP.";
                            return file.size <= 10 * 1024 * 1024 || "La imagen supera el límite de 10 MiB.";
                          },
                        })} />
                    </label>
                  </div>
                  {errors.imageFile && <span id="banner-file-error" className="invalid-feedback d-block" role="alert">{errors.imageFile.message}</span>}
                </section>
                <section className="admin-form-card">
                  <h2>Enlace</h2>
                  <div className="admin-field-grid admin-field-grid--2">
                    <label className="admin-field">
                      Destino
                      <input className="form-control" id="new-banner-linkUrl" type="url" placeholder="https://…" {...register("linkUrl")} />
                    </label>
                    <label className="admin-field">
                      Texto del enlace
                      <input className="form-control" id="new-banner-linkLabel" {...register("linkLabel")} />
                    </label>
                  </div>
                </section>
              </div>
              <aside className="admin-editor-sidebar">
                <section className="admin-action-card">
                  <h2>Publicación</h2>
                  <label className="admin-field">
                    Visible desde
                    <input className="form-control" id="new-banner-startAt" type="datetime-local" step="1" {...register("startAt")} />
                  </label>
                  <label className="admin-field">
                    Visible hasta
                    <input className="form-control" id="new-banner-endAt" type="datetime-local" step="1" {...register("endAt")} />
                  </label>
                  <label className="form-check"><input className="form-check-input" type="checkbox" {...register("active")} />Banner activo</label>
                  {saveError && <p className="admin-status admin-status--error" role="alert">{saveError}</p>}
                  <button type="submit" className="btn admin-primary-action" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : "Guardar banner"}</button>
                </section>
                {isEditMode && <section className="admin-danger-card">
                  <button type="button" className="btn btn-danger" onClick={remove}>Borrar banner</button>
                </section>}
              </aside>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
