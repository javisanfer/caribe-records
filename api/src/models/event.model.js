// src/models/event.model.js
const mongoose = require("mongoose");
const slugify = require("slugify");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug:  { type: String, trim: true }, // 👈 ya no es unique aquí
  date:  { type: Date, required: true },
  venue: { type: String, required: true, trim: true },
  city:  { type: String, required: true, trim: true },
  country: { type: String, default: "ES", trim: true },
  address: { type: String },
  geo: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  },
  lineup: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artist" }],
  posterUrl: { type: String },
  ticketUrl: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// -----------------------------------------------------------
// Índices útiles
// -----------------------------------------------------------
eventSchema.index({ date: -1 });
eventSchema.index({ city: 1, country: 1 });
eventSchema.index({ geo: "2dsphere" });
eventSchema.index({ title: "text", venue: "text", description: "text" });

// Índice único PARCIAL para slug
eventSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      slug: { $exists: true, $type: "string", $ne: "" }
    }
  }
);

// -----------------------------------------------------------
// Hook pre-save: genera slug automáticamente y evita duplicados
// -----------------------------------------------------------
eventSchema.pre("save", async function(next) {
  try {
    if ((!this.slug || this.slug.trim() === "") && this.title) {
      const base = slugify(this.title, { lower: true, strict: true, trim: true });
      let candidate = base;
      let n = 2;

      // Evita colisiones en caso de slugs iguales
      while (await this.constructor.exists({ slug: candidate })) {
        candidate = `${base}-${n++}`;
      }

      this.slug = candidate;
    }

    next();
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// Export seguro (evita recompilaciones del modelo)
// -----------------------------------------------------------
module.exports =
  mongoose.models.Event || mongoose.model("Event", eventSchema);