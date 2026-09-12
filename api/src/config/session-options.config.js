const sessionIdleMinutes = Number.parseInt(
  process.env.SESSION_IDLE_MINUTES || "5",
  10,
);

const sessionCookieName = process.env.SESSION_COOKIE_NAME || "connect.sid";

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.SESSION_SECURE === "true",
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
  sessionIdleMinutes,
  sessionCookieName,
  sessionCookieOptions,
  sessionCookieClearOptions,
};
