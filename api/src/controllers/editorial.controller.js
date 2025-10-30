const Editorial = require("../models/editorial.model");

// -------------------- Utilidad de paginación --------------------
function getPagination(query) {
  const page  = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || "12", 10)));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}

// ======================================================
// PÚBLICO
// ======================================================

// GET /api/editorials?tag=&q=&page=&limit=
exports.getEditorialsPublic = async (req, res) => {
  try {
    const { tag, q } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    const now = new Date();

    // Solo visibles: published o scheduled ya alcanzada
    const visibility = {
      $or: [
        { status: "published" },
        { status: "scheduled", publishAt: { $lte: now } }
      ]
    };

    const filter = { ...visibility };
    if (tag) filter.tags = tag;
    if (q) filter.$text = { $search: q };

    const [total, items] = await Promise.all([
      Editorial.countDocuments(filter),
      Editorial.find(filter)
        .sort({ publishAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-blocks") // listado ligero (sin cuerpo completo)
        .populate({ path: "relatedArtists", select: "name slug photos.portraitUrl" })
        .populate({ path: "relatedReleases", select: "title slug cover_image release_date" })
        .lean()
    ]);

    res.json({
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching editorials", error: error.message });
  }
};

// GET /api/editorials/slug/:slug
exports.getEditorialBySlugPublic = async (req, res) => {
  try {
    const now = new Date();
    const doc = await Editorial.findOne({
      slug: req.params.slug,
      $or: [
        { status: "published" },
        { status: "scheduled", publishAt: { $lte: now } }
      ]
    })
      .populate({ path: "relatedArtists", select: "name slug photos.portraitUrl" })
      .populate({ path: "relatedReleases", select: "title slug cover_image release_date" });

    if (!doc) return res.status(404).json({ message: "Editorial not found" });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Error fetching editorial", error: error.message });
  }
};

// ======================================================
// ADMIN
// ======================================================

// GET /api/admin/editorials?status=&tag=&q=&page=&limit=
exports.getEditorialsAdmin = async (req, res) => {
  try {
    const { status, tag, q } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = {};
    if (status) filter.status = status;
    if (tag) filter.tags = tag;
    if (q) filter.$text = { $search: q };

    const [total, items] = await Promise.all([
      Editorial.countDocuments(filter),
      Editorial.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("title slug status publishAt featured section series createdAt updatedAt")
        .lean()
    ]);

    res.json({
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin editorials", error: error.message });
  }
};

// GET /api/admin/editorials/:id
exports.getEditorialByIdAdmin = async (req, res) => {
  try {
    const doc = await Editorial.findById(req.params.id)
      .populate({ path: "relatedArtists", select: "name slug photos.portraitUrl" })
      .populate({ path: "relatedReleases", select: "title slug cover_image release_date" });

    if (!doc) return res.status(404).json({ message: "Editorial not found" });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Error fetching editorial", error: error.message });
  }
};

// POST /api/admin/editorials
exports.createEditorial = async (req, res) => {
  try {
    const payload = { ...req.body };

    // ✅ author es opcional
    if (req.user?.sub && !payload.author) payload.author = req.user.sub;

    // Limpieza de relaciones (evita CastError)
    if (!Array.isArray(payload.relatedArtists)) payload.relatedArtists = [];
    if (!Array.isArray(payload.relatedReleases)) payload.relatedReleases = [];

    const editorial = new Editorial(payload);
    await editorial.save();

    res.status(201).json(editorial);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate key (slug or unique field)",
        error: error.keyValue
      });
    }
    res.status(400).json({
      message: "Error creating editorial",
      error: error.message
    });
  }
};

// PATCH /api/admin/editorials/:id
exports.updateEditorial = async (req, res) => {
  try {
    const doc = await Editorial.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Editorial not found" });

    Object.assign(doc, req.body);
    await doc.save();

    const updated = await Editorial.findById(doc._id)
      .populate({ path: "relatedArtists", select: "name slug photos.portraitUrl" })
      .populate({ path: "relatedReleases", select: "title slug cover_image release_date" });

    res.json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate key (slug or unique field)",
        error: error.keyValue
      });
    }
    res.status(400).json({
      message: "Error updating editorial",
      error: error.message
    });
  }
};

// DELETE /api/admin/editorials/:id
exports.deleteEditorial = async (req, res) => {
  try {
    const deleted = await Editorial.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Editorial not found" });
    res.json({ message: "Editorial deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting editorial", error: error.message });
  }
};