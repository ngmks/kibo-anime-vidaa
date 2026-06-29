/* ============================================================
   router.js — routage par hash + pile de navigation
   Routes :
     #/home              accueil (rails)
     #/search            recherche
     #/library           watchlist + reprise
     #/series/:id        fiche série
     #/watch/:id/:ep     lecture (gérée hors #app par le lecteur)
   ============================================================ */

import { focusFirst } from "./spatial-nav.js";

const routes = [];
let appEl = null;
let currentCleanup = null;
const stack = [];           // historique des hash visités

export function register(pattern, handler) {
  // pattern type "/series/:id" -> regex + noms de params
  const names = [];
  const regex = new RegExp(
    "^#" + pattern.replace(/:[^/]+/g, (m) => { names.push(m.slice(1)); return "([^/]+)"; }) + "$"
  );
  routes.push({ regex, names, handler });
}

function parse(hash) {
  for (const r of routes) {
    const m = hash.match(r.regex);
    if (m) {
      const params = {};
      r.names.forEach((n, i) => (params[n] = decodeURIComponent(m[i + 1])));
      return { handler: r.handler, params };
    }
  }
  return null;
}

/** Navigue vers une nouvelle route (empile). */
export function navigate(hash) {
  if (location.hash !== hash) location.hash = hash;
}

/** Retour arrière : dépile et revient ; à la racine, quitte l'app. */
export function back() {
  if (stack.length > 1) {
    stack.pop();                      // route courante
    const prev = stack.pop();         // précédente (sera ré-empilée par resolve)
    navigate(prev);
  } else if (currentHash() === "#/home") {
    // Sortie à la racine. Sur projecteur Vidaa (PX3 Pro) l'app tourne dans le
    // navigateur (méthode signet) : Hisense_Exit() ferme proprement ; sinon
    // window.close() (ignoré sur desktop, sans effet).
    try {
      if (typeof window.Hisense_Exit === "function") window.Hisense_Exit();
      else window.close();
    } catch {}
  } else {
    navigate("#/home");
  }
}

async function resolve() {
  const hash = location.hash || "#/home";
  const match = parse(hash);
  if (!match) return navigate("#/home");

  // Nettoyage de la vue précédente
  if (typeof currentCleanup === "function") { try { currentCleanup(); } catch {} }
  currentCleanup = null;

  // Empile (en évitant les doublons consécutifs)
  if (stack[stack.length - 1] !== hash) stack.push(hash);

  // Routes « lecteur » : ne touchent pas #app
  if (match.handler.isOverlay) {
    currentCleanup = await match.handler(match.params);
    return;
  }

  appEl.innerHTML = "";
  const result = await match.handler(match.params, appEl);
  currentCleanup = typeof result === "function" ? result : null;
  focusFirst(appEl);
}

export function start(container) {
  appEl = container;
  window.addEventListener("hashchange", resolve);
  window.addEventListener("navback", back);   // BACK global -> retour routeur
  if (!location.hash) location.hash = "#/home";
  else resolve();
}

export function currentHash() { return location.hash || "#/home"; }
