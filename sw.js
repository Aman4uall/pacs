/* =========================================================================
   PACS AI – a service worker for slow and patchy connections
   - Saves the site's core files on the first visit, then quietly downloads
     the other pages in the background (never on data saver or 2G).
   - Tries the network first; if it's slow, shows the saved copy at once and
     refreshes it in the background. Offline, saved pages still open.
   - Fonts and the camera-demo AI files are saved once and reused.
   - Never touches form submissions (Google Sheets, WhatsApp).
   When you change the site, the network-first rule means visitors get the new
   files automatically: every check skips the phone's own browser cache, and
   files are saved without their ?v= tag. Bump VERSION only to clear
   everything that's saved.
   ========================================================================= */
const VERSION = "pacs-v2";
const SITE = `${VERSION}-site`;
const LIBS = `${VERSION}-libs`;
const CORE = [
  "./", "index.html", "offline.html",
  "assets/styles.css", "assets/refresh.css", "assets/motion.css", "assets/demos.css",
  "assets/site.js", "assets/motion.js", "assets/builds.js",
  "assets/logo-horizontal.webp", "assets/logo-horizontal.png", "assets/favicon-32.png",
];
const LATER = [
  "class-8-12.html", "bba.html", "learn.html", "demos.html", "contact.html", "meetup.html", "song-challenge.html", "terms.html",
  "assets/live.js", "assets/skills.js", "assets/learn.js", "assets/meetup.js", "assets/challenge.js", "assets/apple-touch-icon.png",
];
// Files from other sites that never change once published, so the saved copy is always right
const LIB_HOSTS = ["fonts.gstatic.com", "cdn.jsdelivr.net", "storage.googleapis.com"];
const NETWORK_WAIT = 3500;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SITE).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// The page asks for the rest of the site once it's idle and the connection allows it
self.addEventListener("message", (event) => {
  if (event.data !== "warm") return;
  event.waitUntil((async () => {
    const cache = await caches.open(SITE);
    for (const url of LATER) {
      if (await cache.match(url)) continue;
      try { const res = await fetch(url, { cache: "no-cache" }); if (res.ok) await cache.put(url, res); } catch (e) { return; } // offline: try again next visit
    }
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(event, req, url));
  } else if (LIB_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(req));
  } else if (url.hostname === "fonts.googleapis.com") {
    event.respondWith(staleWhileRevalidate(event, req));
  }
  // Everything else (Google Sheets, WhatsApp, maps) goes straight to the network
});

async function networkFirst(event, req, url) {
  const cache = await caches.open(SITE);
  // One saved copy per file: "styles.css?v=…" and "learn.html?utm=…" share it
  const key = url.origin + url.pathname;
  const saved = await cache.match(key);
  // "no-cache" asks the server whether the file changed, so an old copy in the
  // phone's browser cache can never pair a new page with last week's styles
  const fresh = fetch(new Request(req, { cache: "no-cache" })).then((res) => {
    if (res.ok && res.type === "basic") cache.put(key, res.clone());
    return res;
  });
  event.waitUntil(fresh.then(() => {}, () => {}));
  // With a saved copy, don't make people wait long for a slow network
  if (saved) {
    const timeout = new Promise((resolve) => setTimeout(() => resolve(saved), NETWORK_WAIT));
    return Promise.race([fresh.catch(() => saved), timeout]);
  }
  try { return await fresh; }
  catch (e) {
    if (req.mode === "navigate") return (await cache.match("offline.html")) || Response.error();
    return Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(LIBS);
  const saved = await cache.match(req);
  if (saved) return saved;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(event, req) {
  const cache = await caches.open(LIBS);
  const saved = await cache.match(req);
  // The page asks for the font list in "no-cors" mode, so the reply is opaque (unreadable, status 0).
  // It still works as a stylesheet, so save it anyway, or offline pages lose the fonts.
  const fresh = fetch(req).then((res) => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; });
  event.waitUntil(fresh.then(() => {}, () => {}));
  return saved || fresh;
}
