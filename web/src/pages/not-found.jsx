import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="not-found-page">
      <p className="not-found-page__code">404</p>
      <h1>Esta página no existe.</h1>
      <p>Puede que el enlace haya cambiado o que el contenido ya no esté disponible.</p>
      <Link to="/">Volver al inicio <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
