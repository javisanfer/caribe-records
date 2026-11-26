import PanelBackLink from "../../components/admin/panel-back-link";
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
      <header className="admin-form-header"><PanelBackLink /></header>
      <div className="admin-form-container">
      <header className="admin-form-intro">
        <h1>{isEditMode ? "Editar banner" : "Nuevo banner"}</h1>
        {isEditMode && <button type="button" className="admin-delete" onClick={remove}>Borrar banner</button>}
      </header>
      {loadError && <p className="admin-status admin-status--error">{loadError}</p>}
      {loading && <p>Cargando banner…</p>}
      {!loading && !loadError && <form className="admin-form row g-0" onSubmit={handleSubmit(onSubmit)}>
        <div className="col-12"><label htmlFor="new-banner-title" className="form-label">Título</label><input id="new-banner-title" className="form-control" {...register("title", { required: true })} />{errors.title && <span className="invalid-feedback d-block">Es obligatorio.</span>}</div>
        <div className="col-12"><label htmlFor="new-banner-message" className="form-label">Texto</label><textarea id="new-banner-message" className="form-control" rows="3" {...register("message")} /></div>
        <div className="col-md-8"><label htmlFor="new-banner-imageUrl" className="form-label">Imagen</label><input id="new-banner-imageUrl" className="form-control" {...imageUrlInput} placeholder="https://…" {...register("imageUrl")} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="banner-image-file">O subir archivo</label><input id="banner-image-file" className="form-control" type="file" accept="image/jpeg,image/png,image/webp" {...register("imageFile", {
          validate: (files) => {
            const file = files?.[0];
            if (!file) return true;
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Elige una imagen JPEG, PNG o WebP.";
            return file.size <= 10 * 1024 * 1024 || "La imagen supera el límite de 10 MiB.";
          },
        })} />{errors.imageFile && <span className="invalid-feedback d-block" role="alert">{errors.imageFile.message}</span>}</div>
        <div className="col-md-8"><label htmlFor="new-banner-linkUrl" className="form-label">Enlace</label><input id="new-banner-linkUrl" className="form-control" type="url" placeholder="https://…" {...register("linkUrl")} /></div>
        <div className="col-md-4"><label htmlFor="new-banner-linkLabel" className="form-label">Texto del enlace</label><input id="new-banner-linkLabel" className="form-control" {...register("linkLabel")} /></div>
        <div className="col-md-6"><label htmlFor="new-banner-startAt" className="form-label">Visible desde</label><input id="new-banner-startAt" className="form-control" type="datetime-local" step="1" {...register("startAt")} /></div>
        <div className="col-md-6"><label htmlFor="new-banner-endAt" className="form-label">Visible hasta</label><input id="new-banner-endAt" className="form-control" type="datetime-local" step="1" {...register("endAt")} /></div>
        <div className="col-12"><label className="form-check"><input className="form-check-input" type="checkbox" {...register("active")} /><span>Banner activo</span></label></div>
        {saveError && <p className="admin-status admin-status--error" role="alert">{saveError}</p>}
        <div className="col-12"><button className="btn admin-primary-action" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : "Guardar banner"}</button></div>
      </form>}
    </div>
    </main>
  );
}
