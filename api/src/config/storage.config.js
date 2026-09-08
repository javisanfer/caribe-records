const cloudinary = require("cloudinary").v2;
const multer = require("multer");

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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    callback(allowedTypes.has(file.mimetype) ? null : new multer.MulterError("LIMIT_UNEXPECTED_FILE"), allowedTypes.has(file.mimetype));
  },
});

module.exports = upload;
