export function isListenUrl(value) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value.trim())) return false;
  try {
    const url = new URL(value);
    return Boolean(url.hostname && !url.username && !url.password);
  } catch {
    return false;
  }
}

export function releaseListenUrl(release) {
  // An explicitly cleared link stays empty even when older platform fields exist.
  const candidates = release.listenUrl != null
    ? [release.listenUrl]
    : [release.bandcampUrl, release.spotifyUrl, release.appleMusicUrl];
  return candidates.find(isListenUrl)?.trim() || "";
}
