/* ============================================================
   search.js — recherche avec clavier virtuel (navigation D-pad)
   ============================================================ */

import { h, card, topbar, placeholder } from "../components.js";
import * as meta from "../../data/metadata-provider.js";

const ROWS = [
  "ABCDEFGHIJ".split(""),
  "KLMNOPQRST".split(""),
  "UVWXYZ0123".split(""),
  "456789".split(""),
];

export default async function search(_params, mount) {
  let query = "";
  let timer = null;

  const root = h("div", {}, [topbar("search")]);
  mount.appendChild(root);

  const box = h("div.search-box");
  const results = h("div.grid");
  const status = h("div.placeholder", { text: "Saisissez un titre…" });

  function renderBox() {
    box.innerHTML = "";
    box.appendChild(document.createTextNode(query || "Rechercher"));
    box.appendChild(h("span.caret", { text: "▌" }));
  }
  renderBox();

  function setQuery(next) {
    query = next;
    renderBox();
    clearTimeout(timer);
    timer = setTimeout(runSearch, 350);  // anti-rebond : évite une requête par touche
  }

  async function runSearch() {
    if (!query.trim()) { results.innerHTML = ""; status.textContent = "Saisissez un titre…"; return; }
    status.textContent = "Recherche…";
    try {
      const list = await meta.search(query);
      results.innerHTML = "";
      if (!list.length) { status.textContent = "Aucun résultat."; return; }
      status.textContent = "";
      list.forEach((a) => results.appendChild(card(a)));
    } catch (e) {
      status.textContent = "Erreur réseau pendant la recherche.";
      console.error(e);
    }
  }

  // Clavier virtuel
  const keyboard = h("div.keyboard");
  for (const row of ROWS) {
    for (const ch of row) {
      keyboard.appendChild(h("div.key", {
        "data-focusable": "1", text: ch,
        onclick: () => setQuery(query + ch),
      }));
    }
  }
  keyboard.appendChild(h("div.key.wide", { "data-focusable": "1", text: "ESPACE", onclick: () => setQuery(query + " ") }));
  keyboard.appendChild(h("div.key.wide", { "data-focusable": "1", text: "⌫ EFF.", onclick: () => setQuery(query.slice(0, -1)) }));

  // La première touche est le point de focus par défaut
  keyboard.firstChild.setAttribute("data-focus-default", "1");

  root.appendChild(h("div.search", {}, [
    box,
    keyboard,
    status,
    h("div", { "data-scroll": "y", style: "max-height:34vh" }, [results]),
  ]));
}
