/* ============================================================
   keymap.js — traduction des codes touches télécommande -> actions
   ------------------------------------------------------------
   IMPORTANT (Phase 0) : les codes ci-dessous sont les valeurs
   smart-TV standards. Les VALEURS RÉELLES de la télécommande
   du PX3 Pro doivent être confirmées via tools/keycode-logger.html
   puis ajustées ici si besoin. C'est le SEUL fichier à toucher.
   ============================================================ */

// Action sémantique -> liste de keyCode possibles
const KEY_TABLE = {
  LEFT:  [37],
  UP:    [38],
  RIGHT: [39],
  DOWN:  [40],
  OK:    [13],            // Entrée / OK
  BACK:  [8, 27, 461],    // Retour : varie selon firmware Vidaa
  PLAY:  [415],
  PAUSE: [19],
  PLAYPAUSE: [179, 463],
  STOP:  [413],
  FWD:   [417],
  REW:   [412],
  // Touches couleur Vidaa (optionnel, utile plus tard)
  RED: [403], GREEN: [404], YELLOW: [405], BLUE: [406],
};

// Construit l'index inverse keyCode -> action une seule fois
const CODE_TO_ACTION = {};
for (const [action, codes] of Object.entries(KEY_TABLE)) {
  for (const code of codes) CODE_TO_ACTION[code] = action;
}

/**
 * Retourne l'action sémantique associée à un KeyboardEvent, ou null.
 * Tolère aussi event.key pour les tests au clavier desktop.
 */
export function actionFor(event) {
  const byCode = CODE_TO_ACTION[event.keyCode];
  if (byCode) return byCode;

  // Repli desktop : flèches/Enter/Backspace/Escape via event.key
  switch (event.key) {
    case "ArrowLeft":  return "LEFT";
    case "ArrowUp":    return "UP";
    case "ArrowRight": return "RIGHT";
    case "ArrowDown":  return "DOWN";
    case "Enter":      return "OK";
    case "Backspace":
    case "Escape":     return "BACK";
    case " ":          return "PLAYPAUSE";
    default:           return null;
  }
}

export const KEYS = Object.keys(KEY_TABLE);
