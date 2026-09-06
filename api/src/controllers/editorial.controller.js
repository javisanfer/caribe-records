const Editorial = require("../models/editorial.model");
const Artist = require("../models/artist.model"); // 👈 NUEVO

// -------------------- Utilidad de paginación --------------------
function getPagination(query) {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || "12", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

const slugify = require("slugify");
const generateSlug = (title) =>
  slugify(title, { lower: true, strict: true, trim: true });

// 👇 Helper para normalizar IDs de artistas desde el body
function normalizeIdArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === "string") {
    // admite "id", "id1,id2,id3"
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeEditorialBlocks(value) {
  if (!value) return [];
  let blocks = value;
  if (typeof value === "string") {
    try {
      blocks = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(blocks)) return [];

  return blocks.slice(0, 200).flatMap((block) => {
    if (!block || typeof block !== "object") return [];
    if (block.type === "paragraph" && typeof block.text === "string") {
      return [{ type: "paragraph", text: block.text }];
    }
    if (block.type === "quote" && typeof block.quote === "string") {
      return [{ type: "quote", quote: block.quote, cite: typeof block.cite === "string" ? block.cite : "" }];
    }
    if (block.type === "image" && block.image && typeof block.image.url === "string") {
      return [{ type: "image", image: {
        url: block.image.url,
        alt: typeof block.image.alt === "string" ? block.image.alt : "",
        caption: typeof block.image.caption === "string" ? block.image.caption : "",
        credit: typeof block.image.credit === "string" ? block.image.credit : "",
      } }];
    }
    if (block.type === "separator") return [{ type: "separator" }];
    return [];
  });
}

/* ======================================================
   PÚBLICO
====================================================== */

// GET /api/editorials
exports.getEditorialsPublic = async (req, res) => {
  try {
    const { tag, q } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    const now = new Date();

    const visibility = {
      $or: [
        { status: "published" },
        { status: "scheduled", publishAt: { $lte: now } },
      ],
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
        .select("-blocks")
        .lean(),
    ]);

    res.json({
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching editorials",
      error: error.message,
    });
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
        { status: "scheduled", publishAt: { $lte: now } },
      ],
    });

    if (!doc) return res.status(404).json({ message: "Editorial not found" });

    res.json(doc);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching editorial",
      error: error.message,
    });
  }
};

/* ======================================================
   ADMIN
====================================================== */

// GET /api/admin/editorials
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
        .select(
          "title slug status publishAt featured section series createdAt updatedAt"
        )
        .lean(),
    ]);

    res.json({
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching admin editorials",
      error: error.message,
    });
  }
};

// GET /api/admin/editorials/:slug
exports.getEditorialBySlugAdmin = async (req, res) => {
  try {
    const doc = await Editorial.findOne({ slug: req.params.slug });

    if (!doc) return res.status(404).json({ message: "Editorial not found" });

    res.json(doc);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching editorial",
      error: error.message,
    });
  }
};

/* ======================================================
   CREATE
====================================================== */

// POST /api/admin/editorials
exports.createEditorial = async (req, res) => {
  try {
    const body = req.body;
    const payload = {};

    if (!body.title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Title + slug
    payload.title = body.title;
    payload.slug = body.slug || generateSlug(body.title);

    payload.subtitle = body.subtitle || "";

    payload.status = body.status || "draft";
    if (body.publishAt) payload.publishAt = body.publishAt;

    // author opcional
    if (req.user?.sub) payload.author = req.user.sub;

    // HERO -------------------------
    payload.hero = {};

    if (req.file) {
      payload.hero.url = req.file.path;
    } else if (body.heroUrl) {
      payload.hero.url = body.heroUrl;
    } else {
      return res.status(400).json({ message: "Hero image is required" });
    }

    payload.hero.alt = body.heroAlt || "";
    payload.hero.caption = body.heroCaption || "";
    payload.hero.credit = body.heroCredit || "";

    // BODY → blocks
    payload.blocks = normalizeEditorialBlocks(body.blocks);
    if (!payload.blocks.length && body.body) {
      payload.blocks.push({
        type: "paragraph",
        text: body.body,
      });
    }

    if (body.embedHtml) {
      payload.blocks.push({
        type: "embed",
        embed: body.embedHtml,
      });
    }

    // Excerpt
    if (body.excerpt) payload.excerpt = body.excerpt;

    // Tags
    payload.tags =
      typeof body.tags === "string"
        ? body.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    // SEO
    if (body.seoTitle || body.seoDescription || body.seoOgImage) {
      payload.seo = {
        title: body.seoTitle || undefined,
        description: body.seoDescription || undefined,
        ogImage: body.seoOgImage || payload.hero.url,
      };
    }

    // Extra
    payload.featured =
      body.featured === "true" ||
      body.featured === "on" ||
      body.featured === true;

    if (body.section) payload.section = body.section;
    if (body.series) payload.series = body.series;

    // 👇 NUEVO: artistas relacionados
    const relatedArtistsIds = normalizeIdArray(body.relatedArtists);
    if (relatedArtistsIds.length) {
      payload.relatedArtists = relatedArtistsIds;
    }

    const editorial = new Editorial(payload);
    await editorial.save();

    // 👇 NUEVO: añadimos la editorial al array editorials de cada artista
    if (relatedArtistsIds.length) {
      await Artist.updateMany(
        { _id: { $in: relatedArtistsIds } },
        { $addToSet: { editorials: editorial._id } }
      );
    }

    res.status(201).json(editorial);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Duplicate slug", error: error.keyValue });
    }

    res.status(400).json({
      message: "Error creating editorial",
      error: error.message,
    });
  }
};

