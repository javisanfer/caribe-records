import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/auth-context";
import whiteLogo from "../../assets/brand/caribe-logotipo-white.png";

const navigation = [
  { to: "/artistas", label: "Artistas", index: "01" },
  { to: "/releases", label: "Discografía", index: "02" },
  { to: "/editoriales", label: "Editorial", index: "03" },
  { to: "/eventos", label: "Eventos", index: "04" },
];

export default function Navbar() {
  const { user } = useAuthContext();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const isAdminSection = location.pathname.startsWith("/admin");

  useEffect(() => setIsOpen(false), [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", isOpen);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const focusable = menuRef.current?.querySelectorAll("a[href], button:not([disabled])");
    focusable?.[0]?.focus();
    const trapFocus = (event) => {
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, [isOpen]);

  return (
    <header className="cr-header">
      <nav className="cr-navbar" aria-label="Navegación principal">
        <Link to="/" className="cr-brand" aria-label="Caribe Records, inicio">
          <img src={whiteLogo} alt="" className="cr-brand-mark" />
        </Link>

        <ul className="cr-nav" aria-label="Secciones">
          {navigation.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => `cr-link${isActive ? " cr-link-active" : ""}`}>
                <span className="cr-link-index">{item.index}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="cr-navbar-actions">
          <a className="cr-shop-link" href="https://cariberecords.bigcartel.com/" target="_blank" rel="noreferrer">
            Tienda <span aria-hidden="true">↗</span>
          </a>
          {user && !isAdminSection && <Link to="/admin" className="cr-admin-link">Admin</Link>}
          <button
            type="button"
            ref={toggleRef}
            className="cr-menu-toggle"
            aria-expanded={isOpen}
            aria-controls="cr-mobile-menu"
            onClick={() => setIsOpen((value) => !value)}
          >
            <span>{isOpen ? "Cerrar" : "Menú"}</span>
            <span className="cr-menu-icon" aria-hidden="true"><i /><i /></span>
          </button>
        </div>
      </nav>

      <div
        id="cr-mobile-menu"
        ref={menuRef}
        className={`cr-mobile-menu${isOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
        aria-hidden={!isOpen}
      >
        <div className="cr-mobile-menu-inner">
          <p className="cr-menu-kicker">Sello independiente · Vallecas, Madrid</p>
          <ol className="cr-mobile-links">
            {navigation.map((item) => (
              <li key={item.to}>
                <span>{item.index}</span>
                <NavLink to={item.to} tabIndex={isOpen ? 0 : -1}>{item.label}</NavLink>
              </li>
            ))}
            <li>
              <span>05</span>
              <a href="https://cariberecords.bigcartel.com/" target="_blank" rel="noreferrer" tabIndex={isOpen ? 0 : -1}>Tienda ↗</a>
            </li>
          </ol>
          <div className="cr-menu-footer">
            <a href="mailto:hola@caribe-records.com" tabIndex={isOpen ? 0 : -1}>hola@caribe-records.com</a>
            <span>Caribe Records © {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
