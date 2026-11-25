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
      for (const [path, [label, summary]] of Object.entries(sections)) {
        const title = escape(path === "/" ? label : label + " · Caribe Records");
        const url = escape(origin + path);
        const html = template.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
          .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(summary)}" />`)
          .replace("</head>", `<link rel="canonical" href="${url}" />
    <meta property="og:title" content="${title}" /><meta property="og:description" content="${escape(summary)}" />
    <meta property="og:type" content="website" /><meta property="og:url" content="${url}" />
    <meta property="og:image" content="${escape(origin)}/favicon.png" /></head>`);
        if (path === "/") index.source = html;
        else this.emitFile({ type: "asset", fileName: path.slice(1) + ".html", source: html });
      }
    },
  };
}
