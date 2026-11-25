const mongoose = require("mongoose");
const { z } = require("zod");

const text = z.string().trim().min(1).max(500);
const photoUrl = z.string().max(4096).refine((value) => {
  if (!value || /[\\\s]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  return safeLink(value, false);
});
function safeLink(value, allowMail) {
  try {
    const url = new URL(value);
    return !url.username && !url.password && (["https:", "http:"].includes(url.protocol)
      || (allowMail && url.protocol === "mailto:" && !!url.pathname));
  } catch { return false; }
}
const input = z.object({
  version: z.number().int().nonnegative(),
  content: z.object({
    heading: text, statement: z.string().trim().min(1).max(12000),
    photographs: z.array(z.object({ url: photoUrl, alt: text })).max(100),
    links: z.array(z.object({ label: text, detail: text, href: z.string().max(4096).refine((v) => safeLink(v, true)) })).max(30),
  }),
});
const About = mongoose.model("About", new mongoose.Schema({
  _id: String, version: Number, content: mongoose.Schema.Types.Mixed,
}, { versionKey: false }));

exports.get = async (_req, res) => {
  const page = await About.findById("about").select("-_id").lean();
  res.json(page || { version: 0, content: null });
};

exports.update = async (req, res) => {
  const result = input.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "Comprueba los textos, las imágenes y los enlaces de About." });
  const { version, content } = result.data;
  try {
    const page = await About.findOneAndUpdate({ _id: "about", version }, { $set: { content }, $inc: { version: 1 } },
      { upsert: version === 0, new: true }).select("-_id").lean();
    if (page) return res.json(page);
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  res.status(409).json({ message: "Otra persona ha guardado cambios. Abre About en otra pestaña para compararlos." });
};
