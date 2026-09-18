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
      </header>

      <section className="wip-content" aria-labelledby="wip-title">
        <h1 id="wip-title">Estamos trabajando</h1>

        <div className="wip-progress" role="status" aria-label="Sitio web en construcción">
          <span className="wip-progress__line" aria-hidden="true" />
        </div>
      </section>

    </main>
  );
}
