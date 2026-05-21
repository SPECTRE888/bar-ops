#!/bin/bash
# Bar Ops — Installation automatique macOS
# Usage: curl -sL https://raw.githubusercontent.com/SPECTRE888/bar-ops/main/install.sh | bash

set -e

APP_NAME="Bar Ops"
APP_DEST="/Applications/${APP_NAME}.app"
REPO="SPECTRE888/bar-ops"
TMP=$(mktemp -d)

clear
echo ""
echo "╔══════════════════════════════════════╗"
echo "║      Installation de BAR OPS         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Récupérer la dernière release
echo "🔍 Recherche de la dernière version..."
RELEASE_JSON=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest")
VERSION=$(echo "$RELEASE_JSON" | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": *"//;s/".*//')
ZIP_URL=$(echo "$RELEASE_JSON" | grep '"browser_download_url"' | grep 'arm64-mac\.zip"' | grep -v blockmap | head -1 | sed 's/.*"browser_download_url": *"//;s/".*//')

if [ -z "$ZIP_URL" ]; then
  echo "❌ Impossible de trouver la dernière version."
  echo "   Vérifie ta connexion internet."
  rm -rf "$TMP"
  exit 1
fi

echo "📦 Téléchargement de Bar Ops ${VERSION}..."
curl -L --progress-bar -o "${TMP}/BarOps.zip" "$ZIP_URL"

# 2. Extraction
echo "📂 Extraction..."
unzip -q "${TMP}/BarOps.zip" -d "${TMP}/extract"

NEW_APP=$(find "${TMP}/extract" -maxdepth 2 -name "*.app" -type d | head -1)
if [ -z "$NEW_APP" ]; then
  echo "❌ Fichier .app introuvable dans l'archive."
  rm -rf "$TMP"
  exit 1
fi

# 3. Fermer l'ancienne version si elle tourne
if pgrep -f "${APP_NAME}" >/dev/null 2>&1; then
  echo "⏳ Fermeture de l'ancienne version..."
  pkill -f "${APP_NAME}" 2>/dev/null || true
  sleep 2
fi

# 4. Installer
echo "🚀 Installation dans /Applications..."
rm -rf "${APP_DEST}"
cp -R "${NEW_APP}" "${APP_DEST}"

# 5. Retirer la quarantaine + signature ad-hoc
echo "🔓 Autorisation macOS..."
xattr -cr "${APP_DEST}"
codesign --force --deep --sign - --timestamp=none "${APP_DEST}" 2>/dev/null || true

# 6. Nettoyage
rm -rf "$TMP"

# 7. Lancement
echo ""
echo "✅ Bar Ops ${VERSION} est installé !"
echo ""
sleep 1
open "${APP_DEST}"
