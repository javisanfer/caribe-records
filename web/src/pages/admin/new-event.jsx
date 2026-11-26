import AdminFormHeading from "../../components/admin/admin-form-heading";
import { imageUrlInput } from "../../components/admin/image-url-input";
// src/pages/admin/new-event.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { adminListArtists, adminCreateEvent, uploadImage } from "../../services/api-services";
import AdminImagePreview from "../../components/admin/admin-image-preview";

import { localDateTime } from "../../utils/local-datetime";

import AdminRelations from "../../components/admin/admin-relations";

const API_BASE = "/api/v1";

export default function NewEventPage({ isEditMode = false }) {
  const { slug } = useParams(); // /admin/edit-event/:slug
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { isActive: true, lineup: [] } });

  const [artists, setArtists] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);

  const [loadError, setLoadError] = useState("");
  const effectiveEditMode = isEditMode && !!slug;
  const posterUrl = watch("posterUrl") || "";

  // ------------------------------
  // Cargar artistas para el select
  // ------------------------------
  useEffect(() => {
    async function loadArtists() {
      try {
        const res = await adminListArtists();
        const items = Array.isArray(res) ? res : res.data || [];
        setArtists(items);
      } catch (err) {
        console.error("No se pudieron cargar los artistas", err);
        setArtists([]);
      }
    }

    loadArtists();
  }, []);

  // ------------------------------------
  // Cargar evento existente (modo edit)
  // ------------------------------------
  useEffect(() => {
    if (!effectiveEditMode) return;

    const fetchEvent = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/admin/events/slug/${encodeURIComponent(slug)}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error("Error loading event");
        const data = await res.json();

        // Campos básicos
        setValue("title", data.title || "");
        setValue("venue", data.venue || "");
        setValue("city", data.city || "");
        setValue("country", data.country || "");
        setValue("address", data.address || "");
        setValue("ticketUrl", data.ticketUrl || "");
        setValue("isActive", data.isActive !== false);
        setValue("artistName", data.artistName || "");
        setValue("sourceUrl", data.sourceUrl || "");
        setValue("description", data.description || "");
        setValue("posterUrl", data.posterUrl || "");

        // Fecha → datetime-local
        if (data.date) {
          setValue("datetime", localDateTime(data.date));
        }

        setValue("lineup", (data.lineup || []).map((artist) => artist._id || artist));
      } catch (err) {
        console.error(err);
        setLoadError("No se pudo cargar el evento.");
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchEvent();
  }, [effectiveEditMode, slug, setValue]);

  // ------------------------------
  // SUBMIT (create / update)
  // ------------------------------
  const onSubmit = async (data) => {
    try {
      let nextPosterUrl = data.posterUrl?.trim() || "";
      if (data.posterFile?.[0]) {
        const uploadResponse = await uploadImage(data.posterFile[0]);
        nextPosterUrl = uploadResponse.imageUrl || nextPosterUrl;
      }

      const dateIso = data.datetime
        ? new Date(data.datetime).toISOString()
        : null;

      const payload = {
        title: data.title.trim(),
        date: dateIso,
        venue: data.venue?.trim() || "",
        city: data.city.trim(),
        country: data.country?.trim() || "ES",
        address: data.address?.trim() || "",
        ticketUrl: data.ticketUrl?.trim() || "",
        description: data.description?.trim() || "",
        posterUrl: nextPosterUrl,
        lineup: data.lineup || [],
        artistName: data.artistName.trim(), sourceUrl: data.sourceUrl.trim(), isActive: data.isActive,
      };

      if (!effectiveEditMode) {
        // CREAR → usamos el service que ya tenías
        await adminCreateEvent(payload);
      } else {
        // EDITAR → PATCH por slug
        const res = await fetch(
          `${API_BASE}/admin/events/slug/${encodeURIComponent(slug)}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          console.error("Error updating event:", error);
          throw new Error("Error updating event");
        }
      }

      // después de crear / editar, volvemos al dashboard
      navigate("/admin");
    } catch (err) {
      console.error(err);
      alert(
        effectiveEditMode
          ? "No se pudo actualizar el evento."
          : "No se pudo crear el evento."
      );
    }
  };

  // ------------------------------
  // DELETE (solo en edición)
  // ------------------------------
  const handleDelete = async () => {
    if (!effectiveEditMode) return;

    if (
      !window.confirm("¿Seguro que quieres borrar este evento? Esta acción es permanente.")
    )
      return;

    try {
      const res = await fetch(
        `${API_BASE}/admin/events/slug/${encodeURIComponent(slug)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        console.error("Error deleting event:", error);
        throw new Error("Error deleting event");
      }

      navigate("/admin");
    } catch (err) {
      console.error(err);
      alert("No se pudo borrar el evento.");
    }
  };

  const titleLabel = effectiveEditMode ? "Editar evento" : "Nuevo evento";

  return (
    <main className="admin-page admin-form-page">
      {/* Header */}

      {/* Form */}
      <div className="admin-form-container">
        <AdminFormHeading title={titleLabel} />

        {loadError ? <p role="alert">{loadError}</p> : effectiveEditMode && loadingInitial ? (
          <p className="text-muted">Loading event…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="admin-form admin-editor-form">
            <div className="admin-editor-layout">
              <div className="admin-editor-main">
                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><h2>Evento</h2></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field admin-field--wide"><label htmlFor="new-event-title" className="form-label">Título <b>Obligatorio</b></label><input id="new-event-title" className={`form-control ${errors.title ? "is-invalid" : ""}`} placeholder="Nombre del evento" {...register("title", { required: "Escribe el título del evento" })} />{errors.title && <div className="invalid-feedback">{errors.title.message}</div>}</div>
                    <AdminRelations title="Artistas del cartel" items={artists} selected={watch("lineup")} onChange={(ids) => setValue("lineup", ids)} />
                    <label className="admin-field">Nombre público del cartel<input className="form-control" {...register("artistName")} /></label>
                    <div className="admin-field"><label htmlFor="new-event-datetime" className="form-label">Fecha y hora <b>Obligatorio</b></label><input id="new-event-datetime" type="datetime-local" step="1" className={`form-control ${errors.datetime ? "is-invalid" : ""}`} {...register("datetime", { required: "Selecciona fecha y hora" })} />{errors.datetime && <div className="invalid-feedback">{errors.datetime.message}</div>}</div>
                  </div>
                </section>

                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><h2>Lugar</h2></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field admin-field--wide"><label htmlFor="new-event-venue" className="form-label">Sala o espacio</label><input id="new-event-venue" className="form-control" required placeholder="Nombre del recinto" {...register("venue")} /></div>
                    <div className="admin-field"><label htmlFor="new-event-city" className="form-label">Ciudad <b>Obligatorio</b></label><input id="new-event-city" className={`form-control ${errors.city ? "is-invalid" : ""}`} placeholder="Madrid" {...register("city", { required: "Escribe la ciudad" })} />{errors.city && <div className="invalid-feedback">{errors.city.message}</div>}</div>
                    <div className="admin-field"><label htmlFor="new-event-country" className="form-label">País</label><input id="new-event-country" className="form-control" placeholder="ES" {...register("country")} /></div>
                    <div className="admin-field admin-field--wide"><label htmlFor="new-event-address" className="form-label">Dirección</label><input id="new-event-address" className="form-control" placeholder="Calle, número y código postal" {...register("address")} /></div>
                  </div>
                </section>

                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><h2>Cartel</h2></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field admin-field--wide"><AdminImagePreview src={posterUrl} alt="Cartel actual del evento" label="Cartel guardado" /></div>
                    <div className="admin-field"><label htmlFor="new-event-posterFile" className="form-label">Archivo</label><input id="new-event-posterFile" type="file" accept="image/*" className="form-control" {...register("posterFile")} /><div className="form-text">Déjalo vacío para conservar el cartel actual.</div></div>
                    <div className="admin-field"><label htmlFor="new-event-posterUrl" className="form-label">URL alternativa</label><input id="new-event-posterUrl" {...imageUrlInput} className="form-control" placeholder="https://…" {...register("posterUrl")} /></div>
                  </div>
                </section>

                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><h2>Información pública</h2></div>
                  <label className="admin-field">Enlace al cartel o archivo<input className="form-control" type="url" {...register("sourceUrl")} /></label>
                  <label><input type="checkbox" {...register("isActive")} /> Visible en Eventos</label>
                  <div className="admin-field"><label htmlFor="new-event-ticketUrl" className="form-label">Enlace de entradas</label><input id="new-event-ticketUrl" type="url" className="form-control" placeholder="https://…" {...register("ticketUrl")} /></div>
                  <div className="admin-field"><label htmlFor="new-event-description" className="form-label">Descripción <em>Opcional</em></label><textarea id="new-event-description" rows={7} className="form-control admin-writing-area" placeholder="Información útil sobre el evento…" {...register("description")} /></div>
                </section>
              </div>

              <aside className="admin-editor-sidebar">
                <section className="admin-action-card"><button type="submit" className="btn admin-primary-action" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : effectiveEditMode ? "Actualizar evento" : "Guardar evento"}</button></section>
                {effectiveEditMode && <section className="admin-danger-card"><h3>Zona sensible</h3><p>El evento desaparecerá del calendario.</p><button type="button" className="btn btn-danger" onClick={handleDelete}>Eliminar evento</button></section>}
              </aside>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
