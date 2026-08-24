# CLAUDE.md — Bar Ops

Guidance for Claude Code when working in this repository.

---

## ⚠️ Contexte — à lire avant de toucher au code

**Bar Ops est le plus gros projet personnel de Jérôme, celui qui compte le plus.** Ce n'est pas un repo jetable ou un side-project parmi d'autres — il doit fonctionner correctement, pour de vrai, pour de vrais utilisateurs payants.

Conséquences concrètes pour Claude Code :
- **Honnêteté avant tout.** Ne jamais annoncer "c'est fait" / "tout est traduit" / "ça marche" sans avoir vérifié soi-même (pas juste fait confiance au rapport d'un agent). Si un audit direct sur le fichier n'a pas été fait, dire "je ne sais pas encore" plutôt que d'affirmer.
- **Vérifier deux fois plutôt qu'une**, surtout sur les gros chantiers transverses (i18n, fusion web/Electron, etc.) où il est facile de rater des zones entières. Un seul passage de vérification a déjà donné une fausse impression de complétude sur ce repo (session i18n du 2026-08-14) — préférer un audit exhaustif (recherche systématique, pas un échantillon) avant de conclure qu'un chantier est terminé.
- Si un agent a fait le travail, relire le diff réel et faire tourner ses propres scripts de vérification — ne pas se contenter du rapport texte de l'agent.
- Signaler clairement ce qui reste hors périmètre (ex : documents légaux/devis volontairement non traduits) plutôt que de laisser croire que tout est couvert.

---

## Stack

| Couche | Techno |
|---|---|
| Frontend | Vanilla HTML/JS/CSS — fichiers uniques, zéro build |
| Auth + DB | Supabase (auth + PostgreSQL) |
| Backend | Vercel Serverless Functions (`api/`) |
| Paiement | Stripe |
| Deploy | git push `main` → auto-deploy Vercel (~30s) |
| Electron | electron-builder, auto-updater GitHub Releases |

---

## Fichiers clés

```
index.html           → Landing page + pricing (public)
auth.html            → Login/signup Google OAuth via Supabase
app.html             → Application principale (7500+ lignes, single file by design)
paying.html          → Page abonnement
electron/app/app.html→ Version Electron (même base, adaptations file://)
api/
  config.js          → Retourne la clé anon Supabase (jamais les secrets)
  agents.js          → Invite/accept/manage agents (route par body.type)
  billing.js         → Stripe portal + add-seat + subscribe (route par body.action)
  check-access.js    → Vérifie l'abonnement actif (service key, appelé par app.html)
  workspace.js       → GET=workspace-pull, POST=portal-token
  portal-public.js   → GET=portal-data, POST=portal-sign (public, no auth)
  send-quote.js      → Email devis via Brevo (webhook.js utilise SendGrid pour la confirmation d'abonnement — deux sous-traitants email distincts)
  webhook.js         → Webhook Stripe
  delete-account.js  → Suppression compte
  _rate-limit.js      → Helper rate-limiting (utilisé par agents.js, send-quote.js)
```

---

## Architecture & State

- `API_BASE = 'https://bar-ops-v2.vercel.app'` — toutes les requêtes frontend passent par là
- `state` — objet global en mémoire
- `save() / load()` — localStorage (clé `SK` par user)
- `cloudPush() / cloudPull()` — sync Supabase workspace
- `?demo=1` — mode hors-ligne, `freshState()`, banner "MODE VISUALISATION"
- Secrets réels (STRIPE_SECRET_KEY, SUPABASE_SERVICE_KEY) → **Vercel env vars uniquement, jamais dans le code**

---

## Flux Métier

```
Catalogue → Cocktails → Équipe → Clients → Fournisseurs → Événements → Devis → Paiement → Suivi → Historique
```

---

## Modèles de données

```js
Ingredient  { id, name, unit, costHT, brand, category }

Cocktail    { id, name, code, category,
              ingredients: [{ingredientId, qty, unit}],
              priceHT, vat, totalCost }

Staff       { id, name,
              type: 'Bartender'|'Serveur'|'Bar Manager'|'Manutentionnaire',
              rateHT, billHT, per: 'per hour' }   // toujours per hour

Client      { id, name, email, phone, address }

Supplier    { id, name, contact, speciality, tutoie }

Event       { id, name, date, location, clientId,
              nGuests, nBartenders, nWaiters, nManagers, nManutentionnaires,
              arrBrt, depBrt, arrWtr, depWtr, arrMgr, depMgr, arrMan, depMan,
              cocktails: [{cocktailId, qty}],
              assignedStaff: [staffId],
              deliveryCostHT, deliveryBillHT,
              status: 'planning|suivi|historique',
              paid, acompte,
              stockRetourDone,          // true = archivé dans historique
              totalRevHT                // CA canonique (remise + nb dates inclus, stocké à la sauvegarde)
            }
```

---

## Fonctions clés dans app.html

| Fonction | Rôle |
|---|---|
| `getSupabase()` | Instance client Supabase |
| `cloudRequest(path, opts)` | HTTP vers `API_BASE` |
| `cloudPush() / cloudPull()` | Sync workspace Supabase |
| `fmt(n)` | Format monétaire |
| `evStatusBadge(ev)` | Badge Devis / Confirmé / Archivé |
| `openStatusDropdown(evId, el)` | Dropdown changement statut |
| `archiveFromSuivi(evId)` | Toggle stockRetourDone (archive ↔ suivi) |
| `buildEventSummaryHTML(ev)` | Récap complet event (staff, financier) |
| `openEventHTML(evId)` | Iframe modal (pas de blob URL en Electron) |

---

## Principes de développement

1. **PATCH ONLY** — jamais réécrire un fichier complet, modifications minimales et ciblées
2. **DOUBLE PATCH OBLIGATOIRE** — toute modification de `app.html` DOIT être appliquée simultanément sur `electron/app/app.html`. Ce sont deux fichiers distincts. L'Electron app charge exclusivement `electron/app/app.html`. Ne jamais patcher l'un sans l'autre.
3. **Simplicité > richesse** — UX intuitive, pas de features fragiles
4. **Cohérence CA** — toujours utiliser `ev.totalRevHT` (valeur stockée), jamais recalculer à la volée pour l'affichage
5. **Collaborateurs** — ce mot n'apparaît QUE dans la section "Compte" de la sidebar ; partout ailleurs c'est "Équipe"

---

## Tips développement

- **Modifier app.html** → chercher les sections `/* ── EVENTS ── */`
- **Tester** → ouvrir `app.html?demo=1` dans le navigateur (offline)
- **Ajouter une fonction Vercel** → créer `api/mafonction.js`, exporter `module.exports = async function handler(req, res){...}`
- **Requêtes Supabase** → `supabase().from('table').select()`
- **Electron spécifique** → les blob URL `blob:file:///` ne fonctionnent pas, utiliser `iframe.contentDocument.write(html)` à la place

---

## Processus de release Electron

> ⚠️ NE PAS DÉVIER DE CE PROCESSUS.

### Artefacts générés par le CI (dans `dist/`)

| Fichier | Usage |
|---|---|
| `BarOps-X.Y.Z-arm64-mac.zip` | **Auto-updater** (obligatoire) |
| `BarOps-X.Y.Z-arm64-mac.zip.blockmap` | Blockmap zip |
| `BarOps-X.Y.Z-arm64.dmg` | Installation initiale |
| `BarOps-X.Y.Z-arm64.dmg.blockmap` | Blockmap DMG |
| `BarOps-X.Y.Z-Installer.pkg` | Installeur natif macOS |
| `latest-mac.yml` | Manifest version |

> ⚠️ Noms **sans espace** (`BarOps-` pas `Bar Ops-`) grâce à `artifactName` dans package.json.

### Étapes (ordre strict)

```bash
# 1. Incrémenter la version dans package.json uniquement
# 2. Commit + push
git add . && git commit -m "description" && git push origin main

# 3. Tagger (déclenche le CI)
git tag v1.X.Y && git push origin v1.X.Y
# Le tag DOIT correspondre exactement à la version dans package.json
```

### Vérifier le CI (https://github.com/SPECTRE888/bar-ops/actions)
- ✅ "Build Electron app"
- ✅ "List dist output" → montrer `BarOps-*.zip` et `BarOps-*.dmg`
- ✅ "Build PKG installer"
- ✅ "Create release & upload assets" → "✅ Found" pour chaque fichier

### Auto-updater (`electron/main.js`)
1. Appelle `https://api.github.com/repos/SPECTRE888/bar-ops/releases/latest`
2. Compare `tag_name` avec `app.getVersion()`
3. Cherche l'asset par pattern `/arm64-mac\.zip$/`
4. Télécharge → script bash détaché → unzip → signe → remplace → relance

**Si "téléchargement" puis rien** → le ZIP est absent de la release → vérifier le CI.

### Règles immuables

| ✅ Faire | ❌ Ne jamais faire |
|---|---|
| `artifactName` avec `BarOps-` (sans espace) | Espaces dans les noms d'artefacts |
| Tagger APRÈS avoir poussé le commit | Tagger avant le push |
| Vérifier le CI avant de valider | Changer les noms de fichiers sans mettre à jour `build.yml` ET `main.js` |
| **Toujours bumper `package.json` version à chaque commit** | Oublier de bumper avant de committer |

> ⚠️ **RÈGLE ABSOLUE** : À chaque commit sur ce repo, Claude doit systématiquement bumper la version dans `package.json` (patch +1) ET pousser le tag correspondant pour déclencher le build Electron. Pas d'exception.

---

## Déploiement web (Vercel)

```bash
git add .
git commit -m "v1.X.Y — description"
git push origin main   # → Vercel redéploie auto en ~30s
```

Pour voir les logs → https://vercel.com dashboard (pas GitHub Actions, pas Netlify).

---

## Contacts & URLs

- **Live web** : https://bar-ops-v2.vercel.app
- **GitHub** : https://github.com/SPECTRE888/bar-ops
- **Supabase** : https://supabase.co (dashboard)
- **Vercel** : https://vercel.com (logs, env vars)
