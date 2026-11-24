import React, { useEffect, useState } from "react";

export default function SiteLoader({ delay = 1200, fullPage = false }) {
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`site-loader${fullPage ? " site-loader--page" : ""}`} aria-busy="true">
      <span className="site-loader__status" role="status">
        {visible && <><span className="site-loader__line" aria-hidden="true" />Cargando…</>}
      </span>
    </div>
  );
}
