const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, trim: true, default: "" },
  imageUrl: { type: String, trim: true, default: "" },
  linkUrl: { type: String, trim: true, default: "" },
  linkLabel: { type: String, trim: true, default: "Más información" },
  active: { type: Boolean, default: false, index: true },
  startAt: { type: Date, default: null, index: true },
  endAt: { type: Date, default: null, index: true },
}, { timestamps: true });

bannerSchema.index({ active: 1, startAt: -1, updatedAt: -1 });

module.exports = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);
