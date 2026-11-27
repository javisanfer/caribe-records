// Las imágenes de public/ y las subidas locales tienen rutas relativas al dominio.
export const imageUrlInput = {
  type: "text",
  inputMode: "url",
  pattern: String.raw`(?:https?://[^\/\s]+(?:/.*)?|/(?![\/\\]).+)`,
  title: "Introduce una URL http(s) o una ruta de imagen que empiece por /",
};
