import React from "react";

const photographs = [
  ["475520.JPG", "Público en una sala de conciertos, en blanco y negro"],
  ["141414_003.JPG", "Díptico de una guitarra y una cámara en el local"],
  ["475519.JPG", "Retrato de grupo con un disco en el pasillo de una sala"],
  ["141413_018.JPG", "Músicos sobre el escenario bajo luces azules"],
  ["141413_009.JPG", "Pegatinas de sellos y bandas en una pared"],
  ["475518.JPG", "Tres personas compartiendo la cabina de DJ"],
  ["133672_003.jpg", "Sesión de grabación de Aeronave Adolescente"],
  ["141414_014.JPG", "Díptico de un encuentro frente a una ferretería"],
  ["101_4529.JPG", "Los Reels tocando en Maravillas"],
  ["IMG_9609.JPG", "Concierto entre las estanterías de una tienda de discos"],
  ["IMG_9617.JPG", "Guitarristas en un concierto"],
  ["IMG_9596.JPG", "Actuación con teclado y micrófono"],
  ["IMG_9643.JPG", "Un concierto visto desde el público"],
];

const links = [
  { number: "01", label: "Escríbenos", detail: "hola@caribe-records.com", href: "mailto:hola@caribe-records.com" },
  { number: "02", label: "Instagram", detail: "@cariberecords", href: "https://www.instagram.com/cariberecords/" },
  { number: "03", label: "X", detail: "@caribe_records", href: "https://x.com/caribe_records" },
];

export default function AboutPage() {
  return (
    <main className="about-page about-studio">
      <header className="about-studio__intro">
        <div className="about-studio__meta">
          <span>Caribe Records / Est. Madrid</span>
          <span>Sello independiente · 2024</span>
        </div>
        <div className="about-studio__opening">
          <div>
            <p className="about-studio__eyebrow">Sobre nosotros</p>
            <h1>Música popular<br />independiente<span className="about-studio__period">.</span></h1>
          </div>
          <span className="about-studio__mark" aria-hidden="true" />
        </div>
        <div className="about-studio__statement">
          <span className="about-studio__index">01 / El sello</span>
          <div>
            <p>Somos un sello discográfico nacido en la periferia de Madrid.</p>
            <p>Nos atraen los proyectos con una voz propia y todo lo que puede crecer alrededor de su música. Trabajamos cerca de cada artista y dejamos espacio para explorar.</p>
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
          {photographs.map(([name, alt], index) => (
            <figure key={name} className={index % 4 === 1 || index % 4 === 2 ? "about-studio__photo--small" : "about-studio__photo--large"}>
              <img src={`/images/about/${name}`} alt={alt} loading={index < 2 ? "eager" : "lazy"} decoding="async" />
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
          {links.map(({ number, label, detail, href }) => (
            <a key={number} href={href} {...(href.startsWith("https:") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <span className="about-studio__link-number">{number}</span>
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
