# Phase 0 — Installer Kibo Anime sur la PX3 Pro via la méthode DNS

Guide pas-à-pas pour installer l'app sur Vidaa U9 en détournant `vidaahub.com`
vers un serveur local (méthode dérivée de `Stremio/stremio-hisense-install` et
`trialuser/vidaa-appstore`). C'est la voie la plus robuste sur firmware récent.

> 💡 **Essayez d'abord le plus simple.** Avant tout ce dispositif, testez sur la TV :
> ouvrez le navigateur Vidaa, tapez `hisense://debug`, saisissez un Nom + l'URL de
> l'app (`http://IP-DU-PC:8080/`) → Install. Si ça marche, **inutile de faire le DNS.**
> Le DNS n'est nécessaire que si `hisense://debug` a été retiré de votre firmware.

---

## ⚠️ À lire en premier : vous êtes sous WSL2

Le serveur de cette méthode fait office de **serveur DNS sur le port 53 (UDP)**, et la
TV doit pouvoir le **joindre sur le réseau local**. Or :

- Une IP WSL2 (`172.x.x.x`) **n'est pas routable** depuis la TV : la TV ne voit que
  l'IP **Windows** de votre PC.
- `netsh portproxy` de Windows **ne redirige que le TCP**, pas l'UDP → il **ne peut pas**
  relayer le DNS (UDP/53) vers WSL2.

**Conséquence : le serveur DNS doit tourner directement sous Windows** (ou sur un autre
appareil du réseau, type Raspberry Pi), **pas dans WSL2.**

➡️ **Recommandation** : exécuter `vidaa-appstore` **nativement sous Windows**
(Python pour Windows). WSL2 peut rester votre poste de dev pour le code ; seul le
serveur d'installation doit être côté Windows.

---

## Pré-requis

