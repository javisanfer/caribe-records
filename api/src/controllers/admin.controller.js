const Artist = require("../models/artist.model");
const Release = require("../models/release.model");
const Event = require("../models/event.model");
const Editorial = require("../models/editorial.model");
const Banner = require("../models/banner.model");

const ACTIVITY_SOURCES = [
  { type: "artist", model: Artist, titleField: "name" },
  { type: "release", model: Release, titleField: "title" },
  { type: "event", model: Event, titleField: "title" },
  { type: "editorial", model: Editorial, titleField: "title" },
  { type: "banner", model: Banner, titleField: "title" },
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

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const projection = ({ type, titleField }) => ({ $project: {
      type: { $literal: type }, id: { $toString: "$_id" }, _id: 0,
      slug: { $ifNull: ["$slug", null] }, title: { $ifNull: [`$${titleField}`, "Sin título"] },
      createdAt: 1, updatedAt: { $ifNull: ["$updatedAt", "$createdAt"] },
    } });
    const [first, ...rest] = sources;
    const [result] = await first.model.aggregate([
      projection(first),
      ...rest.map((source) => ({ $unionWith: { coll: source.model.collection.name, pipeline: [projection(source)] } })),
      { $facet: {
        data: [{ $sort: { updatedAt: -1, id: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }],
        counts: [{ $group: { _id: "$type", count: { $sum: 1 } } }],
      } },
    ]);
    const counts = Object.fromEntries(result.counts.map((group) => [group._id, group.count]));
    const total = result.counts.reduce((sum, group) => sum + group.count, 0);
    return res.json({ data: result.data, total, counts });
  } catch (error) {
    console.error("Error fetching admin activity:", error);
    return res.status(500).json({ message: "Error fetching admin activity" });
  }
};
