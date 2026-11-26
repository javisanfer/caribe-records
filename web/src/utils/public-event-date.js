const calendar = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
});

// Remove a year from this set when its concert archive is ready to publish.
const unpublishedArchives = new Set(["2025", "2026"]);

export const madridDate = (date) => calendar.format(date);

export function isPublicEventDate(value, today = madridDate(new Date())) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const day = madridDate(date);
  return day >= today || !unpublishedArchives.has(day.slice(0, 4));
}
