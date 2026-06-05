# Bar Ops — Rapport licences des dépendances

**Date du rapport** : 2026-06-05
**Version analysée** : 1.5.149
**Outil** : `license-checker` (analyse récursive de toutes les dépendances directes et transitives de `node_modules/`)

---

## Synthèse

| Licence | Nombre | Catégorie | Risque |
|---|---|---|---|
| MIT | 318 | Permissive | ✅ Aucun |
| ISC | 61 | Permissive | ✅ Aucun |
| Apache-2.0 | 26 | Permissive (avec clause brevet) | ✅ Aucun |
| BSD-2-Clause | 10 | Permissive | ✅ Aucun |
| BlueOak-1.0.0 | 7 | Permissive | ✅ Aucun |
| BSD-3-Clause | 6 | Permissive | ✅ Aucun |
| LGPL-3.0-or-later | 1 | Copyleft faible | ⚠️ Analyse spécifique — voir ci-dessous |
| Python-2.0 | 1 | Permissive | ✅ Aucun |
| WTFPL | 3 | Permissive (très libre) | ✅ Aucun |
| 0BSD | 1 | Permissive | ✅ Aucun |
| MIT OR CC0-1.0 | 1 | Permissive | ✅ Aucun |
| WTFPL OR MIT | 1 | Permissive | ✅ Aucun |
| UNLICENSED | 1 | Notre propre app | ✅ N/A |
| **Total** | **437** | | |

**Verdict global** : aucune licence ne contamine la nature propriétaire de Bar Ops.

---

## Analyse de la seule dépendance en LGPL

### Identifiant
`@img/sharp-libvips-darwin-arm64@1.2.4` — binaire natif **libvips**

### Chaîne de dépendance
`bar-ops` (devDependency) → `sharp@^0.34.4` → `@img/sharp-libvips-darwin-arm64@1.2.4`

### Évaluation juridique

La LGPL-3.0 est une licence "copyleft faible". Elle impose la diffusion en source uniquement si l'on **modifie** la bibliothèque concernée ou si on la **linke statiquement**. Dans le cas présent :

1. **Linkage dynamique uniquement** — `sharp` est un wrapper Node.js qui appelle libvips via FFI (Foreign Function Interface). Aucun code libvips n'est compilé statiquement dans Bar Ops.
2. **Aucune modification** de libvips n'est effectuée par Bar Ops.
3. **Pas de redistribution du binaire libvips** dans l'application finale — `sharp` n'est utilisé que par le script offline `electron/generate-final-icons.js` pour produire les icônes au moment du build. Le binaire libvips ne fait **pas** partie de l'app Electron distribuée aux utilisateurs.
4. **devDependency** uniquement — n'est jamais installée en environnement de production utilisateur.

**Conclusion** : l'usage est conforme à la LGPL-3.0 et n'impose aucune obligation de divulgation du code source de Bar Ops. La nature propriétaire de Bar Ops est préservée.

---

## Dépendances tierces principales (visibilité avocat)

| Bibliothèque | Licence | Rôle |
|---|---|---|
| electron | MIT | Framework desktop |
| electron-builder | MIT | Build/packaging desktop |
| electron-updater | MIT | Mise à jour automatique |
| electron-log | MIT | Logging |
| @supabase/supabase-js | MIT | Client base de données et auth |
| stripe | MIT | SDK paiement |
| @sendgrid/mail | MIT | SDK envoi d'emails transactionnels |
| sharp | Apache-2.0 | Manipulation d'images (offline, build only) |
| puppeteer | Apache-2.0 | Génération d'icônes (offline, build only) |

Toutes ces bibliothèques sont sous licences permissives MIT ou Apache-2.0 — compatibles avec un logiciel propriétaire.

---

## Mention dans Bar Ops

Le fichier `LICENSE` à la racine du dépôt mentionne explicitement la présence et l'usage de composants tiers sous leurs licences respectives, conformément aux exigences de transparence de chaque licence open-source utilisée.

Le modal "Mentions légales" accessible depuis la sidebar de l'application affiche également cette information aux utilisateurs finaux.

---

## Pièces jointes

- `LICENSES-REPORT.csv` — liste exhaustive des 437 dépendances avec licence, version, URL du dépôt
- `LICENSE` — licence propriétaire Bar Ops (racine du projet)

---

*Rapport généré automatiquement. Pour toute question juridique, contacter l'éditeur : Jarrige.jerome@hotmail.fr*
