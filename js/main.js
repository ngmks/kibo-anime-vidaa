/* ============================================================
   main.js — bootstrap de l'application
   Initialise la navigation D-pad, enregistre les routes,
   démarre le routeur et masque le splash.
   ============================================================ */

import * as nav from "./core/spatial-nav.js";
import * as router from "./core/router.js";

import home from "./ui/views/home.js";
import search from "./ui/views/search.js";
import library from "./ui/views/library.js";
import series from "./ui/views/series.js";
import watch from "./ui/views/watch.js";

function boot() {
  // 1) Moteur de focus / clavier télécommande
  nav.init();

  // 2) Routes
  router.register("/home", home);
  router.register("/search", search);
  router.register("/library", library);
  router.register("/series/:id", series);
  router.register("/watch/:id/:ep", watch);

  // 3) Démarrage du routeur sur le conteneur principal
  router.start(document.getElementById("app"));

  // 4) Service Worker (méthode signet : cache + lancement rapide sur projecteur).
  //    Nécessite un contexte sécurisé (HTTPS ou localhost) ; ignoré sinon.
  if ("serviceWorker" in navigator) {
    // chemin relatif -> fonctionne aussi sous un sous-dossier (GitHub Pages)
    navigator.serviceWorker.register(new URL("../sw.js", import.meta.url))
      .catch((e) => console.warn("SW non enregistré:", e));
  }

  // 5) Disparition du splash
  const splash = document.getElementById("splash");
  setTimeout(() => {
    splash.classList.add("fade");
    setTimeout(() => splash.classList.add("hidden"), 250);
  }, 400);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
