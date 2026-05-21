# CHECKPOINT — Processus de release Bar Ops

> ⚠️ NE PAS DÉVIER DE CE PROCESSUS. Il a été validé et fonctionne.

---

## 1. Artefacts produits par le build CI

electron-builder génère ces fichiers dans `dist/` (noms **sans espace**, grâce à `artifactName` dans package.json) :

| Fichier | Usage |
|---|---|
| `BarOps-X.Y.Z-arm64-mac.zip` | **Auto-updater** (requis pour les mises à jour silencieuses) |
| `BarOps-X.Y.Z-arm64-mac.zip.blockmap` | Blockmap du zip |
| `BarOps-X.Y.Z-arm64.dmg` | Installation initiale (drag & drop) |
| `BarOps-X.Y.Z-arm64.dmg.blockmap` | Blockmap du DMG |
| `BarOps-X.Y.Z-Installer.pkg` | Installeur natif macOS (avec PKG assistant) |
| `latest-mac.yml` | Manifest version |

> ⚠️ **Règle critique** : les noms de fichiers ne doivent PAS contenir d'espaces.  
> Le `productName` est "Bar Ops" (avec espace) mais `artifactName` dans package.json  
> force `BarOps-...` (sans espace) pour que `gh release create` fonctionne.

---

## 2. Auto-updater (main.js)

Le mécanisme dans `electron/main.js` :
1. Appelle `https://api.github.com/repos/SPECTRE888/bar-ops/releases/latest`
2. Compare `tag_name` avec `app.getVersion()`
3. Cherche l'asset par pattern : `/arm64-mac\.zip$/` (sans `.blockmap`)
4. Télécharge le zip dans un dossier temp
5. Lance un script bash détaché qui : attend l'arrêt de l'app, unzip, signe, remplace, relance

**Pour que l'update fonctionne**, le ZIP doit impérativement être dans la release GitHub.  
Si le ZIP est absent → toast "téléchargement" mais RIEN après (erreur silencieuse).

---

## 3. Processus de release (à suivre exactement)

### Étape 1 — Incrémenter la version
Dans `package.json` uniquement (pas d'autre endroit) :
```json
"version": "1.X.Y"
```

### Étape 2 — Commit + push
```bash
git add .
git commit -m "description des changements"
git push origin main
```

### Étape 3 — Tagger (déclenche le build CI)
```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```
Le tag doit correspondre exactement à la version dans package.json : `v1.5.8` pour `"version": "1.5.8"`.

### Étape 4 — Vérifier le CI
Sur https://github.com/SPECTRE888/bar-ops/actions :
- ✅ "Build Electron app" — doit passer
- ✅ "List dist output" — doit montrer les fichiers BarOps-*.zip et BarOps-*.dmg
- ✅ "Build PKG installer" — doit créer BarOps-*-Installer.pkg
- ✅ "Create release & upload assets" — doit afficher "✅ Found" pour chaque fichier

### Étape 5 — Vérifier la release GitHub
Sur https://github.com/SPECTRE888/bar-ops/releases :
- Le ZIP `BarOps-X.Y.Z-arm64-mac.zip` doit être présent
- Sans ce fichier = auto-updater cassé

---

## 4. Règles immuables

| ✅ À faire | ❌ À ne jamais faire |
|---|---|
| `artifactName` avec `BarOps-` (sans espace) | Mettre des espaces dans les noms d'artefacts |
| Tagger APRÈS avoir poussé le commit | Tagger avant le push |
| Vérifier le CI avant de déclarer "ça marche" | Changer le format des noms de fichiers sans mettre à jour build.yml ET main.js |
| `gh release create` avec tableau `FILES[@]` | Hardcoder des noms de fichiers avec espaces dans gh release create |
| Version dans `package.json` = tag git (sans `v`) | Décalage version/tag |

---

## 5. Configuration clé (package.json)

```json
"build": {
  "artifactName": "BarOps-${version}-${arch}-mac.${ext}",  // ← sans espace !
  "productName": "Bar Ops",  // ← l'app garde son vrai nom
  ...
}
```

---

## 6. En cas de problème

**"téléchargement" puis rien** → Le ZIP n'est pas dans la release. Vérifier le CI.  
**"no matches found for dist/Bar Ops-..."** → Nom avec espace dans build.yml. Utiliser `BarOps-` sans espace.  
**SyntaxError: Unexpected end of input** → check-access renvoie JSON invalide. Géré par try/catch dans app.html.  
**Fonts ERR_FILE_NOT_FOUND** → Vérifier que les polices chargent depuis Google CDN (pas fichiers locaux).
