const createError = require("http-errors");
const User = require("../models/user.model");

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
