import React, { useEffect, useState } from "react";
import { getActiveBanner } from "../../services/api-services";

export default function SiteBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let mounted = true;
    getActiveBanner()
      .then((data) => {
        if (!mounted || !data) return;
        const dismissalKey = `caribe-banner-${data._id}-${data.updatedAt}`;
        if (!window.sessionStorage.getItem(dismissalKey)) setBanner({ ...data, dismissalKey });
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  if (!banner) return null;

  const close = () => {
    window.sessionStorage.setItem(banner.dismissalKey, "closed");
    setBanner(null);
  };

  return (
    <div className="site-banner-backdrop">
      <aside className={`site-banner${banner.imageUrl ? " site-banner--with-image" : ""}`} role="dialog" aria-modal="true" aria-label="Anuncio especial">
        <div className="site-banner__chrome">
          <span>Caribe Records / Anuncio</span>
          <button className="site-banner__close" type="button" onClick={close} aria-label="Cerrar anuncio">×</button>
        </div>
        {banner.imageUrl && (
          <div className="site-banner__media">
            <img src={banner.imageUrl} alt="" />
          </div>
        )}
        <div className="site-banner__body">
          <strong>{banner.title}</strong>
          {banner.message && <p>{banner.message}</p>}
          {banner.linkUrl && (
            <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer">
              {banner.linkLabel || "Más información"} ↗
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}
