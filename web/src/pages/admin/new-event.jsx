// src/pages/admin/new-event.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { listArtists, adminCreateEvent, uploadImage } from "../../services/api-services";
import AdminImagePreview from "../../components/admin/admin-image-preview";

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
  } = useForm();

  const [artists, setArtists] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);

  const effectiveEditMode = isEditMode && !!slug;
  const posterUrl = watch("posterUrl") || "";

  // ------------------------------
  // Cargar artistas para el select
  // ------------------------------
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
        setValue("description", data.description || "");
        setValue("posterUrl", data.posterUrl || "");

        // Fecha → datetime-local
        if (data.date) {
          setValue("datetime", data.date.slice(0, 16));
        }

        // Artist principal = lineup[0]
        const mainArtist = data.lineup?.[0];
        const artistId =
          typeof mainArtist === "string" ? mainArtist : mainArtist?._id;
        if (artistId) setValue("artistId", artistId);
      } catch (err) {
        console.error(err);
        alert("Error loading event");
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
        lineup: data.artistId ? [data.artistId] : [],
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

  const headerLabel = effectiveEditMode ? "Editar evento" : "Nuevo evento";
  const titleLabel = effectiveEditMode ? "Editar evento" : "Nuevo evento";

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
          Caribe Records · {headerLabel}
        </span>
        <span />
      </header>

      {/* Form */}
      <div className="admin-form-container">
        <div className="admin-form-intro">
          <div><p>Eventos / {effectiveEditMode ? "Editar" : "Crear"}</p><h1>{titleLabel}</h1></div>
          <span>Organiza los datos como los verá quien busca fecha, lugar y entradas.</span>
        </div>

        {effectiveEditMode && loadingInitial ? (
          <p className="text-muted">Loading event…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="admin-form admin-editor-form">
            <div className="admin-editor-layout">
              <div className="admin-editor-main">
                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><span>01</span><div><h2>Evento</h2><p>Qué ocurre y quién actúa.</p></div></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field admin-field--wide"><label className="form-label">Título <b>Obligatorio</b></label><input className={`form-control ${errors.title ? "is-invalid" : ""}`} placeholder="Nombre del evento" {...register("title", { required: "Escribe el título del evento" })} />{errors.title && <div className="invalid-feedback">{errors.title.message}</div>}</div>
                    <div className="admin-field"><label className="form-label">Artista <b>Obligatorio</b></label><select className={`form-select ${errors.artistId ? "is-invalid" : ""}`} {...register("artistId", { required: "Selecciona un artista" })}><option value="">Seleccionar artista…</option>{artists.map((artist) => <option key={artist._id} value={artist._id}>{artist.name}</option>)}</select>{errors.artistId && <div className="invalid-feedback">{errors.artistId.message}</div>}</div>
                    <div className="admin-field"><label className="form-label">Fecha y hora <b>Obligatorio</b></label><input type="datetime-local" className={`form-control ${errors.datetime ? "is-invalid" : ""}`} {...register("datetime", { required: "Selecciona fecha y hora" })} />{errors.datetime && <div className="invalid-feedback">{errors.datetime.message}</div>}</div>
                  </div>
                </section>

                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><span>02</span><div><h2>Lugar</h2><p>Datos para que el público pueda encontrarlo.</p></div></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field admin-field--wide"><label className="form-label">Sala o espacio</label><input className="form-control" placeholder="Nombre del recinto" {...register("venue")} /></div>
                    <div className="admin-field"><label className="form-label">Ciudad <b>Obligatorio</b></label><input className={`form-control ${errors.city ? "is-invalid" : ""}`} placeholder="Madrid" {...register("city", { required: "Escribe la ciudad" })} />{errors.city && <div className="invalid-feedback">{errors.city.message}</div>}</div>
                    <div className="admin-field"><label className="form-label">País</label><input className="form-control" placeholder="ES" {...register("country")} /></div>
                    <div className="admin-field admin-field--wide"><label className="form-label">Dirección</label><input className="form-control" placeholder="Calle, número y código postal" {...register("address")} /></div>
                  </div>
                </section>

                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><span>03</span><div><h2>Cartel</h2><p>La imagen principal del evento.</p></div></div>
                  <div className="admin-field-grid admin-field-grid--2">
                    <div className="admin-field admin-field--wide"><AdminImagePreview src={posterUrl} alt="Cartel actual del evento" label="Cartel guardado" /></div>
                    <div className="admin-field"><label className="form-label">Archivo</label><input type="file" accept="image/*" className="form-control" {...register("posterFile")} /><div className="form-text">Déjalo vacío para conservar el cartel actual.</div></div>
                    <div className="admin-field"><label className="form-label">URL alternativa</label><input type="url" className="form-control" placeholder="https://…" {...register("posterUrl")} /></div>
                  </div>
                </section>

                <section className="admin-form-card">
                  <div className="admin-form-card__heading"><span>04</span><div><h2>Información pública</h2><p>Venta de entradas y contexto adicional.</p></div></div>
                  <div className="admin-field"><label className="form-label">Enlace de entradas</label><input type="url" className="form-control" placeholder="https://…" {...register("ticketUrl")} /></div>
                  <div className="admin-field"><label className="form-label">Descripción <em>Opcional</em></label><textarea rows={7} className="form-control admin-writing-area" placeholder="Información útil sobre el evento…" {...register("description")} /></div>
                </section>
              </div>

              <aside className="admin-editor-sidebar">
                <section className="admin-action-card"><span className="admin-action-card__status">{effectiveEditMode ? "Evento existente" : "Nuevo evento"}</span><h2>{effectiveEditMode ? "Guardar cambios" : "Crear evento"}</h2><p>Comprueba especialmente la fecha, la ciudad y el enlace de entradas.</p><div className="admin-action-checks"><span><i>01</i> Artista y fecha</span><span><i>02</i> Recinto y ubicación</span><span><i>03</i> Cartel</span><span><i>04</i> Entradas e información</span></div><button type="submit" className="btn admin-primary-action" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : effectiveEditMode ? "Actualizar evento" : "Guardar evento"}</button></section>
                {effectiveEditMode && <section className="admin-danger-card"><h3>Zona sensible</h3><p>El evento desaparecerá del calendario.</p><button type="button" className="btn btn-danger" onClick={handleDelete}>Eliminar evento</button></section>}
              </aside>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
