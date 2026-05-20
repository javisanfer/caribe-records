const mongoose = require("mongoose");

// --- TRACKLIST ---
const trackSchema = new mongoose.Schema(
  {
    position: { type: Number, min: 1 },   // numérico
    title:    { type: String, trim: true },
    duration: { type: String, trim: true }, // "5:40"
  },
  { _id: false }
);

// --- COVER ---
const coverSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    alt: { type: String, trim: true },
  },
  { _id: false }
);

// --- RELEASE ---
const releaseSchema = new mongoose.Schema(
  {
    // Identidad
    title: { type: String, required: true, trim: true },

    // Relación con Artist
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
    },

    // Nombre plano del artista (opcional)
    artistName: { type: String, trim: true },

    // Catálogo del sello (ej: CRB-001)
    catalog: { type: String, trim: true },

    // Formato (controlado)
    format: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: ["single", "ep", "lp", "recopilatorio"],
    },

    // Número de serie / tirada (opcional)
    serialNumber: { type: String, trim: true }, // ej: "#023/300"

    // Metadatos
    label:        { type: mongoose.Schema.Types.ObjectId, ref: "Label" },
    release_date: { type: Date },
    barcode:      { type: String, trim: true },
    country:      { type: String, trim: true },

    // Enlace Spotify del disco
    spotifyUrl:   { type: String, trim: true },

    // Tracklist
    tracklist: [trackSchema],

    // Portada
    cover_image: { type: String, trim: true },
    cover:       coverSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Release", releaseSchema);