const User = require("../models/user.model");
const createError = require("http-errors");

module.exports.create = (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (user) {
        user
          .checkPassword(password)
          .then((match) => {
            if (match) {
              req.session.userId = user.id;
              res.status(201).json(user);
            } else {
              next(createError(401, {
                message: "Bad credentials",
                errors: { email: "Invalid email or password" },
              }));
            }
          })
          .catch(next);
      } else {
        next(createError(401, {
          message: "Bad credentials",
          errors: { email: "Invalid email or password" },
        }));
      }
    })
    .catch(next);
};

// 🔹 Agregar la función `destroy` para manejar el cierre de sesión
module.exports.destroy = (req, res, next) => {
  if (!req.session) {
    return res.status(400).json({ message: "No active session" });
  }

  req.session.destroy((err) => {
    if (err) {
      return next(createError(500, "Error al cerrar sesión"));
    }
    res.clearCookie("connect.sid");
    res.status(204).send();
  });
};