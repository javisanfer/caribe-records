const madridCalendar = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
});

// The 2025 and 2026 archives are still being edited. Today and future dates stay public.
function publicEvents(now = new Date()) {
  const localDay = { $dateToString: { date: "$date", timezone: "Europe/Madrid", format: "%Y-%m-%d" } };
  return {
    isActive: true,
    $or: [
      { date: { $lt: new Date("2025-01-01T00:00:00+01:00") } },
      { date: { $gte: new Date("2027-01-01T00:00:00+01:00") } },
      { $expr: { $gte: [localDay, madridCalendar.format(now)] } },
    ],
  };
}

module.exports = { publicEvents };
