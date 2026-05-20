// src/components/ui/navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/auth-context";

export default function Navbar() {
  const { user } = useAuthContext();
  const location = useLocation();

  const isAdminSection = location.pathname.startsWith("/admin");

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      setIsCollapsed(y > 120); // a partir de ~120px de scroll, colapsa
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const collapsedClass = isCollapsed && !isHovered ? "cr-header--collapsed" : "";

  return (
    <header
      className={`cr-header ${collapsedClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Línea azul fina siempre visible */}
      <div className="cr-header-bar" />

      {/* Nav que se esconde/muestra */}
      <nav className="cr-navbar d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-dark bg-black text-white">
        {/* Left: Logo */}
        <Link to="/" className="cr-logo text-white text-decoration-none">
          CARIBE RECORDS
        </Link>

        {/* Center: main nav */}
        <ul className="cr-nav d-flex gap-3 m-0 list-unstyled">
          <li>
            <NavLink
              to="/artistas"
              className={({ isActive }) =>
                isActive ? "cr-link cr-link-active" : "cr-link"
              }
            >
              ARTISTS
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/releases"
              className={({ isActive }) =>
                isActive ? "cr-link cr-link-active" : "cr-link"
              }
            >
              RELEASES
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/editoriales"
              className={({ isActive }) =>
                isActive ? "cr-link cr-link-active" : "cr-link"
              }
            >
              EDITORIAL
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/eventos"
              className={({ isActive }) =>
                isActive ? "cr-link cr-link-active" : "cr-link"
              }
            >
              EVENTS
            </NavLink>
          </li>
        </ul>

        {/* Right: botón Admin solo logado y fuera de /admin */}
        <div className="d-flex align-items-center gap-2">
          {user && !isAdminSection && (
            <Link
              to="/admin"
              className="btn btn-sm btn-outline-light cr-admin-btn"
            >
              ADMIN DASHBOARD
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}