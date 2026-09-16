import React from "react";

export default function PublicIndexPage({
  title,
  count,
  countLabel = "entradas",
  tone = "paper",
  className = "",
  children,
}) {
  const titleId = `public-index-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <main
      className={`public-index public-index--${tone} ${className}`.trim()}
      aria-labelledby={titleId}
    >
      <header className="public-index__hero">
        <h1 id={titleId} className="public-index__title">{title}</h1>
        <div className="public-index__intro">
          <p className="public-index__count" aria-label={`${count ?? 0} ${countLabel}`}>
            <strong>{count == null ? "—" : String(count).padStart(2, "0")}</strong>
            <span>{countLabel}</span>
          </p>
        </div>
      </header>

      <section className="public-index__content">{children}</section>
    </main>
  );
}
