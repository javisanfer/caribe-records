const Artist = require("../models/artist.model");
const Release = require("../models/release.model");
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

async function withAlbums(artist) {
  // Imported records can carry older album links on the artist itself.
  artist.albums = await Release.find({
    catalogVisible: { $ne: false },
    $or: [{ _id: { $in: artist.albums || [] } }, { artist: artist._id }, { collaborators: artist._id }],
  }).select("title format release_date cover_image cover listenUrl spotifyUrl appleMusicUrl bandcampUrl catalog serialNumber")
    .sort({ release_date: -1, createdAt: -1 }).lean();
  return artist;
}

/* ======================================================
   GET /artists  (público)
====================================================== */
exports.getArtists = async (req, res) => {
  try {
    const artists = await Artist.find(req.path.startsWith("/admin/") ? {} : { rosterVisible: { $ne: false } })
      .select("name slug photos")
      .lean();

    res.json(artists);
  } catch (error) {
    console.error("Error obteniendo artistas:", error.name);
    throw error;
  }
};

/* ======================================================
   GET /artists/:id  (público, por ID)
====================================================== */
exports.getArtistById = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id).lean();

    if (!artist || artist.rosterVisible === false) {
      return res.status(404).json({ message: "Artist not found" });
    }

    res.json(await withAlbums(artist));
  } catch (error) {
    console.error("Error obteniendo artista por ID:", error.name);
    throw error;
  }
};

/* ======================================================
   GET /artists/slug/:slug  (público)
====================================================== */
exports.getArtistBySlug = async (req, res) => {
  try {
    const artist = await Artist.findOne({ slug: req.params.slug }).lean();

    if (!artist || (artist.rosterVisible === false && !req.path.startsWith("/admin/"))) {
      return res.status(404).json({ message: "Artist not found" });
    }

    res.json(await withAlbums(artist));
  } catch (error) {
    console.error("Error obteniendo artista por slug:", error.name);
    throw error;
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
    console.error("Error al crear artistas:", error.name);
    res.status(error.code === 11000 ? 409 : 400).json({
      message: "Error al crear artistas",
      fields: Object.keys(error.errors || {}),
    });
  }
};

/* ======================================================
   PATCH /admin/artists/slug/:slug  (admin)
====================================================== */
exports.updateArtist = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.bio !== undefined && updates.bioHtml === undefined) updates.bioHtml = "";

    // Si cambia el nombre → regenerar slug (a no ser que el user lo ponga a mano)
    if (updates.name && !updates.slug) {
      updates.slug = ensureSlug(updates);
    }

    const updatedArtist = await Artist.findOneAndUpdate(
      { slug: req.params.slug },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedArtist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    res.json(updatedArtist);
  } catch (error) {
    console.error("Error actualizando artista:", error.name);
    res.status(400).json({ message: "Comprueba los datos del artista", fields: Object.keys(error.errors || {}) });
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
    console.error("Error eliminando artista:", error.name);
    throw error;
  }
};
