/* ============================================================
   watch.js — route de lecture (#/watch/:id/:ep)
   C'est une route "overlay" : elle ne rend rien dans #app,
   elle pilote le lecteur global. Retourne un cleanup (stop).
   ============================================================ */

import * as meta from "../../data/metadata-provider.js";
import { getStreams } from "../../data/source-provider.js";
import { getResume } from "../../core/storage.js";
import { play, stop } from "../player.js";
import { back } from "../../core/router.js";

async function watch(params) {
  const id = params.id;
  const ep = Number(params.ep) || 1;

  let anime, streams;
  try {
    anime = await meta.details(id);
    streams = await getStreams(anime, ep);
  } catch (e) {
    console.error("watch: échec résolution", e);
    back();
    return () => {};
  }

  // Position de reprise si on relance le même épisode
  const r = getResume(id);
  const resumeFrom = r && r.ep === ep ? r.positionSec : 0;

  play({
    anime, ep, streams, resumeFrom,
    onExit: () => back(),     // retour à la fiche série
  });

  // Cleanup appelé si le routeur change de route
  return () => stop();
}

// Marqueur lu par le routeur pour ne pas vider #app
watch.isOverlay = true;
export default watch;
