import React from "react";
import { useForm } from "react-hook-form";
import * as CaribeRecordsAPI from "../../services/api-services";
import { useAuthContext } from "../../contexts/use-auth-context";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();
  const { login } = useAuthContext();
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    try {
      const user = await CaribeRecordsAPI.login(credentials);
      login(user);
      navigate("/");
    } catch (error) {
      if (error.response?.status === 401 && error.response.data?.errors) {
        const apiErrors = error.response.data.errors;
        Object.keys(apiErrors).forEach((field) =>
          setError(field, { message: apiErrors[field] })
        );
      } else {
        console.error(error);
      }
    }
  };

  return (
    <div className="min-vh-100 bg-secondary">
      <div className="container py-5 bg-secondary text-light">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm bg-dark border-0">
              <div className="card-header bg-dark text-light text-center py-3">
                <h4 className="mb-0">Hola!</h4>
              </div>
              <div className="card-body p-4 bg-dark">
                <form onSubmit={handleSubmit(handleLogin)}>
                  {/* EMAIL */}
                  <div className="mb-3">
                    <label
                      htmlFor="email"
                      className="form-label text-light fw-bold"
                    >
                      Email
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-secondary text-light border-0">
                        <i className="fa fa-user fa-fw" />
                      </span>
                      <input
                        type="email"
                        id="email"
                        placeholder="user@example.org"
                        className={`form-control bg-dark text-light border-secondary ${
                          errors.email ? "is-invalid" : ""
                        }`}
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value:
                              /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address",
                          },
                        })}
                      />
                      {errors.email && (
                        <div className="invalid-feedback">
                          {errors.email.message}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="form-label text-light fw-bold"
                    >
                      Contraseña
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-secondary text-light border-0">
                        <i className="fa fa-lock fa-fw" />
                      </span>
                      <input
                        type="password"
                        id="password"
                        placeholder="••••••••"
                        className={`form-control bg-dark text-light border-secondary ${
                          errors.password ? "is-invalid" : ""
                        }`}
                        {...register("password", {
                          required: "Password is required",
                          minLength: {
                            value: 6,
                            message:
                              "Password must be at least 6 characters",
                          },
                        })}
                      />
                      {errors.password && (
                        <div className="invalid-feedback">
                          {errors.password.message}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SUBMIT */}
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-outline-light btn-lg"
                      type="submit"
                    >
                      <i className="fa fa-sign-in-alt me-2" />
                      Inicia sesión
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
