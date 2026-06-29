/* ============================================================
   storage.js — persistance locale (watchlist, historique, reprise)
   Stockage : localStorage (disponible dans le Chromium de Vidaa).
   Tout est encapsulé pour pouvoir changer de backend plus tard.
   ============================================================ */

const NS = "kibo:";
const K_WATCHLIST = NS + "watchlist";
const K_HISTORY   = NS + "history";

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { console.warn("storage write failed", e); }
}

/* ---------- Watchlist (liste « à voir ») ---------- */
// Chaque entrée : { id, title, poster }
export function getWatchlist() { return read(K_WATCHLIST, []); }

export function inWatchlist(id) {
  return getWatchlist().some((a) => String(a.id) === String(id));
}

export function toggleWatchlist(anime) {
  const list = getWatchlist();
  const idx = list.findIndex((a) => String(a.id) === String(anime.id));
  if (idx >= 0) list.splice(idx, 1);
  else list.unshift({ id: anime.id, title: anime.title, poster: anime.poster });
  write(K_WATCHLIST, list);
  return idx < 0; // true si ajouté
}

/* ---------- Historique / reprise de lecture ----------
   history = { [animeId]: { title, poster, ep, positionSec, durationSec, updatedAt } } */
export function getHistory() { return read(K_HISTORY, {}); }

/** Liste triée par récence pour la rangée « Reprendre ». */
export function getContinueWatching() {
  const h = getHistory();
  return Object.entries(h)
    .map(([id, v]) => ({ id, ...v }))
    .filter((v) => v.positionSec > 5 && (!v.durationSec || v.positionSec < v.durationSec * 0.97))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getResume(animeId) {
  return getHistory()[String(animeId)] || null;
}

export function saveProgress(anime, ep, positionSec, durationSec) {
  const h = getHistory();
  h[String(anime.id)] = {
    title: anime.title,
    poster: anime.poster,
    ep,
    positionSec: Math.floor(positionSec),
    durationSec: Math.floor(durationSec || 0),
    updatedAt: Date.now(),
  };
  write(K_HISTORY, h);
}
