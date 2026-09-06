import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="cr-site-footer">
      <section className="cr-site-footer__about" aria-labelledby="footer-about-title">
        <div className="cr-site-footer__label">
          <span aria-hidden="true" />
          <p>Sobre Caribe</p>
          <small>Vallecas · Madrid</small>
        </div>
        <div className="cr-site-footer__statement">
          <h2 id="footer-about-title">Música con contexto.<br />Discos con recorrido.</h2>
          <p>Caribe Records es un sello independiente desde Vallecas. Publicamos música, acompañamos artistas y contamos las historias que crecen alrededor de cada lanzamiento.</p>
        </div>
      </section>

      <div className="cr-site-footer__bar">
        <Link to="/" className="cr-site-footer__brand">Caribe Records <sup>CR</sup></Link>
        <nav aria-label="Navegación del pie">
          <Link to="/artistas">Artistas</Link>
          <Link to="/releases">Discografía</Link>
          <Link to="/editoriales">Editorial</Link>
          <Link to="/eventos">Eventos</Link>
        </nav>
        <div className="cr-site-footer__contact">
          <a href="mailto:hola@caribe-records.com">Escríbenos ↗</a>
          <a href="https://cariberecords.bigcartel.com/" target="_blank" rel="noreferrer">Tienda ↗</a>
        </div>
      </div>

      <div className="cr-site-footer__legal">
        <span>© {new Date().getFullYear()} Caribe Records</span>
        <span>Sello independiente · Madrid</span>
      </div>
    </footer>
  );
}
