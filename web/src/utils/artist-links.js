const platforms = {
  social: { instagram: "Instagram", youtube: "YouTube", x: "Twitter", facebook: "Facebook" },
  streaming: { spotify: "Spotify", appleMusic: "Apple Music", amazonMusic: "Amazon Music", youtubeMusic: "YouTube Music", deezer: "Deezer", tidal: "Tidal", bandcamp: "Bandcamp" },
  web: { officialStore: "Official Store", website: "Website", pressKit: "Press Kit" },
};

export function artistLinks(artist) {
  return [
    ...Object.entries(platforms).flatMap(([group, labels]) =>
      Object.entries(artist[group] || {}).filter(([, url]) => typeof url === "string" && url).map(([key, url]) => ({
        group, label: labels[key] || key, url,
      }))
    ),
    ...(artist.links || []),
  ];
}

export function serializeLinks(rows) {
  const result = { web: {}, streaming: {}, social: {}, links: [] };
  for (const row of rows) {
    const group = row.group;
    const label = row.label.trim();
    const url = row.url.trim();
    const key = Object.keys(platforms[group]).find((name) =>
      platforms[group][name].toLowerCase() === label.toLowerCase() || name.toLowerCase() === label.toLowerCase()
    );
    if (key && !result[group][key]) result[group][key] = url;
    else result.links.push({ group, label, url });
  }
  return result;
}
