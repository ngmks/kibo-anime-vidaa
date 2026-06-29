/* ============================================================
   sw.js — Service Worker (méthode signet Vidaa)
   Objectif : lancement quasi instantané depuis un favori du
   navigateur TV, et résilience réseau, en mettant en cache la
   coquille de l'app (HTML/CSS/JS/vendor) au premier chargement.
   ------------------------------------------------------------
   Stratégie :
   - same-origin GET  -> stale-while-revalidate (cache rapide + maj en fond)
   - cross-origin     -> réseau direct (AniList, posters, flux HLS)
   ============================================================ */

const CACHE = "kibo-shell-v1";

// Pré-cache minimal ; le reste (modules JS) est capté au vol par le fetch.
const PRECACHE = ["./", "./index.html", "./manifest.json",
  "./css/base.css", "./css/components.css", "./vendor/hls.min.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const sameOrigin = new URL(req.url).origin === self.location.origin;
  if (!sameOrigin) return; // API / posters / flux : on laisse passer au réseau

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached);          // hors-ligne : on retombe sur le cache
      return cached || network;        // cache d'abord, sinon réseau
    })
  );
});
