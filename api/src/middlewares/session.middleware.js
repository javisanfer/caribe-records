const createError = require("http-errors");
const User = require("../models/user.model");

const loadSessionUser = (req, res, next) => {
  const { userId } = req.session || {};
  if (!userId) {
    req.user = undefined;
    return next();
  }
  User.findById(userId)
    .then((user) => {
      req.user = user || undefined;
      next();
    })
    .catch(next);
};

const isAuthenticated = (req, res, next) => {
  if (req.user) return next();
  return next(createError(401, "Unauthorized, missing credentials"));
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return next(createError(403, "Forbidden, insufficient access level"));
};

module.exports = { loadSessionUser, isAuthenticated, isAdmin };