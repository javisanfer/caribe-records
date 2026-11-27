// Leave room for base64 transport, multipart fields and the article in Lambda.
const uploadBudget = 3 * 1024 * 1024;
const inputLimit = 40 * 1024 * 1024;
export const editorialPhotoTypes = "image/jpeg,image/png,image/webp";

export function checkEditorialPhoto(file) {
  if (!file) return true;
  if (!editorialPhotoTypes.split(",").includes(file.type)) return "Selecciona una foto JPG, PNG o WebP.";
  if (file.size > inputLimit) return "Selecciona una foto de hasta 40 MiB.";
  return true;
}

// Canvas exports only one frame. Keep animated originals on the existing upload path.
async function isAnimated(file) {
  if (file.type === "image/webp") {
    const header = new Uint8Array(await file.slice(0, 21).arrayBuffer());
    return String.fromCharCode(...header.slice(12, 16)) === "VP8X" && (header[20] & 2) !== 0;
  }
  if (file.type !== "image/png") return false;
  for (let offset = 8; offset + 12 <= file.size;) {
    const header = new Uint8Array(await file.slice(offset, offset + 8).arrayBuffer());
    const chunk = String.fromCharCode(...header.slice(4));
    if (chunk === "acTL") return true;
    if (chunk === "IDAT" || chunk === "IEND") return false;
    offset += new DataView(header.buffer).getUint32(0) + 12;
  }
  return false;
}

export async function prepareEditorialPhoto(file) {
  const validation = checkEditorialPhoto(file);
  if (validation !== true) throw new Error(validation);
  if (file.size <= uploadBudget) return file;
  if (await isAnimated(file)) {
    if (file.size <= 10 * 1024 * 1024) return file;
    throw new Error("Para conservar la animación, pega su URL o selecciona una foto fija.");
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  const canvas = document.createElement("canvas");
  try {
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error("No se ha podido leer la foto. Vuelve a exportarla como JPG, PNG o WebP.");
    }
    const longest = Math.max(image.naturalWidth, image.naturalHeight);
    let edge = Math.min(4096, longest);
    const type = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
    while (true) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * edge / longest));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * edge / longest));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("El navegador no ha podido preparar la foto.");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.94, 0.9]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality));
        if (blob && blob.size <= uploadBudget) {
          const ext = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" }[blob.type];
          return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type });
        }
      }
      if (edge <= 1920) throw new Error("Exporta la foto como JPG o WebP y vuelve a seleccionarla.");
      edge = Math.max(1920, Math.floor(edge * 0.85));
    }
  } finally {
    URL.revokeObjectURL(url);
    canvas.width = canvas.height = 0;
  }
}
