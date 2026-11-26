const { imageUrlFor } = require("../config/storage.config");
const Editorial = require("../models/editorial.model");
const Artist = require("../models/artist.model");
const Release = require("../models/release.model");
const { isObjectIdOrHexString } = require("mongoose");

// -------------------- Utilidad de paginación --------------------
const { getPagination } = require("../utils/pagination");

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

const associationError = "Selecciona lanzamientos del catálogo de los artistas asociados.";

async function validAssociations(artists, releases) {
  if (!artists.every(isObjectIdOrHexString) || !releases.every(isObjectIdOrHexString)) return false;
  if (!releases.length) return true;
  if (!artists.length) return false;
  const count = await Release.countDocuments({ _id: { $in: releases }, $or: [{ artist: { $in: artists } }, { collaborators: { $in: artists } }] });
  return count === new Set(releases).size;
}

function sameIds(a, b) {
  const ids = new Set(a);
  return ids.size === new Set(b).size && b.every((id) => ids.has(id));
}

function normalizeEditorialBlocks(value) {
  if (value === undefined || value === "") return [];
  const blocks = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(blocks)) throw new Error("Los bloques deben ser una lista");
  // The nested Mongoose schemas validate types and keep only supported fields.
  return blocks;
}

function editorialCredits(value) {
  const credits = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(credits)) throw new Error("Los créditos deben ser una lista");
  return credits;
}

function validatePublishableEditorial({ status, publishAt, hero, blocks }) {
  if (status === "draft") return null;
  if (!hero?.url) return "Hero image is required before publishing";
  if (!blocks?.length) return "Content is required before publishing";
  if (status === "scheduled" && !publishAt) return "Publish date is required when scheduling";
  return null;
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
    if (req.query.featured === "true") filter.featured = true;
    if (req.query.artist) filter.relatedArtists = req.query.artist;
    if (tag) filter.tags = tag;
    if (q) filter.$text = { $search: q };

    const [total, items] = await Promise.all([
      Editorial.countDocuments(filter),
      Editorial.find(filter)
        .sort({ publishAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-blocks")
        .populate("author", "name")
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
    throw error;
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
    }).populate("author", "name").populate("relatedArtists", "name slug");

    if (!doc) return res.status(404).json({ message: "Editorial not found" });

    res.json(doc);
  } catch (error) {
    throw error;
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
    throw error;
  }
};

// GET /api/admin/editorials/:slug
exports.getEditorialBySlugAdmin = async (req, res) => {
  try {
    const doc = await Editorial.findOne({ slug: req.params.slug });

    if (!doc) return res.status(404).json({ message: "Editorial not found" });

    res.json(doc);
  } catch (error) {
    throw error;
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
    if (req.user?._id) payload.author = req.user._id;
    if (body.credits !== undefined) payload.credits = editorialCredits(body.credits);
    if (body.relatedReleases !== undefined) payload.relatedReleases = normalizeIdArray(body.relatedReleases);

    // HERO -------------------------
    payload.hero = {};

    if (req.file) {
      payload.hero.url = imageUrlFor(req.file);
    } else if (body.heroUrl) {
      payload.hero.url = body.heroUrl;
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

    const publishError = validatePublishableEditorial(payload);
    if (publishError) return res.status(400).json({ message: publishError });

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
    if (!await validAssociations(relatedArtistsIds, payload.relatedReleases || [])) {
      return res.status(400).json({ message: associationError });
    }
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
        .json({ message: "Duplicate slug", fields: Object.keys(error.keyValue || {}) });
    }

    res.status(400).json({
      message: "Error creating editorial",
      fields: Object.keys(error.errors || {}),
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
    if (body.credits !== undefined) editorial.credits = editorialCredits(body.credits);
    const prevReleases = (editorial.relatedReleases || []).map(String);
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
    if (!editorial.hero && (req.file || body.heroUrl || body.heroAlt || body.heroCaption || body.heroCredit)) {
      editorial.hero = {};
    }
    if (req.file) {
      editorial.hero.url = imageUrlFor(req.file);
    } else if (editorial.hero && body.heroUrl !== undefined) {
      editorial.hero.url = body.heroUrl;
    }
    if (editorial.hero) {
      editorial.hero.alt = body.heroAlt ?? editorial.hero.alt;
      editorial.hero.caption = body.heroCaption ?? editorial.hero.caption;
      editorial.hero.credit = body.heroCredit ?? editorial.hero.credit;
    }

    // Blocks — reseteamos y regeneramos
    editorial.blocks = body.blocks !== undefined
      ? normalizeEditorialBlocks(body.blocks)
      : body.body
        ? [{ type: "paragraph", text: body.body }]
        : editorial.blocks;
    if (body.embedHtml) {
      editorial.blocks.push({ type: "embed", embed: body.embedHtml });
    }

    const publishError = validatePublishableEditorial(editorial);
    if (publishError) return res.status(400).json({ message: publishError });

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
    if (body.featured !== undefined) editorial.featured =
      body.featured === "true" ||
      body.featured === "on" ||
      body.featured === true;

    editorial.section = body.section ?? editorial.section;
    editorial.series = body.series ?? editorial.series;

    // 👇 NUEVO: actualizar artistas relacionados
    const newArtists = body.relatedArtists === undefined ? prevArtists : normalizeIdArray(body.relatedArtists);
    const newReleases = body.relatedReleases === undefined ? prevReleases : normalizeIdArray(body.relatedReleases);
    const changed = !sameIds(prevArtists, newArtists) || !sameIds(prevReleases, newReleases);
    if (changed && !await validAssociations(newArtists, newReleases)) {
      return res.status(400).json({ message: associationError });
    }
    if (body.relatedArtists !== undefined) editorial.relatedArtists = newArtists;
    if (body.relatedReleases !== undefined) editorial.relatedReleases = newReleases;

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
      fields: Object.keys(error.errors || {}),
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
    throw error;
  }
};
