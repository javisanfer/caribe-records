const Banner = require("../models/banner.model");

function payloadFrom(body) {
  return {
    title: body.title?.trim(),
    message: body.message?.trim() || "",
    imageUrl: body.imageUrl?.trim() || "",
    linkUrl: body.linkUrl?.trim() || "",
    linkLabel: body.linkLabel?.trim() || "Más información",
    active: body.active === true || body.active === "true" || body.active === "on",
    startAt: body.startAt || null,
    endAt: body.endAt || null,
  };
}

function validate(payload) {
  if (!payload.title) return "El título es obligatorio";
  if (payload.startAt && payload.endAt && new Date(payload.endAt) <= new Date(payload.startAt)) {
    return "La fecha de fin debe ser posterior a la de inicio";
  }
  if (payload.linkUrl && !/^https?:\/\//i.test(payload.linkUrl)) {
    return "El enlace debe comenzar por http:// o https://";
  }
  if (payload.imageUrl && !/^https?:\/\//i.test(payload.imageUrl)) {
    return "La imagen debe comenzar por http:// o https://";
  }
  return "";
}

exports.getActiveBanner = async (_req, res) => {
  const now = new Date();
  const banner = await Banner.findOne({
    active: true,
    $and: [
      { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
      { $or: [{ endAt: null }, { endAt: { $gt: now } }] },
    ],
  }).sort({ updatedAt: -1 }).lean();
  res.json(banner || null);
};

exports.listBanners = async (_req, res) => {
  const data = await Banner.find().sort({ updatedAt: -1 }).lean();
  res.json({ data, total: data.length });
};

exports.getBanner = async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(404).json({ message: "Banner no encontrado" });
  res.json(banner);
};

exports.createBanner = async (req, res) => {
  const payload = payloadFrom(req.body);
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });
  const banner = await Banner.create(payload);
  res.status(201).json(banner);
};

exports.updateBanner = async (req, res) => {
  const payload = payloadFrom(req.body);
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });
  const banner = await Banner.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!banner) return res.status(404).json({ message: "Banner no encontrado" });
  res.json(banner);
};

exports.deleteBanner = async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ message: "Banner no encontrado" });
  res.status(204).send();
};
