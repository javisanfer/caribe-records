const portraits = {
  "aeronave-adolescente": "/images/artist-updates/AA_002.jpg",
  "ferrocentro-club": "/images/artist-updates/PHOTO-2026-11-02-15-24-58.jpg",
};

export function withCurrentArtistPhoto(artist) {
  if (import.meta.env?.PROD) return artist;
  const photo = portraits[artist?.slug];
  if (!photo) return artist;
  return {
    ...artist,
    photos: { ...artist.photos, portraitUrl: photo, coverUrl: photo },
  };
}
