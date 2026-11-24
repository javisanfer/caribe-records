const createError = require("http-errors");
const User = require("../models/user.model");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const { Resend } = require("resend");

const resetTokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports.update = (req, res, next) => {
  const permittedBody = {
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    avatar: req.body.avatar,
  };

  // remove undefined keys
  Object.keys(permittedBody).forEach((key) => {
    if (permittedBody[key] === undefined) {
      delete permittedBody[key];
    }
  });

  // merge body into req.user object
  Object.assign(req.user, permittedBody);

  req.user
    .save()
    .then((user) => res.json(user))
    .catch(next);
};

module.exports.validate = (req, res, next) => {
  User.findOne({ _id: req.params.id, activateToken: req.query.token })
    .then((user) => {
      if (user) {
        user.active = true;
        user.save().then((user) => res.json(user));
      } else {
        next(createError(404, "User not found"));
      }
    })
    .catch(next);
};

module.exports.getAllUsers = (req, res, next) => {
  User.find()
    .then((users) => res.json(users))
    .catch(next);
};

module.exports.profile = (req, res, next) => {
  res.json(req.user);
};

module.exports.completeInvite = async (req, res, next) => {
  try {
    const { email, token, password } = req.body;
    if (typeof email !== "string" || typeof token !== "string" || token.length < 40 ||
        typeof password !== "string" || password.length < 12) {
      return res.status(400).json({ message: "Datos de activación no válidos" });
    }
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      activateToken: token,
      activateExpiresAt: { $gt: new Date() },
      active: false,
    });
    if (!user) return res.status(400).json({ message: "Enlace caducado o no válido" });
    user.password = password;
    user.active = true;
    user.activateToken = null;
    user.activateExpiresAt = null;
    await user.save();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports.requestPasswordReset = async (req, res) => {
  // Keep the response identical whether or not this account exists.
  const respond = () => res.status(202).json({ message: "Si existe una cuenta de administración, recibirás un enlace para restablecer la contraseña." });
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254) return respond();

  try {
    const user = await User.findOne({ email, role: "admin", active: true });
    if (!user) return respond();
    if (!process.env.APP_URL || !process.env.RESEND_API_KEY) throw new Error("Mail configuration missing");

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await User.updateOne({ _id: user._id }, {
      $set: { passwordResetTokenHash: resetTokenHash(token), passwordResetExpiresAt: expiresAt },
    });
    const url = new URL("/admin/recuperar", process.env.APP_URL);
    url.searchParams.set("email", email);
    url.searchParams.set("token", token);
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "Caribe Records <hola@caribe-records.com>",
      to: [email],
      subject: "Restablece tu contraseña de Caribe Records",
      html: `<p>Has solicitado cambiar la contraseña del panel de Caribe Records.</p><p><a href="${url.toString()}">Elegir nueva contraseña</a></p><p>El enlace caduca en 30 minutos. Si no lo has pedido, ignora este correo.</p>`,
    });
    if (error) throw new Error(`Mail provider error: ${error.name || "unknown"}`);
    console.info("Admin password reset email sent");
  } catch (error) {
    // Never log the URL or token.
    console.error("Unable to send admin password reset:", error.message);
  }
  return respond();
};

module.exports.completePasswordReset = async (req, res, next) => {
  try {
    const { email, token, password } = req.body || {};
    if (typeof email !== "string" || typeof token !== "string" ||
        !/^[a-f0-9]{64}$/.test(token) || typeof password !== "string" || password.length < 12) {
      return res.status(400).json({ message: "Enlace o contraseña no válidos" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await User.updateOne({
      email: email.trim().toLowerCase(), role: "admin", active: true,
      passwordResetTokenHash: resetTokenHash(token),
      passwordResetExpiresAt: { $gt: new Date() },
    }, {
      $set: { password: passwordHash },
      $unset: { passwordResetTokenHash: "", passwordResetExpiresAt: "" },
    });
    if (!result.matchedCount) return res.status(400).json({ message: "El enlace ha caducado o no es válido" });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

// ⭐ Obtener el Carrito del Usuario
module.exports.getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("cart");
    if (!user) {
      return next(createError(404, "Usuario no encontrado"));
    }
    res.status(200).json(user.cart);
  } catch (error) {
    next(createError(500, "Error al obtener el Carrito"));
  }
};

// ⭐ Obtener la Wishlist del Usuario
module.exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    if (!user) {
      return next(createError(404, "Usuario no encontrado"));
    }
    res.status(200).json(user.wishlist);
  } catch (error) {
    next(createError(500, "Error al obtener la Wishlist"));
  }
};

// ⭐ Obtener la Colección Personal del Usuario
module.exports.getPersonalCollection = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("personalCollection");
    if (!user) {
      return next(createError(404, "Usuario no encontrado"));
    }
    res.status(200).json(user.personalCollection);
  } catch (error) {
    next(createError(500, "Error al obtener la Colección Personal"));
  }
};

// ⭐ Añadir un Release a la Colección del Usuario
exports.addToPersonalCollection = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { personalCollection: req.body.releaseId } },  // 👈 Añadir sin duplicar
      { new: true }
    ).populate("personalCollection");

    res.status(200).json(user);
  } catch (error) {
    next(createError(500, "Error al añadir a la Colección"));
  }
};

// ⭐ Añadir un Item a la Wishlist del Usuario
module.exports.addToWishlist = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { wishlist: req.body.itemId } },  // 👈 Añadir sin duplicar
      { new: true }
    ).populate("wishlist");

    res.status(200).json(user);
  } catch (error) {
    next(createError(500, "Error al añadir a Wishlist"));
  }
};

// ⭐ Añadir un Item al Carrito del Usuario
module.exports.addToCart = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { cart: req.body.itemId } },  // 👈 Añadir sin duplicar
      { new: true }
    ).populate("cart");

    res.status(200).json(user);
  } catch (error) {
    next(createError(500, "Error al añadir al Carrito"));
  }
};

// 🔴 Remover un Release de la Colección Personal
module.exports.removeFromCollection = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { personalCollection: req.body.releaseId } }, // 👈 Elimina el release de la colección
      { new: true }
    ).populate("personalCollection");

    res.status(200).json(user.personalCollection);
  } catch (error) {
    next(createError(500, "Error al eliminar de la Colección Personal"));
  }
};

// 🔴 Remover un Item de la Wishlist
module.exports.removeFromWishlist = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { wishlist: req.body.itemId } },  // 👈 Eliminar de la wishlist
      { new: true }
    ).populate("wishlist");

    res.status(200).json(user.wishlist);
  } catch (error) {
    next(createError(500, "Error al eliminar de la Wishlist"));
  }
};

// 🔴 Remover un Item del Carrito
module.exports.removeFromCart = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { cart: req.body.itemId } },  // 👈 Eliminar del carrito
      { new: true }
    ).populate("cart");

    res.status(200).json(user.cart);
  } catch (error) {
    next(createError(500, "Error al eliminar del Carrito"));
  }
};
