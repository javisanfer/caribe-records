import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as CaribeRecordsAPI from "../../services/api-services";
import { useAuthContext } from "../../contexts/use-auth-context";

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm();
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleLogin = async (credentials) => {
    setServerError("");
    try {
      const user = await CaribeRecordsAPI.login(credentials);
      login(user);
      const destination = location.state?.from?.pathname || "/admin";
      navigate(destination, { replace: true });
    } catch (error) {
      if (error.response?.status === 401) {
        const apiErrors = error.response.data?.errors;
        if (apiErrors) {
          Object.entries(apiErrors).forEach(([field, message]) => {
            setError(field, { message });
          });
        } else {
          setServerError("El correo o la contraseña no son correctos.");
        }
      } else {

        setServerError("No se ha podido iniciar sesión. Inténtalo de nuevo.");
      }
    }
  };

  return (
    <div className="login-shell">
      <section className="login-manifesto" aria-labelledby="login-title">
        <h1 id="login-title">Acceso</h1>
      </section>

      <section className="login-panel" aria-label="Inicio de sesión">
        <header>
          <Link to="/">Volver a la web ↗</Link>
        </header>

        <div className="login-panel__body">

          <form className="login-form" onSubmit={handleSubmit(handleLogin)} noValidate>
            {serverError && <p className="login-form__alert" role="alert">{serverError}</p>}

            <div className="login-field">
              <div className="login-field__label">
                <label htmlFor="email">Correo electrónico</label>
              </div>
              <input
                type="email"
                id="email"
                autoComplete="email"
                placeholder="nombre@cariberecords.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email", {
                  required: "Escribe tu correo electrónico.",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "El formato del correo no es válido.",
                  },
                })}
              />
              {errors.email && <p id="email-error" className="login-field__error">{errors.email.message}</p>}
            </div>

            <div className="login-field">
              <div className="login-field__label">
                <label htmlFor="password">Contraseña</label>
              </div>
              <div className="login-password">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password", {
                    required: "Escribe tu contraseña.",
                    minLength: {
                      value: 6,
                      message: "La contraseña debe tener al menos 6 caracteres.",
                    },
                  })}
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)}>
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {errors.password && <p id="password-error" className="login-field__error">{errors.password.message}</p>}
            </div>

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              <span>{isSubmitting ? "Comprobando…" : "Entrar al panel"}</span>
              <span aria-hidden="true">→</span>
            </button>
            <Link className="login-recovery-link" to="/admin/recuperar">¿No recuerdas la contraseña? →</Link>
          </form>
        </div>

      </section>
    </div>
  );
}
