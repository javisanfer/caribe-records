const Release = require("../models/release.model");

// Obtener todos los Releases
exports.getReleases = async (req, res) => {
  try {
    const releases = await Release.find()
      .populate("label") // ✅ solo label, ya no existe master
      .sort({ createdAt: -1 });

    res.json(releases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un Release por ID
exports.getReleaseById = async (req, res) => {
  try {
    const release = await Release.findById(req.params.id)
      .populate("label"); // ✅ solo label
    if (!release) return res.status(404).json({ message: "Release not found" });
    res.json(release);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear un nuevo Release
exports.createRelease = async (req, res) => {
  try {
    const newRelease = new Release(req.body);
    await newRelease.save();
    res.status(201).json(newRelease);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar un Release
exports.updateRelease = async (req, res) => {
  try {
    const updatedRelease = await Release.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("label"); // ✅ populate solo label
    if (!updatedRelease) return res.status(404).json({ message: "Release not found" });
    res.json(updatedRelease);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un Release
exports.deleteRelease = async (req, res) => {
  try {
    const deletedRelease = await Release.findByIdAndDelete(req.params.id);
    if (!deletedRelease) return res.status(404).json({ message: "Release not found" });
    res.json({ message: "Release deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};