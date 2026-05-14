#!/bin/bash

echo ""
echo "╔════════════════════════════════════╗"
echo "║      Installation de Bar Ops       ║"
echo "╚════════════════════════════════════╝"
echo ""

APP_NAME="Bar Ops.app"
INSTALL_DIR="/Applications"

# Trouver le .app dans le même dossier que ce script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_PATH="$SCRIPT_DIR/$APP_NAME"

if [ ! -d "$APP_PATH" ]; then
  echo "❌ Impossible de trouver '$APP_NAME' à côté de ce script."
  echo "   Assure-toi d'avoir extrait le ZIP et de lancer install.sh depuis le même dossier."
  echo ""
  read -p "Appuie sur Entrée pour quitter..."
  exit 1
fi

echo "📦 Copie de Bar Ops dans Applications..."
cp -r "$APP_PATH" "$INSTALL_DIR/"

echo "🔓 Suppression de la quarantaine macOS..."
xattr -cr "$INSTALL_DIR/$APP_NAME"

echo ""
echo "✅ Bar Ops est installé !"
echo ""
read -p "Appuie sur Entrée pour lancer l'app..."
open "$INSTALL_DIR/$APP_NAME"
