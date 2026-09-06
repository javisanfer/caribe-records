// models/editorial.model.js
const mongoose = require("mongoose");
const slugify = require("slugify");

// ----- Subesquemas -----
const creditSchema = new mongoose.Schema({
  role: { type: String, trim: true },
  name: { type: String, trim: true },
  url:  { type: String, trim: true }
}, { _id: false });

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, trim: true },
  caption: { type: String, trim: true },
  credit: { type: String, trim: true },
  width: Number,
  height: Number,
  focalPoint: { x: Number, y: Number }
}, { _id: false });

const blockSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["heading", "paragraph", "image", "quote", "embed", "separator", "gallery"]
  },
  level: Number,
  text: String,
  image: imageSchema,
  quote: String,
  cite: String,
  embed: String,
  gallery: [imageSchema]
}, { _id: false });

const seoSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  ogImage: { type: String, trim: true }
}, { _id: false });

// ----- Esquema principal -----
const editorialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug:  { type: String },
  subtitle: { type: String, trim: true },
  status: { type: String, enum: ["draft", "published", "scheduled"], default: "draft", index: true },
  publishAt: { type: Date, index: true },

  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  credits: [creditSchema],

  hero: { type: imageSchema, required: true },
  blocks: { type: [blockSchema], default: [] },

  excerpt: { type: String, trim: true },
  wordCount: { type: Number, default: 0 },
  readingTime: { type: Number, default: 0 },

  tags: [{ type: String, trim: true, index: true }],
  relatedArtists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artist" }],
  relatedReleases: [{ type: mongoose.Schema.Types.ObjectId, ref: "Release" }],

  seo: seoSchema,

  featured: { type: Boolean, default: false },
  section: { type: String, trim: true },
  series: { type: String, trim: true }
}, { timestamps: true });

// ----- Índices -----
editorialSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $exists: true, $type: "string", $ne: "" } } }
);
editorialSchema.index({ status: 1, publishAt: -1 });
editorialSchema.index({ title: "text", subtitle: "text", excerpt: "text" });

// ----- Hooks -----
editorialSchema.pre("save", async function(next) {
  if (!this.slug && this.title) {
    const base = slugify(this.title, { lower: true, strict: true, trim: true });
    let candidate = base;
    let n = 2;
    while (await this.constructor.exists({ slug: candidate })) {
      candidate = `${base}-${n++}`;
    }
    this.slug = candidate;
  }

  if (this.status === "scheduled" && !this.publishAt) {
    return next(new Error("publishAt es obligatorio cuando status=scheduled"));
  }

  const words = (this.blocks || [])
    .filter(b => ["paragraph", "heading", "quote"].includes(b.type))
    .map(b => (b.text || b.quote || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " "))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  this.wordCount = words;
  this.readingTime = Math.max(1, Math.round(words / 200));

  next();
});

// ----- Métodos -----
editorialSchema.methods.isPublic = function(now = new Date()) {
  if (this.status === "published") return true;
  if (this.status === "scheduled" && this.publishAt && this.publishAt <= now) return true;
  return false;
};

module.exports = mongoose.models.Editorial || mongoose.model("Editorial", editorialSchema);
