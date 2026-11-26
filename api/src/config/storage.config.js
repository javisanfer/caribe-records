const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const path = require("node:path");
const { mkdir, writeFile } = require("node:fs/promises");
const { randomUUID } = require("node:crypto");

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const extensions = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const ALLOWED_IMAGE_TYPES = new Set(Object.keys(extensions));
const localDirectory = process.env.LOCAL_IMAGE_UPLOADS === "true" && process.env.NODE_ENV !== "production"
  ? path.resolve(__dirname, "../../uploads/dev") : null;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function imageFileFilter(req, file, callback) {
  const accepted = ALLOWED_IMAGE_TYPES.has(file.mimetype);
  callback(accepted ? null : new multer.MulterError("LIMIT_UNEXPECTED_FILE"), accepted);
}

function matchesSignature(buffer, type) {
  if (type === "image/png") return buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (type === "image/jpeg") return buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  return type === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF"
    && buffer.toString("ascii", 8, 12) === "WEBP" && buffer.length > 12;
}

const parser = multer({
  storage: multer.memoryStorage(), fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 64, parts: 66 },
});

async function storeImage(file) {
  if (!matchesSignature(file.buffer, file.mimetype)) throw new multer.MulterError("LIMIT_UNEXPECTED_FILE");
  if (localDirectory) {
    const filename = randomUUID() + extensions[file.mimetype];
    await mkdir(localDirectory, { recursive: true });
    await writeFile(path.join(localDirectory, filename), file.buffer, { flag: "wx" });
    return { filename, path: path.join(localDirectory, filename) };
  }
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: process.env.NODE_ENV === "test" ? "caribe-records-test" : "iron-records",
      resource_type: "image", allowed_formats: ["jpg", "jpeg", "png", "webp"],
    }, (error, image) => error ? reject(error) : resolve(image));
    stream.end(file.buffer);
  });
  return { filename: result.public_id, path: result.secure_url };
}

function single(field) {
  const parse = parser.single(field);
  return (req, res, next) => parse(req, res, async (error) => {
    if (error || !req.file) return next(error);
    try {
      Object.assign(req.file, await storeImage(req.file));
      delete req.file.buffer;
    } catch (failure) { return next(failure); }
    next();
  });
}

module.exports = {
  single, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, imageFileFilter, matchesSignature, localDirectory,
  imageUrlFor: (file) => localDirectory ? `/api/v1/uploads/${file.filename}` : file.path,
};
