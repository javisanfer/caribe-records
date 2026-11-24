import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function ActivateAdminPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (password.length < 12 || password !== confirmation) {
      setError("Usa al menos 12 caracteres y confirma la misma contraseña.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/v1/users/complete-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: params.get("email"), token: params.get("token"), password }),
      });
      if (!response.ok) throw new Error("El enlace ha caducado o no es válido.");
      window.history.replaceState({}, "", "/admin/activar");
      setDone(true);
      setPassword("");
      setConfirmation("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-activation">
      <p className="detail-section-label">Caribe Records / Administración</p>
      <h1>Activa tu cuenta</h1>
      {done ? (
        <p>Tu contraseña ya está lista. <Link to="/admin/login">Iniciar sesión →</Link></p>
      ) : (
        <form onSubmit={submit}>
          <p>{params.get("email") || "El enlace no contiene un correo."}</p>
          <label htmlFor="admin-password">Nueva contraseña</label>
          <input id="admin-password" type="password" minLength="12" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <label htmlFor="admin-confirmation">Repite la contraseña</label>
          <input id="admin-confirmation" type="password" minLength="12" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={saving || !params.get("token")}>{saving ? "Activando…" : "Crear contraseña"}</button>
        </form>
      )}
    </main>
  );
}
