# Kibo Anime — Vidaa OS (Hisense PX3 Pro / Vidaa U9)

Clone de l'app **Kibo Anime** sous forme d'**application web HTML5/CSS/JS vanilla**
optimisée TV (navigation D-pad), destinée au moteur Chromium embarqué de Vidaa OS.

> ⚠️ **Source vidéo** : l'app n'embarque **aucun scraper**. Les flux sont fournis par
> `js/data/source-provider.js` (stub de démonstration HLS par défaut, **à remplacer par
> votre propre source légale**). Les métadonnées proviennent de l'API publique **AniList**.

## Démarrage (PC de dev)

```bash
python3 tools/dev-server.py        # écoute sur 0.0.0.0:8080
```

- Test sur le PC : http://localhost:8080/
- Test sur la TV : http://IP-DU-PC:8080/ (l'URL exacte s'affiche au lancement)

Navigation au clavier (mappée comme la télécommande) : **flèches** = D-pad,
**Entrée** = OK, **Retour/Échap** = BACK, **Espace** = play/pause.

## 🚀 Installation sur la PX3 Pro (méthode SIGNET — la seule qui marche)

> **App en ligne : https://ngmks.github.io/kibo-anime-vidaa/**

Les projecteurs Hisense (PX3-Pro, M2 Pro, C2…) **ignorent l'installation par launcher**
(`Hisense_installApp` retourne un succès mais aucune icône n'apparaît — limite firmware,
confirmée sur firmware `V1000.09.02D.P0926`). `hisense://debug`, le code DevKit
`27753790` et la séquence menu développeur sont également **inopérants** sur cet appareil.

**La voie qui fonctionne = un favori dans le navigateur :**

1. Sur la TV : **Accueil → Apps → Navigateur Internet** (« Toutes les apps » s'il est masqué).
2. Aller sur **`https://ngmks.github.io/kibo-anime-vidaa/`**.
3. **Ajouter aux favoris / signets**.
4. Lancer l'app depuis les favoris (le Service Worker la met en cache → démarrage rapide).
5. Quitter : touche **Retour** depuis l'accueil (appelle `Hisense_Exit()`).

> ⚠️ `docs/PHASE0-DNS.md` (méthode DNS/launcher) est **conservé pour référence mais ne
> s'applique PAS au PX3 Pro** (launcher bloqué). Utilisez la méthode signet ci-dessus.

## Phase 0 — Relevé sur la TV (codes touches + moteur)

Objectif : confirmer (a) une voie d'installation, (b) la lecture HLS, (c) les codes
touches réels de la télécommande.

1. Lancer le serveur de dev ; sur la TV, ouvrir
   `http://IP-DU-PC:8080/tools/keycode-logger.html`.
2. Vérifier que la **vidéo HLS de démo** se lit (colonne droite).
3. Appuyer sur **toutes les touches** de la télécommande et **noter les `keyCode`**
   (flèches, OK, Retour, lecture/pause…). Reporter ces valeurs dans
   `js/core/keymap.js` (table `KEY_TABLE`) — **c'est le seul fichier à ajuster**.
4. Tester l'installation de l'app (URL `http://IP-DU-PC:8080/`) dans cet ordre,
   garder la 1ʳᵉ qui marche :
   - `hisense://debug` dans le navigateur de la TV → saisir Nom + URL → Install
   - app **VIDAA DevKit** → App Manager → App URL
   - redirection **DNS de `vidaahub.com`** vers un serveur local (méthode Stremio)
   - repli : usage direct via le **navigateur web intégré** de la TV

## Architecture

| Couche | Fichiers | Rôle |
|---|---|---|
| Entrée | `index.html`, `js/main.js` | bootstrap, splash, `<video>` global |
| Core | `js/core/keymap.js` | codes touches → actions sémantiques |
| | `js/core/spatial-nav.js` | focus D-pad géométrique, défilement, BACK |
| | `js/core/router.js` | routage par hash + pile de navigation |
| | `js/core/storage.js` | watchlist / historique / reprise (localStorage) |
| Données | `js/data/metadata-provider.js` | AniList (catalogue, recherche, détails) |
| | `js/data/source-provider.js` | **interface source vidéo (à remplir)** |
| UI | `js/ui/components.js` | helpers DOM + carte / rail / topbar |
| | `js/ui/views/*.js` | accueil, recherche, série, bibliothèque, lecture |
| | `js/ui/player.js` | lecteur HLS.js + contrôles D-pad |
| Vendor | `vendor/hls.min.js` | lecture HLS |
| Outils | `tools/dev-server.py`, `tools/keycode-logger.html` | dev + Phase 0 |

## État

MVP fonctionnel et vérifié en Chromium (1920×1080) : catalogue (tendances/saison/
populaires), recherche (clavier virtuel), fiche série + épisodes, lecteur HLS,
watchlist + reprise, navigation D-pad complète. Plan détaillé :
`~/.claude/plans/fancy-whistling-cray.md`.

### Reste à faire
- Phase 0 sur la TV (codes touches + voie d'installation).
- Brancher une source vidéo réelle dans `source-provider.js`.
- Ajouter les icônes `assets/icon-small.png` (256²) et `assets/icon-large.png` (512²).
