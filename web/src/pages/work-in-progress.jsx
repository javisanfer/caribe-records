import { useEffect } from "react";
import whiteLogo from "../assets/brand/caribe-logotipo-white.png";

export default function WorkInProgressPage() {
  useEffect(() => {
    const previousTitle = document.title;
    const existingRobots = document.querySelector('meta[name="robots"]');
    const previousRobots = existingRobots?.content;
    const robots = existingRobots || document.createElement("meta");

    document.title = "Caribe Records — Work in progress";
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    if (!existingRobots) document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;
      if (existingRobots) robots.content = previousRobots;
      else robots.remove();
    };
  }, []);

  return (
    <main className="wip-page">
      <header className="wip-header">
        <img src={whiteLogo} alt="Caribe Records" className="wip-logo" />
        <span>Madrid / 2026</span>
      </header>

      <section className="wip-content" aria-labelledby="wip-title">
        <p className="wip-kicker">Nueva web en proceso</p>
        <h1 id="wip-title">Estamos afinando.</h1>
        <p className="wip-copy">
          Muy pronto: música, artistas, historias y fechas desde Vallecas.
        </p>

        <div className="wip-progress" role="status" aria-label="Sitio web en construcción">
          <span className="wip-progress__line" aria-hidden="true" />
          <span>Work in progress</span>
        </div>
      </section>

      <footer className="wip-footer">
        <a href="mailto:hola@caribe-records.com">hola@caribe-records.com</a>
        <a href="https://instagram.com/cariberecords" target="_blank" rel="noreferrer">
          Instagram ↗
        </a>
      </footer>
    </main>
  );
}
