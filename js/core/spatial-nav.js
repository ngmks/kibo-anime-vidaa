/* ============================================================
   spatial-nav.js — moteur de focus D-pad (vanilla, géométrique)
   ------------------------------------------------------------
   - Les éléments navigables portent l'attribut [data-focusable].
   - Les directions choisissent le meilleur candidat par géométrie
     (centres des rectangles + pénalité d'axe croisé).
   - OK déclenche un clic sur l'élément focalisé (les vues utilisent onclick).
   - BACK émet un événement global 'navback' (géré par le routeur).
   - Le défilement se fait en translatant l'ancêtre [data-scroll].
   ============================================================ */

import { actionFor } from "./keymap.js";

let current = null;                 // élément actuellement focalisé
const backHandlers = [];            // pile de handlers BACK (vue courante en haut)

/* ---------- Utilitaires géométrie ---------- */
function center(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
}
function isVisible(el) {
  if (el.offsetParent === null && getComputedStyle(el).position !== "fixed") return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}
function focusables() {
  return Array.from(document.querySelectorAll("[data-focusable]")).filter(isVisible);
}

/** Score de proximité d'un candidat dans une direction (plus petit = meilleur). */
function score(from, cand, dir) {
  const a = center(from), b = center(cand);
  const dx = b.x - a.x, dy = b.y - a.y;
  const TOL = 1;
  switch (dir) {
    case "LEFT":  return dx < -TOL ? Math.abs(dx) + Math.abs(dy) * 2 : Infinity;
    case "RIGHT": return dx >  TOL ? Math.abs(dx) + Math.abs(dy) * 2 : Infinity;
    case "UP":    return dy < -TOL ? Math.abs(dy) + Math.abs(dx) * 2 : Infinity;
    case "DOWN":  return dy >  TOL ? Math.abs(dy) + Math.abs(dx) * 2 : Infinity;
    default:      return Infinity;
  }
}

/* ---------- Défilement du conteneur (rail/grille) ---------- */
function ensureVisible(el) {
  const scroller = el.closest("[data-scroll]");
  if (!scroller) return;
  const axis = scroller.getAttribute("data-scroll"); // "x" ou "y"
  const sr = scroller.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  // Décalage actuel encodé dans une variable CSS pour rester cumulatif
  const prev = parseFloat(scroller.dataset.offset || "0");

  if (axis === "x") {
    const margin = sr.width * 0.15;
    let delta = 0;
    if (er.left < sr.left + margin) delta = sr.left + margin - er.left;
    else if (er.right > sr.right - margin) delta = sr.right - margin - er.right;
    if (delta) {
      const next = prev + delta;
      scroller.dataset.offset = next;
      scroller.style.transform = `translateX(${next}px)`;
    }
  } else if (axis === "y") {
    const margin = sr.height * 0.2;
    let delta = 0;
    if (er.top < sr.top + margin) delta = sr.top + margin - er.top;
    else if (er.bottom > sr.bottom - margin) delta = sr.bottom - margin - er.bottom;
    if (delta) {
      const next = prev + delta;
      scroller.dataset.offset = next;
      scroller.style.transform = `translateY(${next}px)`;
    }
  }
}

/* ---------- API focus ---------- */
export function setFocus(el) {
  if (!el || el === current) { if (el) ensureVisible(el); return; }
  if (current) current.classList.remove("focused");
  current = el;
  current.classList.add("focused");
  ensureVisible(current);
  current.dispatchEvent(new CustomEvent("navfocus", { bubbles: true }));
}

/** Focalise le premier élément navigable (préférence à [data-focus-default]). */
export function focusFirst(root = document) {
  const pref = root.querySelector("[data-focus-default]");
  if (pref && isVisible(pref)) return setFocus(pref);
  const list = focusables();
  if (list.length) setFocus(list[0]);
}

function move(dir) {
  if (!current) return focusFirst();
  let best = null, bestScore = Infinity;
  for (const cand of focusables()) {
    if (cand === current) continue;
    const s = score(current, cand, dir);
    if (s < bestScore) { bestScore = s; best = cand; }
  }
  if (best) setFocus(best);
}

/* ---------- Gestion du BACK (pile par vue) ---------- */
export function pushBack(handler) { backHandlers.push(handler); }
export function popBack() { backHandlers.pop(); }
function handleBack() {
  const h = backHandlers[backHandlers.length - 1];
  if (h) h();
  else window.dispatchEvent(new CustomEvent("navback"));
}

/* ---------- Boucle d'entrée ---------- */
function onKey(event) {
  const action = actionFor(event);
  if (!action) return;
  event.preventDefault();

  // Si le lecteur est actif, il intercepte les touches lui-même.
  if (document.body.dataset.mode === "player") {
    window.dispatchEvent(new CustomEvent("player-key", { detail: action }));
    return;
  }

  switch (action) {
    case "LEFT": case "RIGHT": case "UP": case "DOWN":
      move(action); break;
    case "OK":
      if (current) current.click(); break;
    case "BACK":
      handleBack(); break;
  }
}

export function init() {
  document.addEventListener("keydown", onKey);
}

export function getCurrent() { return current; }
