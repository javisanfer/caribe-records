const mongoose = require("mongoose");

const releaseSchema = new mongoose.Schema({
  format: { type: String, required: true },
  label: { type: mongoose.Schema.Types.ObjectId, ref: "Label" },
  release_date: { type: Date },
  barcode: { type: String },
  country: { type: String },
  tracklist: [{
    position: { type: String },
    title: { type: String },
    duration: { type: String }
  }],
  cover_image: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Release", releaseSchema);
