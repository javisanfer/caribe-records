import { readFileSync } from "node:fs";
const sections = JSON.parse(readFileSync(new URL("../src/data/sections.json", import.meta.url)));
const escape = (text) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function publicPages(siteOrigin) {
  const origin = new URL(siteOrigin).origin;
  return {
    name: "caribe-public-pages",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const index = bundle["index.html"];
      const template = String(index.source);
      const entry = Object.values(bundle).find((item) => item.type === "chunk" && item.isEntry && item.facadeModuleId?.endsWith("index.html"));
      if (!entry) throw new Error("Falta el punto de entrada de Vite");
      const styles = [...(entry.viteMetadata?.importedCss || [])];
      if (!styles.length) throw new Error("Faltan los estilos de la web");
      this.emitFile({ type: "asset", fileName: "page-entry.js", source: `import "/${entry.fileName}";\n` });
      this.emitFile({ type: "asset", fileName: "page-entry.css", source: styles.map((file) => `@import url("/${file}");`).join("\n") });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n` });
      for (const [path, [label, summary, socialSummary = summary]] of Object.entries(sections)) {
        const title = escape(path === "/" ? label : label + " · Caribe Records");
        const url = escape(origin + path);
        let html = template.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
          .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(summary)}" />`)
          .replace("</head>", `<link rel="canonical" href="${url}" />
    <meta property="og:title" content="${title}" /><meta property="og:description" content="${escape(socialSummary)}" />
    <meta property="og:type" content="website" /><meta property="og:url" content="${url}" />
    <meta property="og:image" content="${escape(origin)}/favicon.png" /></head>`);
        if (path === "/") {
          const schema = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: label,
            url: origin + "/",
            publisher: {
              "@type": "Organization",
              name: label,
              url: origin + "/",
              logo: origin + "/favicon.png",
            },
          }).replaceAll("<", "\\u003c");
          const links = Object.entries(sections)
            .filter(([route]) => route !== "/")
            .map(([route, [name]]) => `<a href="${escape(route)}">${escape(name)}</a>`)
            .join(" · ");
          html = html.replace("</head>", `<link rel="preload" as="fetch" href="/api/v1/home-carousel" crossorigin="anonymous"><script id="site-schema" type="application/ld+json">${schema}</script></head>`)
            .replace('<div id="root"></div>', `<div id="root"><noscript><main><h1>${title}</h1><p>${escape(summary)}</p><nav aria-label="Secciones">${links}</nav></main></noscript></div>`);
          index.source = html;
        } else this.emitFile({ type: "asset", fileName: path.slice(1) + ".html", source: html });
      }
    },
  };
}
