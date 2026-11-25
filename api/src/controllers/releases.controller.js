const Release = require("../models/release.model");
const Artist  = require("../models/artist.model");
const mongoose = require("mongoose");
const Label = mongoose.models.Label || mongoose.model("Label", new mongoose.Schema({ name: String }));
const slugify = require("slugify");
const { isSpotifyUrl } = require("../validators/string.validators");

function artistObjectId(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/i.test(value)) throw new Error("Identificador de artista no válido");
  return new mongoose.Types.ObjectId(value);
}

function validateSpotifyUrl(value) {
  if (value === undefined || value === null || value === "") return;
  if (!isSpotifyUrl(value)) throw new Error("Spotify URL must be a valid album or track link");
}

/* ======================================================
   PUBLIC
====================================================== */

// GET /releases
exports.getReleases = async (req, res) => {
  try {
    const releases = await Release.find(req.path.startsWith("/admin/") ? {} : { catalogVisible: { $ne: false } })
      .populate("artist", "name slug")
      .populate({ path: "label", model: Label, select: "name" })
      .sort({ release_date: -1, createdAt: -1 })
      .lean();

    res.json(releases);
  } catch (error) {
    console.error("Error obteniendo releases:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /releases/:id  (solo compatibilidad pública)
exports.getReleaseById = async (req, res) => {
  try {
    const release = await Release.findById(req.params.id)
      .populate("artist", "name slug")
      .populate({ path: "label", model: Label, select: "name" });

    if (!release || (release.catalogVisible === false && !req.path.startsWith("/admin/"))) return res.status(404).json({ message: "Release not found" });

    res.json(release);
  } catch (error) {
    console.error("Error obteniendo release por ID:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ======================================================
   ADMIN — GET BY SLUG
====================================================== */

// GET /admin/releases/slug/:slug
exports.getReleaseBySlugAdmin = async (req, res) => {
  try {
    const release = await Release.findOne({ slug: req.params.slug })
      .populate("artist", "name slug")
      .populate({ path: "label", model: Label, select: "name" });

    if (!release) {
      return res.status(404).json({ message: "Release not found" });
    }

    res.json(release);
  } catch (error) {
    console.error("Error fetching release:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ======================================================
   CREATE RELEASE
====================================================== */

// POST /admin/releases
exports.createRelease = async (req, res) => {
  try {
    const { artistId, artist, ...rest } = req.body;
    validateSpotifyUrl(rest.spotifyUrl);

    const artistRef = artistId || artist || null;

    if (artistRef && !await Artist.exists({ _id: artistObjectId(artistRef) })) return res.status(400).json({ error: "Artista desconocido" });

    // Generamos slug si no viene
    let slug = rest.slug;
    if (!slug && rest.title) {
      slug = slugify(rest.title, { lower: true, strict: true, trim: true });
      rest.slug = slug;
    }

    const release = await Release.create({
      ...rest,
      artist: artistRef,
    });

    // Añadir a Artist.albums
    if (artistRef) {
      await Artist.findByIdAndUpdate(
        artistRef,
        { $addToSet: { albums: release._id } },
        { new: true }
      );
    }

    const populated = await Release.findById(release._id)
      .populate("artist", "name slug")
      .populate({ path: "label", model: Label, select: "name" });

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error creando release:", error);
    res.status(400).json({ error: error.message });
  }
};

/* ======================================================
   UPDATE RELEASE BY ID
====================================================== */

// PATCH /admin/releases/:id
exports.updateRelease = async (req, res) => {
  try {
    const { artistId, artist, ...rest } = req.body;
    validateSpotifyUrl(rest.spotifyUrl);

    const release = await Release.findById(req.params.id);
    if (!release) return res.status(404).json({ message: "Release not found" });

    const prevArtist = release.artist?.toString() || null;
    const newArtist = artistId !== undefined || artist !== undefined ? artistId || artist || null : prevArtist;

    if (newArtist && newArtist !== prevArtist && !await Artist.exists({ _id: artistObjectId(newArtist) })) return res.status(400).json({ error: "Artista desconocido" });

    // Actualizamos cuerpo
    Object.assign(release, rest);
    release.artist = newArtist;

    await release.save();

    // Si cambió el artista → reassign
    if (prevArtist && prevArtist !== newArtist) {
      await Artist.findByIdAndUpdate(prevArtist, { $pull: { albums: release._id } });
    }

    if (newArtist) {
      await Artist.findByIdAndUpdate(newArtist, {
        $addToSet: { albums: release._id },
      });
    }

    const updated = await Release.findById(release._id)
      .populate("artist", "name slug")
      .populate({ path: "label", model: Label, select: "name" });

    res.json(updated);
  } catch (error) {
    console.error("Error actualizando release:", error);
    res.status(400).json({ error: error.message });
  }
};

/* ======================================================
   DELETE RELEASE BY ID
====================================================== */

// DELETE /admin/releases/:id
exports.deleteRelease = async (req, res) => {
  try {
    const deletedRelease = await Release.findByIdAndDelete(req.params.id);

    if (!deletedRelease) {
      return res.status(404).json({ message: "Release not found" });
    }

    // Limpiar Artist.albums
    if (deletedRelease.artist) {
      await Artist.findByIdAndUpdate(deletedRelease.artist, {
        $pull: { albums: deletedRelease._id },
      });
    }

    res.json({ message: "Release deleted successfully" });
  } catch (error) {
    console.error("Error eliminando release:", error);
    res.status(500).json({ error: error.message });
  }
};
