import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import runner from "../../assets/brand/caribe-runner.png";

export default function SiteLoader({ delay = 2000 }) {
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return createPortal(
    <div className="site-loader" role="status" aria-label="Cargando Caribe Records">
      <div className="site-loader__mark" aria-hidden="true">
        <span className="site-loader__symbol" style={{ maskImage: `url(${runner})` }} />
      </div>
      <span className="visually-hidden">Cargando Caribe Records…</span>
    </div>,
    document.body
  );
}
