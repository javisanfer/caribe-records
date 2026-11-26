import DOMPurify from "dompurify";

export function cleanBiography(html) {
  return DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "hr", "code", "pre"],
    ALLOWED_ATTR: [],
  });
}

export function biographyForEditor(artist) {
  if (artist.bioHtml) return cleanBiography(artist.bioHtml);
  return (artist.bio || "").split(/\r?\n\s*\r?\n/).map((paragraph) => {
    const text = paragraph.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    return "<p>" + text.replace(/\r?\n/g, "<br>") + "</p>";
  }).join("");
}
