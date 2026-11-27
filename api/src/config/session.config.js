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

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required");
}

module.exports = (client) => expressSession({
  name: sessionCookieName,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    ...sessionCookieOptions,
    // Loopback development may use HTTP. Keep Secure even there when served over TLS.
    secure: sessionCookieOptions.secure ? true : "auto",
  },
  store: MongoStore.create({
    client,
    collectionName: "sessions",
    ttl: sessionIdleMinutes * 60
  }),
});
