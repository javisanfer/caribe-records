const crypto = require("node:crypto");
const { Resend } = require("resend");
const User = require("../models/user.model");

async function inviteProductionAdmin(db) {
  if (process.env.NODE_ENV !== "production") return;
  const marker = db.collection("app_migrations");
  const id = "admin-invite-hola-2026-11";
  if (await marker.findOne({ _id: id })) return;

  const email = "hola@caribe-records.com";
  const existing = await User.findOne({ email });
  if (existing?.active && existing.role === "admin") {
    await marker.updateOne({ _id: id }, { $set: { completedAt: new Date(), existing: true } }, { upsert: true });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const user = existing || new User({
    name: "Caribe Records",
    email,
    password: crypto.randomBytes(32).toString("base64url"),
  });
  user.role = "admin";
  user.active = false;
  user.activateToken = token;
  user.activateExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await user.save();

  if (!process.env.APP_URL || !process.env.RESEND_API_KEY) {
    throw new Error("Admin invite requires APP_URL and RESEND_API_KEY");
  }
  const url = new URL("/admin/activar", process.env.APP_URL);
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);

  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: "Caribe Records <hola@caribe-records.com>",
    to: [email],
    subject: "Activa tu acceso a Caribe Records",
    html: `<p>Tu acceso de administración está preparado.</p><p><a href="${url.toString()}">Crear contraseña</a></p><p>El enlace caduca en siete días.</p>`,
  });
  if (error) throw new Error(`Unable to send admin invite: ${error.name || "provider error"}`);

  await marker.updateOne({ _id: id }, { $set: { completedAt: new Date() } }, { upsert: true });
  console.info("Production admin invitation sent");
}

module.exports = { inviteProductionAdmin };