/* ======================================================
   UPDATE + DELETE (por SLUG)
====================================================== */

// PATCH /api/admin/editorials/:slug
exports.updateEditorial = async (req, res) => {
  try {
    const slug = req.params.slug;

    const editorial = await Editorial.findOne({ slug });
    if (!editorial) {
      return res.status(404).json({ message: "Editorial not found" });
    }

    const body = req.body;

    // Guardamos los artistas anteriores para sincronizar
    const prevArtists = (editorial.relatedArtists || []).map((id) => id.toString());

    // Si cambia el título → regenerar slug
    if (body.title && !body.slug) {
      editorial.slug = generateSlug(body.title);
    } else if (body.slug) {
      editorial.slug = body.slug;
    }

    // Campos básicos
    editorial.title = body.title ?? editorial.title;
    editorial.subtitle = body.subtitle ?? editorial.subtitle;
    editorial.status = body.status ?? editorial.status;
    editorial.publishAt = body.publishAt ?? editorial.publishAt;

    // Hero
    if (req.file) {
      editorial.hero.url = req.file.path;
    } else if (body.heroUrl) {
      editorial.hero.url = body.heroUrl;
    }
    editorial.hero.alt = body.heroAlt ?? editorial.hero.alt;
    editorial.hero.caption = body.heroCaption ?? editorial.hero.caption;
    editorial.hero.credit = body.heroCredit ?? editorial.hero.credit;

    // Blocks — reseteamos y regeneramos
    editorial.blocks = body.blocks !== undefined
      ? normalizeEditorialBlocks(body.blocks)
      : body.body
        ? [{ type: "paragraph", text: body.body }]
        : [];
    if (body.embedHtml) {
      editorial.blocks.push({ type: "embed", embed: body.embedHtml });
    }

    // Excerpt
    editorial.excerpt = body.excerpt ?? editorial.excerpt;

    // Tags
    if (typeof body.tags === "string") {
      editorial.tags = body.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    // SEO
    editorial.seo = {
      title: body.seoTitle ?? editorial.seo?.title,
      description: body.seoDescription ?? editorial.seo?.description,
      ogImage: body.seoOgImage ?? editorial.seo?.ogImage,
    };

    // Otros
    editorial.featured =
      body.featured === "true" ||
      body.featured === "on" ||
      body.featured === true;

    editorial.section = body.section ?? editorial.section;
    editorial.series = body.series ?? editorial.series;

    // 👇 NUEVO: actualizar artistas relacionados
    let newArtists = prevArtists;
    if (body.relatedArtists !== undefined) {
      newArtists = normalizeIdArray(body.relatedArtists);
      editorial.relatedArtists = newArtists;
    }

    await editorial.save();

    // Sincronizar relación en Artist.editorials
    const prevSet = new Set(prevArtists);
    const newSet = new Set(newArtists);

    const toAdd = newArtists.filter((id) => !prevSet.has(id));
    const toRemove = prevArtists.filter((id) => !newSet.has(id));

    if (toAdd.length) {
      await Artist.updateMany(
        { _id: { $in: toAdd } },
        { $addToSet: { editorials: editorial._id } }
      );
    }

    if (toRemove.length) {
      await Artist.updateMany(
        { _id: { $in: toRemove } },
        { $pull: { editorials: editorial._id } }
      );
    }

    res.json(editorial);
  } catch (error) {
    res.status(400).json({
      message: "Error updating editorial",
      error: error.message,
    });
  }
};

// DELETE /api/admin/editorials/:slug
exports.deleteEditorial = async (req, res) => {
  try {
    const deleted = await Editorial.findOneAndDelete({
      slug: req.params.slug,
    });

    if (!deleted) return res.status(404).json({ message: "Editorial not found" });

    // 👇 NUEVO: limpiar referencia en Artist.editorials
    await Artist.updateMany(
      { editorials: deleted._id },
      { $pull: { editorials: deleted._id } }
    );

    res.json({ message: "Editorial deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting editorial",
      error: error.message,
    });
  }
};
