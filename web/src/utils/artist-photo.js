// Bandcamp retired this particular portrait URL. Keep edited and new URLs intact.
export function artistPhotoUrl(url) {
  return url === "https://f4.bcbits.com/img/0046774737_10.jpg"
    ? "/images/artist-updates/rego-bandcamp.jpg"
    : url;
}
