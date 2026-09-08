import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { adminCreateBanner, adminDeleteBanner, adminGetBanner, adminUpdateBanner, uploadImage } from "../../services/api-services";

function localDateTime(value) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

export default function NewBannerPage({ isEditMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
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
      .catch(() => setLoadError("No se ha podido cargar el banner."));
  }, [id, isEditMode, reset]);

  const onSubmit = async (values) => {
    setSaveError("");
    try {
      let imageUrl = values.imageUrl?.trim() || "";
      if (values.imageFile?.[0]) {
        const upload = await uploadImage(values.imageFile[0]);
        imageUrl = upload.imageUrl || imageUrl;
      }
      const payload = {
        ...values,
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
      setSaveError(error.response?.data?.message || "No se ha podido guardar el banner.");
    }
  };

  const remove = async () => {
    if (!window.confirm("¿Seguro que quieres borrar este banner?")) return;
    await adminDeleteBanner(id);
    navigate("/admin");
  };

  return (
    <main className="admin-page admin-form-page">
      <header className="admin-form-header"><span>CR / Banner</span><span>{isEditMode ? "Editar" : "Nuevo"}</span><span>Anuncio público</span></header>
      <section className="admin-form-intro admin-form-intro--with-action">
        <p>Comunicación</p>
        <div><h1>{isEditMode ? "Editar banner" : "Nuevo banner"}</h1><span>Una ventana central para avisos puntuales.</span></div>
        {isEditMode && <button type="button" className="admin-delete" onClick={remove}>Borrar banner</button>}
      </section>
      {loadError && <p className="admin-status admin-status--error">{loadError}</p>}
      {saveError && <p className="admin-status admin-status--error">{saveError}</p>}
      <form className="admin-form row g-0" onSubmit={handleSubmit(onSubmit)}>
        <div className="col-12"><label className="form-label">Título</label><input className="form-control" {...register("title", { required: true })} />{errors.title && <span className="invalid-feedback d-block">Es obligatorio.</span>}</div>
        <div className="col-12"><label className="form-label">Texto</label><textarea className="form-control" rows="3" {...register("message")} /></div>
        <div className="col-md-8"><label className="form-label">Imagen</label><input className="form-control" type="url" placeholder="https://…" {...register("imageUrl")} /></div>
        <div className="col-md-4"><label className="form-label">O subir archivo</label><input className="form-control" type="file" accept="image/*" {...register("imageFile")} /></div>
        <div className="col-md-8"><label className="form-label">Enlace</label><input className="form-control" type="url" placeholder="https://…" {...register("linkUrl")} /></div>
        <div className="col-md-4"><label className="form-label">Texto del enlace</label><input className="form-control" {...register("linkLabel")} /></div>
        <div className="col-md-6"><label className="form-label">Visible desde</label><input className="form-control" type="datetime-local" {...register("startAt")} /></div>
        <div className="col-md-6"><label className="form-label">Visible hasta</label><input className="form-control" type="datetime-local" {...register("endAt")} /></div>
        <div className="col-12"><label className="form-check"><input className="form-check-input" type="checkbox" {...register("active")} /><span>Banner activo</span></label></div>
        <div className="col-12"><button className="btn admin-primary-action" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : "Guardar banner"}</button></div>
      </form>
    </main>
  );
}
