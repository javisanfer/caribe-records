const expressSession = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config();

const sessionMaxDays = parseInt(process.env.SESSION_MAX_DAYS || "1");

console.log("🔍 Conectando a MongoDB en:", process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI no está definido. Verifica tu archivo .env");
  process.exit(1);
}

module.exports = expressSession({ // ✅ Exportamos directamente el middleware
  secret: process.env.SESSION_SECRET || "defaultSecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.SESSION_SECURE === "true",
    maxAge: sessionMaxDays * 24 * 60 * 60 * 1000
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "sessions",
    ttl: sessionMaxDays * 24 * 60 * 60
  }),
});