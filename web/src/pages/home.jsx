import React from "react";
import { Link } from "react-router-dom";
import logoIsotipo from "../assets/CARIBE_ISOTIPO_B.png"

export default function HomePage() {
  return (
    <div className="home">
      
      {/* HEADER */}
      <header className="home-header">
        <Link to="/" className="home-logo">
          CARIBE RECORDS
        </Link>
      </header>

      {/* MAIN */}
      <main className="home-main">
        <div className="home-graphic">
          <svg className="home-burst" viewBox="0 0 200 200">
            <path
              d="M96 6l15 40 32-28-4 42 39-10-23 34 39 11-37 19 27 28-41-3 9 40-33-24-13 38-15-37-32 26 6-40-40 7 24-31-37-16 37-14-25-30 39 5-8-39 30 26z"
              fill="#FFD94A"
            />
          </svg>
        </div>

        <nav className="home-menu">
          <Link to="/artistas" className="home-menu-item">Artistas</Link>
          <Link to="/releases" className="home-menu-item">Discografía</Link>

          {/* ⭐ Nuevo: Editoriales */}
          <Link to="/editoriales" className="home-menu-item">Editoriales</Link>

          <Link to="/eventos" className="home-menu-item">Eventos</Link>

          {/* ⭐ Nuevo: Tienda externa */}
          <a
            href="https://cariberecords.bigcartel.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="home-menu-item"
          >
            Tienda
          </a>
        </nav>
      </main>
      {/* FOOTER */}
      <footer className="site-footer">
        <div className="site-footer-left">
          <img
            src={logoIsotipo}
            alt="Caribe Records"
            className="site-footer-mark"
           />
          <a href="mailto:hola@caribe-records.com">
            hola@caribe-records.com
          </a>
          <span>Vallecas, Madrid</span>
        </div>

        <div className="site-footer-right">
          <Link to="/sobre-nosotros">
            Sobre nosotros
          </Link>
        </div>
      </footer>
    </div>
  );
}