import React from "react";
import { Link } from "react-router-dom";
import "../../../index.css";

export default function EditorialDetail({ editorial, prevNext }) {
  if (!editorial) return null;

  // Fecha formateada
  const created = editorial.createdAt
    ? new Date(editorial.createdAt).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <article className="editorial-detail bg-white text-black">

      {/* HERO */}
      {editorial.hero?.url && (
        <section className="editorial-hero position-relative">
          <img
            src={editorial.hero.url}
            alt={editorial.hero.alt || editorial.title}
            className="w-100 object-fit-cover"
            style={{ maxHeight: "70vh" }}
          />

          <div className="editorial-hero-text position-absolute top-50 start-50 translate-middle text-center text-white px-3">
            <h1 className="display-5 fw-bold text-uppercase">
              {editorial.title}
            </h1>

            {editorial.subtitle && (
              <p className="small text-light mt-2">{editorial.subtitle}</p>
            )}
          </div>
        </section>
      )}

      {/* METADATOS */}
      <div className="text-center small text-muted mt-3">
        {created && <p className="mb-1">{created}</p>}

        {editorial.readingTime && (
          <p className="mb-1">{editorial.readingTime} min read</p>
        )}

        {editorial.hero?.caption && (
          <p className="text-muted fst-italic mt-2">{editorial.hero.caption}</p>
        )}
      </div>

      {/* CUERPO */}
      <section className="editorial-body container my-4">
        {editorial.blocks?.map((block, i) => {
          
          if (block.type === "paragraph") {
            return (
              <p key={i} className="mb-4 fs-5">
                {block.text}
              </p>
            );
          }

          if (block.type === "image") {
            return (
              <figure key={i} className="my-5 text-center">
                <img
                  src={block.url}
                  alt={block.alt || ""}
                  className="img-fluid rounded shadow-sm"
                />
                {block.caption && (
                  <figcaption className="text-muted small mt-2">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          if (block.type === "quote") {
            return (
              <blockquote
                key={i}
                className="fst-italic border-start border-3 ps-3 my-5 fs-5"
              >
                “{block.text}”
              </blockquote>
            );
          }

          return null;
        })}
      </section>

      {/* NAVEGACIÓN PREV / NEXT */}
      {(prevNext?.prev || prevNext?.next) && (
        <div className="editorial-footer-nav border-top border-light-subtle py-3 text-center">
          <div className="container d-flex justify-content-between">

            {/* PREV */}
            {prevNext.prev ? (
              <Link
                to={`/editorial/${prevNext.prev.slug}`}
                className="text-decoration-none text-dark fw-semibold"
              >
                ◀ {prevNext.prev.title}
              </Link>
            ) : (
              <span />
            )}

            {/* NEXT */}
            {prevNext.next ? (
              <Link
                to={`/editorial/${prevNext.next.slug}`}
                className="text-decoration-none text-dark fw-semibold"
              >
                {prevNext.next.title} ▶
              </Link>
            ) : (
              <span />
            )}

          </div>
        </div>
      )}
    </article>
  );
}