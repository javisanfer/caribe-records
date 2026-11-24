import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function RecoverAdminPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (token && (password.length < 12 || password !== confirmation)) {
      setError("Usa al menos 12 caracteres y confirma la misma contraseña.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(token ? "/api/v1/users/password-reset/complete" : "/api/v1/users/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(token ? { email, token, password } : { email }),
      });
      if (!response.ok) throw new Error(token ? "El enlace ha caducado o no es válido. Solicita otro." : "No se ha podido enviar el enlace. Inténtalo más tarde.");
      if (token) window.history.replaceState({}, "", "/admin/recuperar");
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
      <h1>Recuperar acceso</h1>
      {done ? (
        <p>{token ? "Contraseña actualizada. " : "Si ese correo tiene acceso al panel, recibirás un enlace válido durante 30 minutos. Revisa también la carpeta de spam. "}
          {token && <Link to="/admin/login">Iniciar sesión →</Link>}
        </p>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="recovery-email">Correo electrónico</label>
          <input id="recovery-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          {token && <>
            <label htmlFor="recovery-password">Nueva contraseña</label>
            <input id="recovery-password" type="password" minLength="12" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <label htmlFor="recovery-confirmation">Repite la contraseña</label>
            <input id="recovery-confirmation" type="password" minLength="12" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
          </>}
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={saving}>{saving ? "Enviando…" : token ? "Guardar contraseña" : "Enviar enlace"}</button>
          <Link to="/admin/login">Volver al acceso →</Link>
        </form>
      )}
    </main>
  );
}
