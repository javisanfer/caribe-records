const official = location.hostname === "caribe-records.com";
const testing = import.meta.env.MODE === "analytics-test" && ["localhost", "127.0.0.1"].includes(location.hostname);
const configured = import.meta.env.VITE_GA_MEASUREMENT_ID || "";
const id = testing ? "G-TEST000001" : official && /^G-[A-Z0-9]{4,20}$/.test(configured) ? configured : "";
export const enabled = Boolean(id);
export const preferenceKey = "caribe.analytics.v1";
const lifetime = 180 * 86400;
export function choice() {
  try {
    const saved = JSON.parse(localStorage.getItem(preferenceKey));
    if (saved?.until > Date.now() && ["yes", "no"].includes(saved.value)) return saved.value;
  } catch { /* Consent defaults to undecided. */ }
  return "";
}

export function saveChoice(value) {
  try { localStorage.setItem(preferenceKey, JSON.stringify({ value, until: Date.now() + lifetime * 1000 })); }
  catch { /* An unavailable store never grants persistent consent. */ }
}

// The tag lives in its own disposable document. Removing it also removes its
// timers, listeners and automatic instrumentation before private routes render.
let frame, tag, current, lastView, granted = false;
let pending = [];
function stop() {
  if (frame?.contentWindow) frame.contentWindow["ga-disable-" + id] = true;
  frame?.remove();
  frame = tag = current = lastView = null;
  pending = [];
}

export function clearCookies() {
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0].trim();
    if (!/^_ga(?:_[a-zA-Z0-9_-]+)?$/.test(name)) continue;
    for (const domain of ["", "; Domain=" + location.hostname]) {
      document.cookie = name + "=; Max-Age=0; Path=/" + domain;
    }
  }
}

export function permit(value) {
  granted = enabled && value === "yes";
  if (!granted) { stop(); clearCookies(); }
}

function transmit(name, params) {
  if (!granted) return;
  if (tag) { tag("event", name, params); return; }
  pending.push([name, params]);
  if (frame) return;
  const el = document.createElement("iframe");
  el.hidden = true;
  el.title = "Medición de audiencia";
  el.referrerPolicy = "no-referrer";
  el.src = "/audience-frame.html";
  el.onload = () => {
    if (el !== frame || !granted) return;
    const win = el.contentWindow;
    tag = win.gtag;
    if (typeof tag !== "function") { stop(); return; }
    tag("set", "send_page_view", false);
    tag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    tag("js", new Date());
    tag("config", id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_domain: location.hostname, cookie_path: "/", cookie_expires: lifetime, cookie_update: false,
      page_location: pending[0][1].page_location, page_referrer: "", page_title: "Caribe Records", ignore_referrer: true });
    for (const [event, fields] of pending) tag("event", event, fields);
    pending = [];
    const script = win.document.createElement("script");
    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + id;
    win.document.head.appendChild(script);
  };
  frame = el;
  document.body.appendChild(el);
}

const sections = { "/": "home", "/artistas": "artists", "/releases": "catalogue", "/editoriales": "editorials", "/eventos": "events", "/about": "about", "/privacidad": "privacy" };
const details = { artistas: "artist", releases: "release", editorial: "editorial", eventos: "event" };
let route;
export function visit(key, pathname) {
  if (route?.key !== key || route?.path !== pathname) current = null;
  route = { key, path: pathname };
  if (Object.hasOwn(sections, pathname)) return page(pathname, sections[pathname]);
  if (!/^\/(artistas|releases|editorial|eventos)\/[a-zA-Z0-9_-]+$/.test(pathname)) stop();
}

export function releaseSlug(release) {
  const text = release.slug || [release.artistName || release.artist?.name, release.title].filter(Boolean).join(" ");
  return (text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

export function detail(section, item) {
  if (!item || !details[section]) return;
  const key = section === "releases" ? item._id : item.slug;
  const path = "/" + section + "/" + key;
  const slug = section === "releases" ? releaseSlug(item) : item.slug;
  if (path !== location.pathname || !/^[a-z0-9][a-z0-9_-]{0,119}$/i.test(slug || "")) return;
  page(path, details[section], slug);
}

function page(path, type, slug) {
  if (!granted || route?.path !== path || location.pathname !== path) return;
  const token = route.key + "|" + path;
  current = { page_location: "https://caribe-records.com" + path, page_referrer: "", page_title: slug || type, content_type: type, ...(slug && { content_slug: slug }) };
  if (lastView === token) return;
  lastView = token;
  transmit("page_view", current);
}

const providers = { "spotify.com": "spotify", "apple.com": "apple_music", "bandcamp.com": "bandcamp", "youtube.com": "youtube", "youtu.be": "youtube", "deezer.com": "deezer", "tidal.com": "tidal", "soundcloud.com": "soundcloud", "bigcartel.com": "big_cartel", "dice.fm": "dice", "oneboxtds.com": "onebox", "entradium.com": "entradium", "ticketmaster.es": "ticketmaster", "ingresse.com": "ingresse" };
export function outbound(event) {
  if (!granted || !current || route?.path !== location.pathname) return;
  const link = event.target.closest?.("a[href]");
  if (!link || !/^https?:$/.test(link.protocol) || link.origin === location.origin) return;
  const host = Object.keys(providers).find(domain => link.hostname === domain || link.hostname.endsWith("." + domain));
  const platform = providers[host] || "other";
  const kind = link.dataset.outbound || (platform === "big_cartel" ? "shop" : ["spotify", "apple_music", "bandcamp", "youtube", "deezer", "tidal", "soundcloud"].includes(platform) ? "listen" : "");
  if (!["listen","ticket","shop"].includes(kind)) return;
  const slug = link.dataset.contentSlug;
  transmit(kind + "_click", { ...current, ...(slug && /^[a-z0-9_-]{1,120}$/i.test(slug) && { content_slug: slug, content_type: link.dataset.contentType }), platform });
}
