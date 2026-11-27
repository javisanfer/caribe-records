const { randomBytes } = require("node:crypto");
const { isTrustedOrigin } = require("../config/cors.config");

function sendCsrfToken(req, res) {
  req.session.csrfToken ??= randomBytes(32).toString("hex");
  res.set("X-CSRF-Token", req.session.csrfToken);
}

// Browsers supply Origin on writes. Non-browser clients can echo the secret
// issued by /sessions/current after signing in with a trusted Origin.
function protectSessionWrites(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("Origin");
  if (isTrustedOrigin(origin)) return next();
  if (!origin) {
    if (req.get("Sec-Fetch-Site") === "same-origin") return next();
    const token = req.get("X-CSRF-Token");
    if (token && token === req.session.csrfToken) return next();
  }
  return res.status(403).json({ message: "No se ha podido verificar el origen de la petición." });
}

module.exports = { protectSessionWrites, sendCsrfToken };
