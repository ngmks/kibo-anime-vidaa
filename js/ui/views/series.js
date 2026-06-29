/* ============================================================
   series.js — fiche détail d'une série + liste des épisodes
   ============================================================ */

import { h, poster, placeholder } from "../components.js";
import * as meta from "../../data/metadata-provider.js";
import { navigate } from "../../core/router.js";
import { inWatchlist, toggleWatchlist, getResume } from "../../core/storage.js";

export default async function series(params, mount) {
  const id = params.id;
  mount.appendChild(h("div.placeholder", { text: "Chargement…" }));

  let anime, eps;
  try {
    [anime, eps] = await Promise.all([meta.details(id), meta.episodes(id)]);
  } catch (e) {
    mount.innerHTML = "";
    mount.appendChild(placeholder("Impossible de charger cette série."));
    console.error(e);
    return;
  }
  mount.innerHTML = "";

  // Fond flou (banner ou poster)
  mount.appendChild(h("div.series-hero", { style: `background-image:url("${anime.banner || anime.poster}")` }));

  const resume = getResume(id);
  const startEp = resume?.ep || 1;
  const playLabel = resume ? `Reprendre · Ép. ${resume.ep}` : "Lecture";

  // Bouton watchlist (libellé dynamique)
  const wlBtn = h("button.btn", {
    "data-focusable": "1",
    text: inWatchlist(id) ? "✓ Dans ma liste" : "+ Ma liste",
    onclick: () => {
      const added = toggleWatchlist(anime);
      wlBtn.textContent = added ? "✓ Dans ma liste" : "+ Ma liste";
    },
  });

  const meta_line = [
    anime.year, anime.episodes ? `${anime.episodes} ép.` : null,
    anime.score ? `★ ${anime.score}/100` : null, anime.genres.slice(0, 3).join(" · "),
  ].filter(Boolean).join("   ");

  // Grille d'épisodes
  const epGrid = h("div.episodes", { "data-scroll": "y" }, eps.map((ep) =>
    h("div.episode" + (resume && ep.number < resume.ep ? ".watched" : ""), {
      "data-focusable": "1", text: String(ep.number),
      onclick: () => navigate(`#/watch/${id}/${ep.number}`),
    })
  ));

  const info = h("div.series-info", {}, [
    h("div.series-title", { text: anime.title }),
    h("div.series-meta", { text: meta_line }),
    h("div.series-synopsis", { text: anime.description || "Pas de synopsis disponible." }),
    h("div.series-actions", {}, [
      h("button.btn.btn-primary", {
        "data-focusable": "1", "data-focus-default": "1", text: "▶ " + playLabel,
        onclick: () => navigate(`#/watch/${id}/${startEp}`),
      }),
      wlBtn,
    ]),
    h("div.rail-title", { text: "Épisodes", style: "font-size:2rem" }),
    epGrid,
  ]);

  mount.appendChild(h("div.series", {}, [poster(anime.poster, "series-poster"), info]));
}
