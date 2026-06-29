/* ============================================================
   library.js — « Ma liste » : watchlist + reprise
   ============================================================ */

import { h, card, topbar, placeholder } from "../components.js";
import { getWatchlist, getContinueWatching } from "../../core/storage.js";
import { navigate } from "../../core/router.js";

export default async function library(_params, mount) {
  const root = h("div", {}, [topbar("library")]);
  mount.appendChild(root);

  const scroller = h("div", { "data-scroll": "y", style: "max-height:82vh" });
  root.appendChild(scroller);

  const cont = getContinueWatching();
  const list = getWatchlist();

  if (cont.length) {
    const cards = cont.map((v) => {
      const c = card({ id: v.id, title: v.title, poster: v.poster });
      c.onclick = null;
      c.addEventListener("click", () => navigate(`#/watch/${v.id}/${v.ep}`));
      return c;
    });
    scroller.appendChild(h("div.rail", {}, [
      h("div.rail-title", { text: "Reprendre la lecture" }),
      h("div.rail-track", { "data-scroll": "x" }, cards),
    ]));
  }

  scroller.appendChild(h("div.rail-title", { text: "À voir", style: "margin-top:2rem" }));
  if (list.length) {
    scroller.appendChild(h("div.grid", {}, list.map(card)));
  } else {
    scroller.appendChild(placeholder("Votre liste est vide. Ouvrez une série et ajoutez-la à « Ma liste »."));
  }
}
