const User = require("../models/user.model");
const createError = require("http-errors");
const {
  sessionCookieName,
  sessionCookieClearOptions,
} = require("../config/session-options.config");

module.exports.create = (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (user) {
        user
          .checkPassword(password)
          .then((match) => {
            if (!match) {
              next(createError(401, {
                message: "Bad credentials",
                errors: { email: "Invalid email or password" },
              }));
            } else if (!user.active) {
              next(createError(403, {
                message: "Inactive account",
                errors: { email: "Activa tu cuenta antes de iniciar sesión" },
              }));
            } else {
              req.session.regenerate((error) => {
                if (error) return next(error);
                req.session.userId = user.id;
                return req.session.save((saveError) => {
                  if (saveError) return next(saveError);
                  return res.status(201).json(user);
                });
              });
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

module.exports.destroy = (req, res, next) => {
  if (!req.session) {
    return res.status(400).json({ message: "No active session" });
  }

  req.session.destroy((err) => {
    if (err) {
      return next(createError(500, "Error al cerrar sesión"));
    }
    res.clearCookie(sessionCookieName, sessionCookieClearOptions);
    res.status(204).send();
  });
};
