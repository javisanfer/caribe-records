const Artist = require("../models/artist.model");
const slugify = require("slugify");

// Helper para generar slug
function ensureSlug(artist = {}) {
  if (artist.slug) return artist.slug;
  if (!artist.name) return undefined;

  return slugify(artist.name, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/* ======================================================
   GET /artists  (público)
====================================================== */
exports.getArtists = async (req, res) => {
  try {
    const artists = await Artist.find()
      .select("name slug photos")
      .lean();

    res.json(artists);
  } catch (error) {
    console.error("Error obteniendo artistas:", error);
    res.status(500).json({ error: "Error interno obteniendo artistas" });
  }
};

/* ======================================================
   GET /artists/:id  (público, por ID)
====================================================== */
exports.getArtistById = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id)
      .populate({
        path: "albums",
        match: { catalogVisible: { $ne: false } },
        select:
          "title format release_date cover_image cover spotifyUrl catalog serialNumber",
        options: { sort: { release_date: -1, createdAt: -1 } },
      })
      .lean();

    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    res.json(artist);
  } catch (error) {
    console.error("Error obteniendo artista por ID:", error);
    res.status(500).json({ error: "Error interno obteniendo artista" });
  }
};

/* ======================================================
   GET /artists/slug/:slug  (público)
====================================================== */
exports.getArtistBySlug = async (req, res) => {
  try {
    const artist = await Artist.findOne({ slug: req.params.slug })
      .populate({
        path: "albums",
        match: { catalogVisible: { $ne: false } },
        select:
          "title format release_date cover_image cover spotifyUrl catalog serialNumber",
        options: { sort: { release_date: -1, createdAt: -1 } },
      })
      .lean();

    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    res.json(artist);
  } catch (error) {
    console.error("Error obteniendo artista por slug:", error);
    res.status(500).json({ error: "Error interno obteniendo artista" });
  }
};

/* ======================================================
   POST /admin/artists  (crear uno o varios)
====================================================== */
exports.createArtists = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    for (const a of payload) {
      if (!a.name) {
        return res.status(400).json({
          message: "Cada artista debe incluir un nombre (name)",
        });
      }
    }

    const dataToCreate = payload.map((a) => ({
      ...a,
      slug: ensureSlug(a),
    }));

    const created = await Artist.create(dataToCreate);

    return res.status(201).json(Array.isArray(req.body) ? created : created[0]);
  } catch (error) {
    console.error("Error al crear artistas:", error);
    res.status(500).json({
      message: "Error al crear artistas",
      error: error.message,
    });
  }
};

/* ======================================================
   PATCH /admin/artists/slug/:slug  (admin)
====================================================== */
exports.updateArtist = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Si cambia el nombre → regenerar slug (a no ser que el user lo ponga a mano)
    if (updates.name && !updates.slug) {
      updates.slug = ensureSlug(updates);
    }

    const updatedArtist = await Artist.findOneAndUpdate(
      { slug: req.params.slug },
      updates,
      { new: true }
    );

    if (!updatedArtist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    res.json(updatedArtist);
  } catch (error) {
    console.error("Error actualizando artista:", error);
    res.status(400).json({ error: error.message });
  }
};

/* ======================================================
   DELETE /admin/artists/slug/:slug  (admin)
====================================================== */
exports.deleteArtist = async (req, res) => {
  try {
    const deletedArtist = await Artist.findOneAndDelete({
      slug: req.params.slug,
    });

    if (!deletedArtist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    res.json({ message: "Artist deleted successfully" });
  } catch (error) {
    console.error("Error eliminando artista:", error);
    res.status(500).json({ error: "Error interno eliminando artista" });
  }
};
