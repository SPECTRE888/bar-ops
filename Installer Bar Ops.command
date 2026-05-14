#!/bin/bash

clear
echo "╔══════════════════════════════════════╗"
echo "║      Installation de BAR OPS         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Trouver Bar Ops.app dans le même dossier
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_SRC="$SCRIPT_DIR/Bar Ops.app"
APP_DEST="/Applications/Bar Ops.app"

if [ ! -d "$APP_SRC" ]; then
  echo "❌ Bar Ops.app introuvable."
  echo "   Assure-toi que Bar Ops.app est dans le même dossier que ce fichier."
  echo ""
  read -p "Appuie sur Entrée pour quitter..."
  exit 1
fi

echo "📦 Installation en cours..."
cp -r "$APP_SRC" "$APP_DEST"

echo "🔓 Autorisation macOS..."
xattr -cr "$APP_DEST"

echo ""
echo "✅ Bar Ops est installé !"
echo "   Lancement en cours..."
echo ""
sleep 1
open "$APP_DEST"
