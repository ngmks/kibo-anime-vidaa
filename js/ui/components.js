/* ============================================================
   components.js — helpers DOM + briques d'UI réutilisables
   ============================================================ */

import { navigate } from "../core/router.js";

/** Fabrique d'élément concise : h("div.card", {onclick}, [enfants|texte]) */
export function h(tagSel, props = {}, children = []) {
  const [tag, ...classes] = tagSel.split(".");
  const el = document.createElement(tag || "div");
  if (classes.length) el.className = classes.join(" ");
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === "onclick") el.addEventListener("click", v);
    else if (k === "html") el.innerHTML = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("data-") || k === "src" || k === "href" || k === "id")
      el.setAttribute(k, v);
    else el[k] = v;
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

/** Image avec chargement paresseux et repli si l'URL casse. */
export function poster(src, cls = "card-poster") {
  const img = h("img." + cls, { loading: "lazy", alt: "" });
  img.src = src || "";
  img.addEventListener("error", () => { img.classList.add("skeleton"); img.removeAttribute("src"); });
  return img;
}

/** Carte anime focalisable -> ouvre la fiche série au clic/OK. */
export function card(anime) {
  return h("div.card", {
    "data-focusable": "1",
    onclick: () => navigate(`#/series/${anime.id}`),
  }, [
    poster(anime.poster),
    h("div.card-title", { text: anime.title }),
  ]);
}

/** Rangée horizontale défilante de cartes. */
export function rail(title, animeList) {
  const track = h("div.rail-track", { "data-scroll": "x" }, animeList.map(card));
  return h("div.rail", {}, [
    h("div.rail-title", { text: title }),
    track,
  ]);
}

/** Barre supérieure avec navigation entre sections. */
export function topbar(activeKey) {
  const items = [
    { key: "home", label: "Accueil", hash: "#/home" },
    { key: "search", label: "Recherche", hash: "#/search" },
    { key: "library", label: "Ma liste", hash: "#/library" },
  ];
  return h("div.topbar", {}, [
    h("div.brand", { html: 'KIBO<span>ANIME</span>' }),
    h("nav.nav", {}, items.map((it) =>
      h("div.nav-item" + (it.key === activeKey ? ".active" : ""), {
        "data-focusable": "1",
        onclick: () => navigate(it.hash),
        text: it.label,
      })
    )),
  ]);
}

/** Bloc de message centré (vide / erreur). */
export function placeholder(text) {
  return h("div.placeholder", { text });
}
