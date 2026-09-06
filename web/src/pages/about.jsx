import React from "react";

export default function AboutPage() {
  return (
    <main className="about-page">
      <header className="about-page__intro">
        <p className="about-page__eyebrow">Caribe Records · Vallecas, Madrid</p>
        <h1>Música con contexto.<br />Discos con recorrido.</h1>
      </header>

      <section className="about-page__body" aria-label="Sobre Caribe Records">
        <span aria-hidden="true" />
        <p>
          Caribe Records es un sello independiente desde Vallecas. Publicamos música,
          acompañamos artistas y contamos las historias que crecen alrededor de cada
          lanzamiento.
        </p>
      </section>
    </main>
  );
}
