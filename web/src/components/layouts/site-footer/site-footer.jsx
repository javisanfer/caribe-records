import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="cr-site-footer">
      <nav className="cr-site-footer__links" aria-label="Enlaces del pie">
        <a href="https://instagram.com/cariberecords" target="_blank" rel="noreferrer">
          Seguir <span aria-hidden="true">↗</span>
        </a>
        <Link to="/about">About</Link>
        <a href="mailto:hola@caribe-records.com">Contacto</a>
      </nav>
      <span className="cr-site-footer__copyright">© {new Date().getFullYear()} Caribe Records</span>
    </footer>
  );
}
