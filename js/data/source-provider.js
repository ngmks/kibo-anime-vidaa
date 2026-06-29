/* ============================================================
   source-provider.js — POINT D'EXTENSION UTILISATEUR (source vidéo)
   ------------------------------------------------------------
   C'est le SEUL module qui produit une URL de flux lisible par le
   lecteur. L'app n'embarque AUCUN scraper de sites tiers.

   CONTRAT à respecter :
     getStreams(anime, episodeNumber)
       -> Promise<Array<{ quality, url, type, headers? }>>
          quality : "1080p" | "720p" | ... (libellé affiché)
          url     : URL du flux
          type    : "hls" (m3u8) | "mp4"
          headers : (optionnel) en-têtes requis par la source

   Le lecteur choisit le premier élément de la liste par défaut.
   ------------------------------------------------------------
   Implémentation par défaut = FLUX DE DÉMONSTRATION HLS PUBLIC,
   pour valider le lecteur légalement. Remplacez `getStreams`
   par votre propre logique de résolution de flux.
   ============================================================ */

// Flux HLS de démonstration libres d'accès (Mux / Apple), pour tests.
const DEMO_STREAMS = [
  { quality: "Auto", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "hls" },
  { quality: "VOD",  url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8", type: "hls" },
];

/**
 * Résout les flux lisibles pour un épisode donné.
 * @param {object} anime  objet anime normalisé (id, title, ...)
 * @param {number} episodeNumber
 * @returns {Promise<Array<{quality,url,type,headers?}>>}
 */
export async function getStreams(anime, episodeNumber) {
  // --- REMPLACER ICI par votre logique de source ---
  // Exemple de squelette :
  //   const res = await fetch(`https://votre-source/api?anime=${anime.id}&ep=${episodeNumber}`);
  //   const data = await res.json();
  //   return data.sources.map(s => ({ quality: s.label, url: s.file, type: s.hls ? "hls" : "mp4" }));

  // Par défaut : démo (ignore l'épisode), pour tester le lecteur.
  void anime; void episodeNumber;
  return DEMO_STREAMS;
}

/** Indique si la source par défaut (démo) est encore active. */
export function isDemoSource() { return true; }
