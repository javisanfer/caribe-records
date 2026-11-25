import { useEffect } from "react";
import sections from "../data/sections.json";

export function usePageMeta(path, name, description, image, type = "website") {
  useEffect(() => {
    const origin = new URL(import.meta.env.VITE_SITE_ORIGIN || "https://caribe-records.com").origin;
    const privatePage = path.startsWith("/admin") || path === "/login";
    const section = sections[path];
    const title = name || section?.[0] || (privatePage ? "Administración" : "Caribe Records");
    const fullTitle = title === "Caribe Records" ? title : title + " · Caribe Records";
    const text = description || section?.[1] || sections["/"][1];
    const canonical = new URL(path, origin).href;
    const set = (attribute, key, value) => {
      let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!node) {
        node = document.createElement("meta");
        node.setAttribute(attribute, key);
        document.head.append(node);
      }
      node.content = value;
    };
    document.title = fullTitle;
    set("name", "description", text);
    set("name", "robots", privatePage ? "noindex,nofollow" : "index,follow");
    set("property", "og:title", fullTitle);
    set("property", "og:description", text);
    set("property", "og:type", type);
    set("property", "og:url", canonical);
    let cover;
    try { cover = new URL(image || "/favicon.png", origin); } catch { cover = new URL("/favicon.png", origin); }
    set("property", "og:image", /^https?:$/.test(cover.protocol) ? cover.href : origin + "/favicon.png");
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.append(link); }
    link.href = canonical;
  }, [path, name, description, image, type]);
}
