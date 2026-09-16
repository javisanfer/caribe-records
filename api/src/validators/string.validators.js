module.exports.isURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

module.exports.isSpotifyUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com" || url.username || url.password || url.port) return false;

    const parts = url.pathname.split("/").filter(Boolean);
    const offset = /^intl-[a-z]{2}$/i.test(parts[0] || "") ? 1 : 0;
    return ["album", "track"].includes(parts[offset]) &&
      /^[A-Za-z0-9]{22}$/.test(parts[offset + 1] || "") &&
      parts.length === offset + 2;
  } catch {
    return false;
  }
};
