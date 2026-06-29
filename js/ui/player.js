/* ============================================================
   player.js — lecteur vidéo HLS/MP4 piloté au D-pad
   ------------------------------------------------------------
   - Réutilise le <video> global (#video) et la couche #player-layer.
   - HLS.js si dispo, sinon lecture native (Safari/Vidaa natif HLS).
   - Touches reçues via l'événement 'player-key' (cf. spatial-nav).
   - Sauvegarde la position de lecture pour la reprise.
   ============================================================ */

import { saveProgress } from "../core/storage.js";

const layer = () => document.getElementById("player-layer");
const video = () => document.getElementById("video");
const uiBox = () => document.getElementById("player-ui");

let hls = null;
let saveTimer = null;
let uiTimer = null;
let ctx = null;        // { anime, ep, onExit }

function fmt(t) {
  if (!isFinite(t)) return "0:00";
  const s = Math.floor(t % 60), m = Math.floor(t / 60) % 60, h = Math.floor(t / 3600);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return (h ? h + ":" : "") + mm + ":" + String(s).padStart(2, "0");
}

function renderUI() {
  const v = video();
  uiBox().innerHTML = `
    <div class="pl-title">${ctx?.anime?.title || ""} ${ctx?.ep ? "· Ép. " + ctx.ep : ""}</div>
    <div class="pl-bar"><div class="pl-progress" style="width:${v.duration ? (v.currentTime / v.duration) * 100 : 0}%"></div></div>
    <div class="pl-time">${fmt(v.currentTime)} / ${fmt(v.duration)} ${v.paused ? "⏸" : "▶"}</div>`;
}

function flashUI() {
  uiBox().classList.add("show");
  renderUI();
  clearTimeout(uiTimer);
  uiTimer = setTimeout(() => uiBox().classList.remove("show"), 3500);
}

function spinner(on) {
  const existing = layer().querySelector(".pl-spinner");
  if (on && !existing) layer().appendChild(Object.assign(document.createElement("div"), { className: "pl-spinner" }));
  else if (!on && existing) existing.remove();
}

function persist() {
  const v = video();
  if (ctx && v.currentTime > 0) saveProgress(ctx.anime, ctx.ep, v.currentTime, v.duration);
}

/* ---------- Entrée touches lecteur ---------- */
function onPlayerKey(e) {
  const v = video();
  switch (e.detail) {
    case "OK": case "PLAYPAUSE":
      v.paused ? v.play() : v.pause(); flashUI(); break;
    case "RIGHT": case "FWD":
      v.currentTime = Math.min((v.duration || 1e9), v.currentTime + 10); flashUI(); break;
    case "LEFT": case "REW":
      v.currentTime = Math.max(0, v.currentTime - 10); flashUI(); break;
    case "UP": case "DOWN":
      flashUI(); break;
    case "PLAY":  v.play(); flashUI(); break;
    case "PAUSE": v.pause(); flashUI(); break;
    case "BACK": case "STOP":
      stop(); break;
  }
}

/* ---------- API ---------- */

/**
 * Démarre la lecture.
 * @param {{anime:object, ep:number, streams:Array, resumeFrom?:number, onExit:Function}} options
 */
export function play({ anime, ep, streams, resumeFrom = 0, onExit }) {
  if (!streams || !streams.length) { onExit?.(); return; }
  ctx = { anime, ep, onExit };
  const src = streams[0];                 // on prend le 1er flux fourni par le SourceProvider
  const v = video();

  document.body.dataset.mode = "player";
  layer().classList.remove("hidden");
  spinner(true);

  // Chargement selon le type
  if (src.type === "hls" && window.Hls && window.Hls.isSupported()) {
    hls = new window.Hls({ enableWorker: true, lowLatencyMode: false });
    hls.loadSource(src.url);
    hls.attachMedia(v);
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => v.play());
    hls.on(window.Hls.Events.ERROR, (_, data) => { if (data.fatal) console.error("HLS fatal", data); });
  } else {
    // HLS natif (Vidaa/Safari) ou MP4
    v.src = src.url;
    v.play();
  }

  // Reprise
  const seekWhenReady = () => {
    if (resumeFrom > 0 && isFinite(v.duration)) { v.currentTime = resumeFrom; }
    v.removeEventListener("loadedmetadata", seekWhenReady);
  };
  v.addEventListener("loadedmetadata", seekWhenReady);

  // Événements média
  v.addEventListener("waiting", () => spinner(true));
  v.addEventListener("playing", () => { spinner(false); flashUI(); });
  v.addEventListener("timeupdate", () => { if (uiBox().classList.contains("show")) renderUI(); });
  v.addEventListener("ended", () => stop());

  window.addEventListener("player-key", onPlayerKey);
  saveTimer = setInterval(persist, 5000);  // sauvegarde périodique
  flashUI();
}

export function stop() {
  persist();
  clearInterval(saveTimer); clearTimeout(uiTimer);
  window.removeEventListener("player-key", onPlayerKey);

  const v = video();
  v.pause();
  if (hls) { hls.destroy(); hls = null; }
  v.removeAttribute("src"); v.load();

  layer().classList.add("hidden");
  uiBox().classList.remove("show");
  spinner(false);
  delete document.body.dataset.mode;

  const exit = ctx?.onExit;
  ctx = null;
  exit?.();
}
