import BannerImage from "./banner-image";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getActiveBanner } from "../../services/api-services";

export default function SiteBanner() {
  const [banner, setBanner] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    getActiveBanner()
      .then((data) => {
        if (!mounted || !data) return;
        const dismissalKey = `caribe-banner-${data._id}-${data.updatedAt}`;
        try {
          if (window.sessionStorage.getItem(dismissalKey)) return;
        } catch { /* Storage may be unavailable in private browsing. */ }
        setBanner({ ...data, dismissalKey });
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useLayoutEffect(() => {
    if (!banner) return;
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, [banner]);

  if (!banner) return null;

  const close = () => {
    try { window.sessionStorage.setItem(banner.dismissalKey, "closed"); }
    catch { /* Dismiss the dialog for this visit even when storage is blocked. */ }
    setBanner(null);
  };

  return (
    <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); close(); }} className={`site-banner${banner.imageUrl ? " site-banner--with-image" : ""}`} aria-label="Anuncio especial">
      <div className="site-banner__chrome">
        <span>Anuncio</span>
        <button className="site-banner__close" type="button" onClick={close} aria-label="Cerrar anuncio" />
      </div>
      {banner.imageUrl && (
        <div className="site-banner__media">
          <BannerImage key={banner.imageUrl} src={banner.imageUrl} />
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
    </dialog>
  );
}
