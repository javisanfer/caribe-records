const sessionIdleMinutes = Number.parseInt(
  process.env.SESSION_IDLE_MINUTES || "5",
  10,
);

const sessionCookieName = process.env.SESSION_COOKIE_NAME || "connect.sid";

const production = process.env.NODE_ENV === "production";
const listenHost = process.env.HOST || (production ? undefined : "127.0.0.1");
const allowLocalHttp = !production && ["127.0.0.1", "localhost", "::1"].includes(listenHost)
  && process.env.SESSION_SECURE !== "true";

const sessionCookieOptions = {
  httpOnly: true,
  secure: allowLocalHttp ? false : true,
  sameSite: process.env.SESSION_SAME_SITE || "lax",
  maxAge: sessionIdleMinutes * 60 * 1000,
};

const sessionCookieClearOptions = {
  httpOnly: sessionCookieOptions.httpOnly,
  secure: sessionCookieOptions.secure,
  sameSite: sessionCookieOptions.sameSite,
  path: "/",
};

module.exports = {
  listenHost,
  sessionIdleMinutes,
  sessionCookieName,
  sessionCookieOptions,
  sessionCookieClearOptions,
};
