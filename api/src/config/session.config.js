const expressSession = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config();

const sessionIdleMinutes = Number.parseInt(process.env.SESSION_IDLE_MINUTES || "5", 10);
const sessionIdleMs = sessionIdleMinutes * 60 * 1000;

console.log("🔍 Conectando a MongoDB en:", process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI no está definido. Verifica tu archivo .env");
  process.exit(1);
}

module.exports = expressSession({ // ✅ Exportamos directamente el middleware
  name: process.env.SESSION_COOKIE_NAME || "connect.sid",
  secret: process.env.SESSION_SECRET || "defaultSecret",
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.SESSION_SECURE === "true",
    maxAge: sessionIdleMs
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "sessions",
    ttl: sessionIdleMinutes * 60
  }),
});
