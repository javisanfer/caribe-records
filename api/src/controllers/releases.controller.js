const Release = require("../models/release.model");
const Artist  = require("../models/artist.model");
const slugify = require("slugify");

/* ======================================================
   PUBLIC
====================================================== */

// GET /releases
exports.getReleases = async (req, res) => {
  try {
    const releases = await Release.find()
      .populate("artist", "name slug")
      .populate("label")
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
      .populate("label");

    if (!release) return res.status(404).json({ message: "Release not found" });

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
      .populate("label");

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

    const artistRef = artistId || artist || null;

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
      .populate("label");

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

    const release = await Release.findById(req.params.id);
    if (!release) return res.status(404).json({ message: "Release not found" });

    const prevArtist = release.artist?.toString() || null;
    const newArtist = artistId || artist || prevArtist;

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
      .populate("label");

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
