const artist = { name: "ferrocentro club", slug: "ferrocentro-club" };

export const curatedReleases = [
  {
    _id: "curated-ferrocentro-bola-curva",
    title: "bola curva",
    artist,
    artistName: artist.name,
    format: "single",
    release_date: "2026-10-16T12:00:00Z",
    cover: { url: "/images/artist-updates/IMG_0453.PNG", alt: "Portada de bola curva" },
    appleMusicUrl: "https://music.apple.com/us/album/bola-curva-single/6818077292",
    tracklist: [{ position: 1, title: "bola curva", duration: "2:01" }],
  },
  {
    _id: "curated-ferrocentro-voy-a-tener-suerte",
    title: "voy a tener suerte",
    artist,
    artistName: artist.name,
    format: "ep",
    release_date: "2026-11-20T12:00:00Z",
    cover: { url: "/images/artist-updates/ferrocentro%20club%20-%20voy%20a%20tener%20suerte.png", alt: "Portada de voy a tener suerte" },
    appleMusicUrl: "https://music.apple.com/us/album/voy-a-tener-suerte-ep/6828490603",
    tracklist: [
      { position: 1, title: "voy a tener suerte", duration: "2:50" },
      { position: 2, title: "tiramisú", duration: "2:51" },
      { position: 3, title: "decálogo de buenas prácticas", duration: "3:36" },
      { position: 4, title: "bola curva", duration: "2:01" },
      { position: 5, title: "solaris II", duration: "6:31" },
    ],
  },
];

const key = (release) => `${(release.artist?.slug || release.artistSlug || release.artistName || "").toLowerCase()}|${(release.title || "").toLowerCase()}`;

export function withCuratedReleases(releases = []) {
  const existing = new Set(releases.map(key));
  return [...releases, ...curatedReleases.filter((release) => !existing.has(key(release)))];
}
