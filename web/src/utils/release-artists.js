export function releaseArtists(release) {
  return [release.artist, ...(release.collaborators || [])].filter(Boolean);
}

export function releaseArtistCredit(release) {
  return release.artistName?.trim() || releaseArtists(release)
    .map((artist) => artist.name || (typeof artist === "string" ? artist : ""))
    .filter(Boolean).join(" + ");
}
