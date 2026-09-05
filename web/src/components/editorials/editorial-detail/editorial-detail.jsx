import React from "react";
import { Link } from "react-router-dom";
import "../../../index.css";

function getBlockImage(block) {
  return block.image || (block.url ? block : null);
}

export default function EditorialDetail({ editorial, prevNext }) {
  if (!editorial) return null;

  const publishedAt = editorial.publishAt || editorial.createdAt;
  const created = publishedAt
    ? new Date(publishedAt).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;
  const section = editorial.section || editorial.series || "Editorial";
  const hasMeta = created || editorial.readingTime || editorial.wordCount;

  return (
    <article className="editorial-detail">
      <header
        className={`editorial-detail__masthead ${editorial.hero?.url ? "has-image" : ""}`}
      >
        {editorial.hero?.url && (
          <img
            src={editorial.hero.url}
            alt={editorial.hero.alt || editorial.title}
            className="editorial-detail__hero-image"
          />
        )}
        <div className="editorial-detail__veil" aria-hidden="true" />
        <div className="editorial-detail__masthead-top">
          <span>{section}</span>
          <span>CR / ED</span>
        </div>
        <div className="editorial-detail__headline">
          <h1>{editorial.title}</h1>
          {editorial.subtitle && <p>{editorial.subtitle}</p>}
        </div>
        <a className="editorial-detail__read" href="#leer">
          Leer artículo <span aria-hidden="true">↓</span>
        </a>
      </header>

      <div className="editorial-detail__layout" id="leer">
        <aside className="editorial-detail__meta" aria-label="Datos del artículo">
          <p className="editorial-detail__eyebrow">{section}</p>
          {hasMeta && (
            <dl>
              {created && <div><dt>Publicado</dt><dd>{created}</dd></div>}
              {editorial.readingTime > 0 && <div><dt>Lectura</dt><dd>{editorial.readingTime} min</dd></div>}
              {editorial.wordCount > 0 && <div><dt>Extensión</dt><dd>{editorial.wordCount} palabras</dd></div>}
            </dl>
          )}
          {editorial.tags?.length > 0 && (
            <ul className="editorial-detail__tags" aria-label="Etiquetas">
              {editorial.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          )}
        </aside>

        <section className="editorial-body">
          {editorial.excerpt && <p className="editorial-body__lead">{editorial.excerpt}</p>}
          {editorial.blocks?.map((block, index) => {
            const key = `${block.type}-${index}`;

            if (block.type === "heading") {
              const Heading = block.level === 3 ? "h3" : "h2";
              return <Heading key={key}>{block.text}</Heading>;
            }
            if (block.type === "paragraph") return <p key={key}>{block.text}</p>;
            if (block.type === "image") {
              const image = getBlockImage(block);
              if (!image?.url) return null;
              return (
                <figure key={key} className="editorial-body__media">
                  <img src={image.url} alt={image.alt || ""} />
                  {(image.caption || image.credit) && (
                    <figcaption>
                      {image.caption}{image.caption && image.credit ? " · " : ""}{image.credit}
                    </figcaption>
                  )}
                </figure>
              );
            }
            if (block.type === "quote") {
              return (
                <blockquote key={key}>
                  <p>{block.quote || block.text}</p>
                  {block.cite && <cite>{block.cite}</cite>}
                </blockquote>
              );
            }
            if (block.type === "separator") return <hr key={key} />;
            if (block.type === "gallery" && block.gallery?.length) {
              return (
                <div key={key} className="editorial-body__gallery">
                  {block.gallery.map((image, imageIndex) => (
                    <figure key={`${image.url}-${imageIndex}`}>
                      <img src={image.url} alt={image.alt || ""} />
                      {(image.caption || image.credit) && <figcaption>{image.caption || image.credit}</figcaption>}
                    </figure>
                  ))}
                </div>
              );
            }
            if (block.type === "embed" && block.embed) {
              return (
                <p key={key} className="editorial-body__external">
                  <a href={block.embed} target="_blank" rel="noreferrer">Ver contenido externo ↗</a>
                </p>
              );
            }
            return null;
          })}
        </section>
      </div>

      {(prevNext?.prev || prevNext?.next) && (
        <nav className="detail-pagination" aria-label="Más artículos">
          {prevNext.prev ? (
            <Link to={`/editorial/${prevNext.prev.slug}`}><small>Anterior</small><span>← {prevNext.prev.title}</span></Link>
          ) : <span />}
          {prevNext.next ? (
            <Link to={`/editorial/${prevNext.next.slug}`}><small>Siguiente</small><span>{prevNext.next.title} →</span></Link>
          ) : <span />}
        </nav>
      )}
    </article>
  );
}
