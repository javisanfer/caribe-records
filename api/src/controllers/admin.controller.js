const Artist = require("../models/artist.model");
const Release = require("../models/release.model");
const Event = require("../models/event.model");
const Editorial = require("../models/editorial.model");

const ACTIVITY_SOURCES = [
  { type: "artist", model: Artist, titleField: "name", select: "name slug createdAt updatedAt" },
  { type: "release", model: Release, titleField: "title", select: "title createdAt updatedAt" },
  { type: "event", model: Event, titleField: "title", select: "title slug createdAt updatedAt" },
  { type: "editorial", model: Editorial, titleField: "title", select: "title slug createdAt updatedAt" },
];

exports.getActivity = async (req, res) => {
  try {
    const requestedType = req.query.type;
    const sources = requestedType
      ? ACTIVITY_SOURCES.filter((source) => source.type === requestedType)
      : ACTIVITY_SOURCES;

    if (!sources.length) {
      return res.status(400).json({ message: "Unknown activity type" });
    }

    const requestedLimit = Number.parseInt(req.query.limit || "100", 10);
    const limit = Math.min(500, Math.max(1, Number.isNaN(requestedLimit) ? 100 : requestedLimit));

    const groups = await Promise.all(sources.map(async (source) => {
      const documents = await source.model
        .find()
        .select(source.select)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      return documents.map((document) => ({
        type: source.type,
        id: document._id.toString(),
        slug: document.slug || null,
        title: document[source.titleField] || "Sin título",
        createdAt: document.createdAt || null,
        updatedAt: document.updatedAt || document.createdAt || null,
      }));
    }));

    const data = groups
      .flat()
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      .slice(0, limit);

    return res.json({ data, total: data.length });
  } catch (error) {
    console.error("Error fetching admin activity:", error);
    return res.status(500).json({ message: "Error fetching admin activity" });
  }
};
