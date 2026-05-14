#!/bin/bash
# Bar Ops — Script d'installation
# Usage: bash ~/Downloads/install.sh

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      Installation de BAR OPS         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Trouver le ZIP de Bar Ops dans Downloads
ZIP=$(find ~/Downloads -name "Bar Ops-arm64*.zip" -maxdepth 2 | head -1)

if [ -z "$ZIP" ]; then
  echo "❌ Fichier Bar Ops-arm64.zip introuvable dans ~/Downloads"
  echo "   Télécharge-le depuis https://github.com/SPECTRE888/bar-ops/releases"
  exit 1
fi

echo "📦 Extraction de $ZIP..."
TMPDIR=$(mktemp -d)
unzip -q "$ZIP" -d "$TMPDIR"

echo "🔓 Autorisation macOS..."
xattr -cr "$TMPDIR/Bar Ops.app"

echo "📂 Installation dans Applications..."
rm -rf "/Applications/Bar Ops.app"
cp -r "$TMPDIR/Bar Ops.app" "/Applications/"

rm -rf "$TMPDIR"

echo ""
echo "✅ Bar Ops est installé !"
echo ""
sleep 1
open "/Applications/Bar Ops.app"
