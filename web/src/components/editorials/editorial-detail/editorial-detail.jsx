import EditorialShare from "../editorial-share";
import EditorialPlayer from "../editorial-player";
import React, { useEffect, useState } from "react";
import { editorialEmbed } from "../../../utils/editorial-embed";
import DOMPurify from "dompurify";
import { Link } from "react-router-dom";
import "../../../index.css";

function getBlockImage(block) {
  return block.image || (block.url ? block : null);
}

function EditorialPhoto({ image, className }) {
  if (!image?.url) return null;
  return (
    <figure className={className}>
      <img loading="lazy" decoding="async" width={image.width} height={image.height} src={image.url} alt={image.alt || ""} />
      {(image.caption || image.credit) && (
        <figcaption>
          {image.caption && <span>{image.caption}</span>}
          {image.credit && <small>{image.credit}</small>}
        </figcaption>
      )}
    </figure>
  );
}

export default function EditorialDetail({ editorial, prevNext }) {
  const [heroFailed, setHeroFailed] = useState(false);

  useEffect(() => {
    setHeroFailed(false);
  }, [editorial?.hero?.url]);

  if (!editorial) return null;

  const publishedAt = editorial.publishAt || editorial.createdAt;
  const created = publishedAt
    ? new Date(publishedAt).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;
  const author = editorial.credits?.filter((credit) => /autor|author/i.test(credit.role)).map((credit) => credit.name).filter(Boolean).join(", ") || editorial.author?.name;
  const artistNames = new Set(editorial.relatedArtists?.map((artist) => artist.name?.toLowerCase()));
  const tags = editorial.tags?.filter((tag) => !artistNames.has(tag.toLowerCase()));
  const hasMeta = created || editorial.readingTime || editorial.wordCount;

  return (
    <article className="editorial-detail">
      <header
        className={`editorial-detail__masthead ${editorial.hero?.url && !heroFailed ? "has-image" : ""}`}
      >
        {editorial.hero?.url && !heroFailed && (
          <img
            src={editorial.hero.url}
            alt={editorial.hero.alt || editorial.title}
            className="editorial-detail__hero-image"
            onError={() => setHeroFailed(true)}
          />
        )}
        <div className="editorial-detail__veil" aria-hidden="true" />
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
          {author && <p className="editorial-detail__byline">Texto de {author}</p>}
          {hasMeta && (
            <dl>
              {created && <div><dt>Publicado</dt><dd>{created}</dd></div>}
              {editorial.readingTime > 0 && <div><dt>Lectura</dt><dd>{editorial.readingTime} min</dd></div>}
              {editorial.wordCount > 0 && <div><dt>Extensión</dt><dd>{editorial.wordCount} palabras</dd></div>}
            </dl>
          )}
          {tags?.length > 0 && (
            <ul className="editorial-detail__tags" aria-label="Etiquetas">
              {tags.map((tag) => <li key={tag}>{tag}</li>)}
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
            if (block.type === "paragraph") {
              const cleanHtml = DOMPurify.sanitize(block.text || "", { USE_PROFILES: { html: true } });
              return <div key={key} className="editorial-body__rich-text" dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
            }
            if (block.type === "image") {
              return <EditorialPhoto key={key} className="editorial-body__media" image={getBlockImage(block)} />;
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
                    <EditorialPhoto key={`${image.url}-${imageIndex}`} image={image} />
                  ))}
                </div>
              );
            }
            if (block.type === "embed" && block.embed) {
              const media = editorialEmbed(block.embed);
              if (media?.src) {
                return (
                  <div key={key} className="editorial-body__embed">
                    <EditorialPlayer media={media} />
                  </div>
                );
              }
              return media?.href && (
                <p key={key} className="editorial-body__external">
                  <a href={media.href} target="_blank" rel="noreferrer">Ver contenido externo ↗</a>
                </p>
              );
            }
            return null;
          })}
          <EditorialShare key={editorial.slug} slug={editorial.slug} title={editorial.title} />
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
