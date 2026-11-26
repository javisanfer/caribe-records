// Read numeric dimensions only. React constructs the player and its permissions.
function pixelSize(tag, name) {
  const attr = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"(\\d+)"|'(\\d+)'|(\\d+)(?=[\\s>]))`, "i"));
  const size = Number(attr?.[1] || attr?.[2] || attr?.[3]);
  return size > 0 && size <= 4096 ? size : undefined;
}
export function editorialEmbed(value) {
  const input = value?.trim();
  if (!input) return null;
  const iframe = /^<iframe\b/i.test(input);
  const src = iframe ? input.match(/\s+src\s*=\s*(["'])(.*?)\1/i)?.[2]?.replace(/&amp;/g, "&") : input;
  let url;
  try { url = new URL(src); } catch { return null; }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (["archive.org", "www.archive.org"].includes(url.hostname) && ["embed", "details"].includes(parts[0])
    && parts.length === 2 && /^[a-zA-Z0-9_.-]+$/.test(parts[1])) {
    const player = new URL("/embed/" + parts[1], "https://archive.org");
    player.search = url.search;
    const tag = iframe ? input.split(">", 1)[0] + ">" : "";
    return { src: player.href, provider: "Internet Archive", width: pixelSize(tag, "width"), height: pixelSize(tag, "height") };
  }
  const short = url.hostname === "youtu.be";
  if (short || ["youtube.com", "www.youtube.com", "m.youtube.com", "www.youtube-nocookie.com"].includes(url.hostname)) {
    const id = short ? parts[0] : parts[0] === "watch" ? url.searchParams.get("v")
      : ["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : "";
    const list = url.searchParams.get("list");
    const playlist = list && /^[\w-]+$/.test(list);
    if ((id && /^[\w-]{11}$/.test(id)) || playlist) {
      const player = new URL("https://www.youtube-nocookie.com/embed/" + (id && /^[\w-]{11}$/.test(id) ? id : "videoseries"));
      if (playlist) player.searchParams.set("list", list);
      const time = url.searchParams.get("start") || url.searchParams.get("t");
      if (time && /^\d+s?$/.test(time)) player.searchParams.set("start", parseInt(time, 10));
      return { src: player.href, provider: "YouTube" };
    }
  }
  if (url.hostname === "open.spotify.com") {
    const path = parts.filter((part) => part !== "embed" && !/^intl-[a-z]+$/i.test(part));
    if (path.length === 2 && ["album", "track", "playlist", "artist", "show", "episode"].includes(path[0]) && /^[a-zA-Z0-9]+$/.test(path[1])) {
      return { src: "https://open.spotify.com/embed/" + path.join("/"), provider: "Spotify", height: 152 };
    }
  }
  return iframe ? null : { href: url.href };
}
