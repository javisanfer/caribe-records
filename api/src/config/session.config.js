const expressSession = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config();
const {
  sessionIdleMinutes,
  sessionCookieName,
  sessionCookieOptions,
} = require("./session-options.config");

if (!process.env.MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI no está definido. Verifica tu archivo .env");
  process.exit(1);
}

module.exports = expressSession({ // ✅ Exportamos directamente el middleware
  name: sessionCookieName,
  secret: process.env.SESSION_SECRET || "defaultSecret",
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: sessionCookieOptions,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "sessions",
    ttl: sessionIdleMinutes * 60
  }),
});
