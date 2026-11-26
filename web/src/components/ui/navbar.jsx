import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/use-auth-context";
import whiteLogo from "../../assets/brand/caribe-logotipo-white.png";

const navigation = [
  { to: "/artistas", label: "Artistas", index: "01" },
  { to: "/releases", label: "Catálogo", index: "02" },
  { to: "/editoriales", label: "Editorial", index: "03" },
  { to: "/eventos", label: "Eventos", index: "04" },
];

export default function Navbar() {
  const { user, logout } = useAuthContext();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => setIsOpen(false), [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const desktop = window.matchMedia("(min-width: 900px)");
    const close = () => setIsOpen(false);
    const closeOutside = (event) => {
      if (!navRef.current.contains(event.target)) close();
    };
    const escape = (event) => {
      if (event.key !== "Escape") return;
      close();
      toggleRef.current.focus();
    };
    desktop.addEventListener("change", close);
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", escape);
    return () => {
      desktop.removeEventListener("change", close);
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      document.removeEventListener("keydown", escape);
    };
  }, [isOpen]);

  return (
    <header className="cr-header">
      <nav ref={navRef} className="cr-navbar" aria-label="Navegación principal">
        <Link to="/" className="cr-brand" aria-label="Caribe Records, inicio">
          <img src={whiteLogo} alt="" className="cr-brand-mark" />
        </Link>
        <button
          type="button"
          ref={toggleRef}
          className="cr-menu-toggle"
          aria-expanded={isOpen}
          aria-controls="cr-menu-panel"
          onClick={() => setIsOpen((value) => !value)}
        >
          <span className="cr-menu-icon" aria-hidden="true"><i /><i /></span>
          {isOpen ? "Cerrar" : "Menú"}
        </button>
        <ol id="cr-menu-panel" className={`cr-mobile-links${isOpen ? " is-open" : ""}`}>
          {navigation.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} onClick={() => setIsOpen(false)}>
                {item.label}<span className="cr-menu-index" aria-hidden="true">{item.index}</span>
              </NavLink>
            </li>
          ))}
          <li className="cr-menu-shop">
            <a href="https://cariberecords.bigcartel.com/" target="_blank" rel="noreferrer" onClick={() => setIsOpen(false)}>
              Tienda ↗<span className="cr-menu-index" aria-hidden="true">05</span>
            </a>
          </li>
          {user?.role === "admin" && (
            <li><NavLink to="/admin" onClick={() => setIsOpen(false)}>Admin<span className="cr-menu-index" aria-hidden="true">06</span></NavLink></li>
          )}
        </ol>
        {user && location.pathname.startsWith("/admin") && (
          <button type="button" className="cr-logout" onClick={logout}>Cerrar sesión</button>
        )}
      </nav>
    </header>
  );
}
