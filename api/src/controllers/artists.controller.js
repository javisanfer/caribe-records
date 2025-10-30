const Artist = require("../models/artist.model");

// Obtener todos los artistas
exports.getArtists = async (req, res) => {
  try {
    const artists = await Artist.find().populate("albums");
    res.json(artists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un artista por ID
exports.getArtistById = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id).populate("albums");
    if (!artist) return res.status(404).json({ message: "Artist not found" });
    res.json(artist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear un nuevo artista
exports.createArtists = async (req, res) => {
  try {
    const newArtists = await Artist.insertMany(req.body); // 👈 Permite múltiples artistas
    res.status(201).json(newArtists);
  } catch (error) {
    console.error("Error al crear artistas:", error);
    res.status(500).json({ message: "Error al crear artistas", error });
  }
};

// Actualizar un artista
exports.updateArtist = async (req, res) => {
  try {
    const updatedArtist = await Artist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedArtist) return res.status(404).json({ message: "Artist not found" });
    res.json(updatedArtist);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un artista
exports.deleteArtist = async (req, res) => {
  try {
    const deletedArtist = await Artist.findByIdAndDelete(req.params.id);
    if (!deletedArtist) return res.status(404).json({ message: "Artist not found" });
    res.json({ message: "Artist deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
