import React, { useEffect, useState } from "react";
import defaults from "../data/about.json";
import sizes from "../data/about-images.json";
import AdminEditLink from "../components/admin/admin-edit-link";

export default function AboutPage() {
  const [content, setContent] = useState(defaults);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/about", { signal: controller.signal })
      .then((res) => res.ok ? res.json() : null)
      .then((result) => { if (result?.content && !controller.signal.aborted) setContent(result.content); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const { photographs, links } = content;
  return (
    <main className="about-page about-studio">
      <AdminEditLink to="/admin/about" label="la página About" />
      <header className="about-studio__intro">
        <div className="about-studio__meta">
          <span>Caribe Records / Est. Madrid</span>
          <span>Sello independiente · 2024</span>
        </div>
        <div className="about-studio__opening">
          <div>
            <p className="about-studio__eyebrow">Sobre nosotros</p>
            <h1>{content.heading.split("\n").map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}<span className="about-studio__period">.</span></h1>
          </div>
          <span className="about-studio__mark" aria-hidden="true" />
        </div>
        <div className="about-studio__statement">
          <span className="about-studio__index">01 / El sello</span>
          <div>
            {content.statement.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        </div>
      </header>

      <section className="about-studio__archive" aria-labelledby="about-archive-title">
        <div className="about-studio__section-heading">
          <div>
            <span className="about-studio__index">02 / Registro</span>
            <h2 id="about-archive-title">Archivo</h2>
          </div>
          <span>Fotografías · {String(photographs.length).padStart(2, "0")}</span>
        </div>
        <div className="about-studio__gallery">
          {photographs.map(({ url, alt }, index) => (
            <figure key={index} className={index % 4 === 1 || index % 4 === 2 ? "about-studio__photo--small" : "about-studio__photo--large"}>
              <picture>{sizes[url] && <source media="(max-width: 767px)" type="image/webp" srcSet={sizes[url].mobile} />}<img width={sizes[url]?.width} height={sizes[url]?.height} src={url} alt={alt} loading={index < 2 ? "eager" : "lazy"} decoding="async" /></picture>
              <figcaption>{String(index + 1).padStart(2, "0")} / {String(photographs.length).padStart(2, "0")}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="about-studio__connect" aria-labelledby="about-connect-title">
        <div className="about-studio__section-heading">
          <div>
            <span className="about-studio__index">03 / Conecta</span>
            <h2 id="about-connect-title">Seguimos en contacto.</h2>
          </div>
          <span>Madrid, España</span>
        </div>
        <div className="about-studio__links">
          {links.map(({ label, detail, href }, index) => (
            <a key={index} href={href} {...(href.startsWith("https:") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <span className="about-studio__link-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="about-studio__link-label">{label}</span>
              <span className="about-studio__link-detail">{detail}</span>
              <span className="about-studio__link-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
