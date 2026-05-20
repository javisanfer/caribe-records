const mongoose = require("mongoose");
const slugify = require("slugify");

// --- Subesquemas (sin _id, embebidos dentro del artista) ---
const socialSchema = new mongoose.Schema({
  instagram: String,
  youtube: String,
  x: String,              // Twitter/X
  facebook: String,
}, { _id: false });

const streamingSchema = new mongoose.Schema({
  spotify: String,
  appleMusic: String,
  amazonMusic: String,
  youtubeMusic: String,
  deezer: String,
  tidal: String,
  bandcamp: String,
}, { _id: false });

const webSchema = new mongoose.Schema({
  officialStore: String,  // “Official Store”
  website: String,        // Web general si la hay
  pressKit: String,       // Opcional: EPK/press kit
}, { _id: false });

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url:   { type: String, required: true }, // YouTube/Vimeo/etc.
  year:  Number
}, { _id: false });

const photosSchema = new mongoose.Schema({
  portraitUrl: String,    // Foto principal
  coverUrl: String        // Imagen de cabecera opcional
}, { _id: false });

// --- Esquema principal del artista ---
const artistSchema = new mongoose.Schema({
  // Identidad
  name:   { type: String, required: true, trim: true },
  slug:   { type: String, unique: true },
  bio:    { type: String },
  genres: [{ type: String, trim: true }],

  // Ubicación / metadatos
  country: { type: String, trim: true }, // ISO-2, ej: ES, US
  city:    { type: String, trim: true },
  members: [{ type: String, trim: true }],
  formedYear: Number,

  // Media
  photos: photosSchema,

  // Enlaces
  web:       webSchema,
  social:    socialSchema,
  streaming: streamingSchema,

  // Vídeos destacados (opcional)
  videos: [videoSchema],

  // Relación con releases (no duplica datos)
  albums: [{ type: mongoose.Schema.Types.ObjectId, ref: "Release" }],

  // Editoriales donde aparece el artista
  editorials: [{ type: mongoose.Schema.Types.ObjectId, ref: "Editorial" }],

  // Eventos en los que participa
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],

}, { timestamps: true });

// --- Hooks y virtuals ---
artistSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true, trim: true });
  }
  next();
});

// --- Índices ---
artistSchema.index({ name: "text", bio: "text" });

// --- Export ---
module.exports = mongoose.models.Artist || mongoose.model("Artist", artistSchema);