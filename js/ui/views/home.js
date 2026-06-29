/* ============================================================
   home.js — vue d'accueil : rangées (rails) de catalogue
   ============================================================ */

import { h, rail, card, topbar, placeholder } from "../components.js";
import * as meta from "../../data/metadata-provider.js";
import { getContinueWatching } from "../../core/storage.js";
import { navigate } from "../../core/router.js";

export default async function home(_params, mount) {
  const root = h("div", {}, [topbar("home")]);
  mount.appendChild(root);

  // Conteneur scrollable verticalement (rails empilés)
  const scroller = h("div", { "data-scroll": "y", style: "max-height:82vh" });
  root.appendChild(scroller);
  scroller.appendChild(h("div.placeholder", { text: "Chargement…" }));

  // Reprise (depuis le stockage local) — synchrone, sans réseau
  const cont = getContinueWatching();

  // Récupération en parallèle, mais TOLÉRANTE AUX PANNES : on affiche les rails
  // qui réussissent même si l'un échoue (réseau TV capricieux). Cf. allSettled.
  const [trend, season, pop] = await Promise.allSettled([
    meta.trending(),
    meta.seasonal(),
    meta.popular(),
  ]);

  scroller.innerHTML = "";

  if (cont.length) {
    // Rangée « Reprendre » : clic -> reprise directe de l'épisode
    const resumeCards = cont.map((v) => {
      const c = card({ id: v.id, title: v.title, poster: v.poster });
      c.onclick = null;
      c.addEventListener("click", () => navigate(`#/watch/${v.id}/${v.ep}`));
      return c;
    });
    scroller.appendChild(
      h("div.rail", {}, [
        h("div.rail-title", { text: "Reprendre" }),
        h("div.rail-track", { "data-scroll": "x" }, resumeCards),
      ])
    );
  }

  // Ajoute un rail uniquement si sa requête a abouti et renvoyé des éléments
  const addRail = (title, settled) => {
    if (settled.status === "fulfilled" && settled.value?.length) {
      scroller.appendChild(rail(title, settled.value));
    } else if (settled.status === "rejected") {
      console.error(`Rail « ${title} » indisponible`, settled.reason);
    }
  };
  addRail("Tendances", trend);
  addRail("Cette saison", season);
  addRail("Populaires", pop);

  // Aucun rail chargé ET aucune reprise -> message d'erreur global
  if (!scroller.children.length) {
    scroller.appendChild(placeholder("Impossible de charger le catalogue. Vérifiez la connexion réseau de la TV."));
  }
}
