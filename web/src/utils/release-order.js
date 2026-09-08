export function releaseDate(release) {
  const raw = release.release_date || release.date || release.releaseDate || release.year;
  if (!raw) return null;
  const date = new Date(typeof raw === "number" ? `${raw}-01-01` : raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function sortReleases(releases, order = "newest") {
  return [...releases].sort((a, b) => {
    const da = releaseDate(a);
    const db = releaseDate(b);
    if (!da || !db) return da ? -1 : db ? 1 : 0;
    return (order === "oldest" ? da - db : db - da) ||
      (a.catalog || "").localeCompare(b.catalog || "", "es", { numeric: true }) ||
      (a.title || "").localeCompare(b.title || "", "es");
  });
}
