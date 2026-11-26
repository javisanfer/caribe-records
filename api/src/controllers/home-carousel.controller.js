const mongoose = require("mongoose");
const { z } = require("zod");
const Editorial = require("../models/editorial.model");

const maximum = 5;
const Carousel = mongoose.model("HomeCarousel", new mongoose.Schema({
  _id: String, version: Number, entries: [{ type: mongoose.Schema.Types.ObjectId, ref: "Editorial" }],
}, { versionKey: false }));
const input = z.object({
  version: z.number().int().nonnegative(),
  entries: z.array(z.string().regex(/^[a-f0-9]{24}$/)).max(maximum).refine((ids) => ids.length === new Set(ids).size),
});
const visible = () => ({ $or: [{ status: "published" }, { status: "scheduled", publishAt: { $lte: new Date() } }] });
const eligible = { status: { $in: ["published", "scheduled"] } };
const fields = "title slug hero status publishAt";
const recent = { publishAt: -1, createdAt: -1, _id: -1 };

async function currentEntries(config) {
  if (config) return config.entries.map(String);
  const legacy = await Editorial.find({ ...visible(), featured: true }).sort(recent).limit(maximum).select("_id").lean();
  return legacy.map((item) => String(item._id));
}

exports.publicList = async (_req, res) => {
  const config = await Carousel.findById("home").lean();
  if (!config) return res.json(await Editorial.find({ ...visible(), featured: true }).sort(recent).limit(maximum).select(fields).lean());
  const docs = await Editorial.find({ ...visible(), _id: { $in: config.entries } }).select(fields).lean();
  const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
  res.json(config.entries.map((id) => byId.get(String(id))).filter(Boolean));
};

exports.adminList = async (_req, res) => {
  const [config, options] = await Promise.all([
    Carousel.findById("home").lean(),
    Editorial.find(eligible).sort(recent).select("title status").lean(),
  ]);
  const ids = new Set(options.map((item) => String(item._id)));
  const entries = (await currentEntries(config)).filter((id) => ids.has(id));
  res.json({ version: config?.version || 0, maximum, entries, options });
};

exports.update = async (req, res) => {
  const result = input.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "Selecciona hasta cinco editoriales distintas." });
  const { version, entries } = result.data;
  if (await Editorial.countDocuments({ ...eligible, _id: { $in: entries } }) !== entries.length) {
    return res.status(400).json({ message: "Una de las editoriales ya no está publicada ni programada. Recarga la selección." });
  }
  try {
    const config = await Carousel.findOneAndUpdate({ _id: "home", version },
      { $set: { entries }, $inc: { version: 1 } }, { upsert: version === 0, new: true }).lean();
    if (config) return res.json({ version: config.version, entries: config.entries });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  res.status(409).json({ message: "Otra persona ha actualizado el carrusel. Recarga antes de guardar." });
};
