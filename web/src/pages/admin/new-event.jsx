// src/pages/admin/new-event.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { listArtists, adminCreateEvent } from "../../services/api-services";

const API_BASE = "/api/v1";

export default function NewEventPage({ isEditMode = false }) {
  const { slug } = useParams(); // /admin/edit-event/:slug
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const [artists, setArtists] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);

  const effectiveEditMode = isEditMode && !!slug;

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
          <p>04 / Evento</p>
          <h1>{titleLabel}</h1>
          <span>Fecha, lugar, artista y venta de entradas.</span>
        </div>

        {effectiveEditMode && loadingInitial ? (
          <p className="text-muted">Loading event…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="row g-3 admin-form">
            {/* Title */}
            <div className="col-12">
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

            {/* Artist */}
            <div className="col-12 col-md-6">
              <label className="form-label">Artista</label>
              <select
                className={`form-control bg-dark text-white border-secondary ${
                  errors.artistId ? "is-invalid" : ""
                }`}
                {...register("artistId", {
                  required: "Artist is required",
                })}
              >
                <option value="">Seleccionar artista…</option>
                {artists.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {errors.artistId && (
                <div className="invalid-feedback">
                  {errors.artistId.message}
                </div>
              )}
            </div>

            {/* Venue */}
            <div className="col-12 col-md-6">
              <label className="form-label">Sala</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                {...register("venue")}
              />
            </div>

            {/* City */}
            <div className="col-12 col-md-4">
              <label className="form-label">Ciudad</label>
              <input
                className={`form-control bg-dark text-white border-secondary ${
                  errors.city ? "is-invalid" : ""
                }`}
                {...register("city", { required: "City is required" })}
              />
              {errors.city && (
                <div className="invalid-feedback">{errors.city.message}</div>
              )}
            </div>

            {/* Country */}
            <div className="col-12 col-md-4">
              <label className="form-label">País</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="ES / FR / PT…"
                {...register("country")}
              />
            </div>

            {/* Date & time */}
            <div className="col-12 col-md-4">
              <label className="form-label">Fecha y hora</label>
              <input
                type="datetime-local"
                className={`form-control bg-dark text-white border-secondary ${
                  errors.datetime ? "is-invalid" : ""
                }`}
                {...register("datetime", {
                  required: "Datetime is required",
                })}
              />
              {errors.datetime && (
                <div className="invalid-feedback">
                  {errors.datetime.message}
                </div>
              )}
            </div>

            {/* Address */}
            <div className="col-12">
              <label className="form-label">Dirección</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="Street, number…"
                {...register("address")}
              />
            </div>

            {/* Ticket URL */}
            <div className="col-12">
              <label className="form-label">URL de entradas / evento</label>
              <input
                className="form-control bg-dark text-white border-secondary"
                placeholder="https://..."
                {...register("ticketUrl")}
              />
            </div>

            {/* Description */}
            <div className="col-12">
              <label className="form-label">Descripción</label>
              <textarea
                rows={4}
                className="form-control bg-dark text-white border-secondary"
                placeholder="Optional description of the event…"
                {...register("description")}
              />
            </div>

            {/* Botones */}
            <div className="col-12 mt-3 d-flex gap-2">
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
                  ? "Actualizar evento"
                  : "Guardar evento"}
              </button>

              {effectiveEditMode && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Eliminar evento
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
