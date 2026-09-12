const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const folder = process.env.NODE_ENV === "test" ? "caribe-records-test" : "iron-records";

const storage = {
  _handleFile(req, file, callback) {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return callback(error);
        return callback(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
        });
      },
    );

    file.stream.pipe(stream);
  },

  _removeFile(req, file, callback) {
    if (!file.filename) return callback(null);
    cloudinary.uploader.destroy(file.filename).then(() => callback(null)).catch(callback);
  },
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: imageFileFilter,
});

function imageFileFilter(req, file, callback) {
  const accepted = ALLOWED_IMAGE_TYPES.has(file.mimetype);
  callback(
    accepted ? null : new multer.MulterError("LIMIT_UNEXPECTED_FILE"),
    accepted,
  );
}

module.exports = upload;
module.exports.ALLOWED_IMAGE_TYPES = ALLOWED_IMAGE_TYPES;
module.exports.MAX_IMAGE_BYTES = MAX_IMAGE_BYTES;
module.exports.imageFileFilter = imageFileFilter;