- PC (Windows) et TV sur le **même réseau** (idéalement Ethernet pour le PC).
- **Python 3.8+** installé sous Windows.
- Module Python : `dnslib` → `pip install dnslib`
  (⚠️ n'installez **pas** un paquet `ssl` : le module `ssl` est déjà inclus dans Python.)
- Droits **administrateur** (le DNS écoute sur le port 53).
- Connaître l'**IP locale de votre PC** Windows : `ipconfig` → « Adresse IPv4 »
  (ex. `192.168.1.20`).

---

## Étape A — Récupérer l'outil d'installation

Sous Windows (PowerShell) :

```powershell
git clone https://github.com/trialuser/vidaa-appstore
cd vidaa-appstore
pip install dnslib
```

Les certificats auto-signés pour `vidaahub.com` sont déjà fournis dans `ssl/`.

---

## Étape B — Configurer `config.json`

Ouvrez `config.json` et réglez (remplacez l'IP par celle de votre PC Windows) :

```json
{
  "server_address": "192.168.1.20",
  "enable_dns_server": true,
  "enable_https_server": true,
  "enable_http_server": true,
  "https_port": 8443,
  "dns_records": [
    { "hostname": "vidaahub.com", "type": "A", "address": "192.168.1.20" }
  ]
}
```

(Les noms exacts des clés peuvent varier légèrement selon la version du dépôt ;
gardez le principe : `server_address` + l'enregistrement A `vidaahub.com → IP du PC`.)

---

## Étape C — Déclarer Kibo Anime dans la liste d'apps

Éditez `index-en.html` et ajoutez notre app au tableau `apps` :

```javascript
var apps = [
  { category: 'my', appid: 'kibo_anime', name: 'Kibo Anime',
    url: 'http://192.168.1.20:8080/', text: 'Kibo Anime (Vidaa)' }
];
```

Le champ `url` est l'adresse **où l'app est hébergée** (voir Étape D).

---

## Étape D — Héberger l'app à une URL stable

⚠️ **Point clé** : une fois installée, la TV **relance l'app depuis son `url`** à chaque
ouverture (DNS déjà restauré). Cette URL doit donc rester joignable.

Trois options, du plus simple au plus pérenne :

1. **Serveur de dev sur Windows (test rapide)** — copiez le dossier du projet sous
   Windows et lancez `python tools\dev-server.py`. L'app est à `http://IP-WINDOWS:8080/`.
   ✅ Simple. ❌ Ne marche que PC allumé + même réseau.

2. **Hébergement statique gratuit (recommandé pour un usage quotidien)** — l'app est
   100 % statique : déployez le dossier sur **Cloudflare Pages**, **GitHub Pages** ou
   **Netlify**. Vous obtenez une URL HTTPS permanente (ex. `https://kibo-xxx.pages.dev/`)
   à mettre dans le champ `url`. ✅ Toujours disponible, HTTPS.
   ⚠️ Vérifiez que les **flux de votre `source-provider.js`** sont aussi joignables
   depuis la TV (et en HTTPS si l'app est en HTTPS, sinon contenu mixte bloqué).

3. **Petit appareil toujours allumé** (Raspberry Pi sur le LAN) servant `dev-server.py`.

---

## Étape E — Lancer le serveur d'installation

Dans une PowerShell **Administrateur**, depuis `vidaa-appstore` :

```powershell
python server.py
```

Laissez-le tourner. Si l'option 1 (serveur de dev) est choisie, lancez **aussi**
`python tools\dev-server.py` dans une autre fenêtre.

> Si le port 53 est déjà pris : désactivez temporairement « Partage de connexion
> Internet » / un éventuel serveur DNS local, ou changez d'appareil hôte.

---

## Étape F — Côté TV (PX3 Pro)

1. **Réglages réseau** de la TV → **DNS** → mode manuel → saisir l'**IP de votre PC**
   (`192.168.1.20`) comme serveur DNS. Valider.
2. Ouvrir le **navigateur** de la TV → aller sur **`https://vidaahub.com/`**.
3. Un **avertissement de certificat** (auto-signé) apparaît → **accepter / continuer**.
4. La liste d'apps locale s'affiche → cliquer **Install** en face de **Kibo Anime**.
5. L'app est ajoutée dans **Mes applications** (en fin de liste).

---

## Étape G — Restaurer le DNS (important)

Une fois l'installation faite :

1. Réglages réseau de la TV → **DNS** → repasser en **automatique** (ou DNS d'origine).
2. **Redémarrer** la TV.
3. Lancer **Kibo Anime** depuis Mes applications. Elle charge directement son `url`.

> Tant que le DNS reste détourné, la TV ne joindra plus le vrai `vidaahub.com` :
> ne laissez pas ce réglage en place.

---

## Désinstallation

- Bouton **Uninstall** dans l'app store local (`https://vidaahub.com/`, DNS de nouveau
  détourné), **ou**
- depuis une page de debug : `Hisense_uninstallApp('kibo_anime')`.

---

## Dépannage

| Symptôme | Piste |
|---|---|
| `https://vidaahub.com/` n'ouvre pas la liste locale | DNS TV mal réglé, ou serveur DNS pas lancé en admin / bloqué (UDP 53). Vérifier que c'est bien sous **Windows**, pas WSL2. |
| Page blanche au lancement de l'app | Moteur trop ancien : voir la **sonde** de `tools/keycode-logger.html` (UA + `?.`, `??`, modules ES). Si une sonde échoue, transpiler l'app. |
| L'app se lance puis se fige | URL `url` injoignable (PC éteint / mauvais réseau / mixte HTTP-HTTPS). Préférer l'hébergement statique HTTPS. |
| La touche Retour ne quitte pas | Géré : BACK à l'accueil appelle `window.close()` (cf. `js/core/router.js`). |
| Pare-feu Windows | Autoriser Python sur les ports **53 (UDP)**, **80**, **443/8443**, **8080**. |

---

## Récapitulatif des inconnues à confirmer en Phase 0

1. ✅/❌ `hisense://debug` encore présent ? (si oui, ignorer ce guide)
2. ✅/❌ Lecture HLS OK (page de test)
3. 📝 Codes touches réels → reporter dans `js/core/keymap.js`
4. 📝 Résultat des sondes moteur (UA + fonctionnalités JS)
