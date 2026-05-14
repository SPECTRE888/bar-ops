const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const icons = {
  // Option A: fond noir, cercle doré, shaker stylisé
  'preview-A.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0d0d0d"/>
        <stop offset="100%" stop-color="#1a1a1a"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f5d060"/>
        <stop offset="100%" stop-color="#c8860a"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>
    <!-- Cercle doré -->
    <circle cx="512" cy="440" r="240" fill="none" stroke="url(#gold)" stroke-width="22"/>
    <!-- Shaker: corps -->
    <rect x="452" y="260" width="120" height="220" rx="14" fill="url(#gold)"/>
    <!-- Shaker: bas conique -->
    <polygon points="452,480 572,480 542,590 482,590" fill="url(#gold)"/>
    <!-- Shaker: cap -->
    <rect x="462" y="238" width="100" height="30" rx="8" fill="#f5d060"/>
    <!-- Lignes décoratives shaker -->
    <line x1="452" y1="340" x2="572" y2="340" stroke="#0d0d0d" stroke-width="10"/>
    <line x1="452" y1="380" x2="572" y2="380" stroke="#0d0d0d" stroke-width="10"/>
    <!-- Texte -->
    <text x="512" y="900" font-family="Georgia, serif" font-weight="700" font-size="88" fill="url(#gold)" text-anchor="middle" letter-spacing="12">BAR OPS</text>
  </svg>`,

  // Option B: fond bordeaux/rouge foncé, lettre B stylisée dans un losange
  'preview-B.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2d0a0a"/>
        <stop offset="100%" stop-color="#5c1a1a"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ff6b6b"/>
        <stop offset="100%" stop-color="#ee0979"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>
    <!-- Losange décoratif -->
    <polygon points="512,120 860,440 512,760 164,440" fill="none" stroke="url(#accent)" stroke-width="18" opacity="0.6"/>
    <polygon points="512,190 790,440 512,690 234,440" fill="none" stroke="url(#accent)" stroke-width="8" opacity="0.3"/>
    <!-- Grand B centré -->
    <text x="512" y="570" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="420" fill="url(#accent)" text-anchor="middle" opacity="0.95">B</text>
    <!-- Ligne séparatrice -->
    <line x1="200" y1="800" x2="824" y2="800" stroke="url(#accent)" stroke-width="4" opacity="0.5"/>
    <!-- Texte bas -->
    <text x="512" y="920" font-family="Arial, sans-serif" font-weight="300" font-size="72" fill="#ff9999" text-anchor="middle" letter-spacing="20">OPS</text>
  </svg>`,

  // Option C: fond vert foncé, cocktail minimaliste ligne blanche, vibe premium
  'preview-C.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stop-color="#0a2a1a"/>
        <stop offset="100%" stop-color="#0d3d22"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>
    <!-- Coupe champagne stylisée (vue de face) -->
    <!-- Bord haut -->
    <ellipse cx="512" cy="280" rx="240" ry="28" fill="none" stroke="#e8f5e0" stroke-width="16" opacity="0.9"/>
    <!-- Corps coupe courbe -->
    <path d="M272,280 Q320,480 512,560 Q704,480 752,280" fill="none" stroke="#e8f5e0" stroke-width="16" opacity="0.9"/>
    <!-- Liquide / remplissage partiel -->
    <path d="M310,340 Q370,490 512,548 Q654,490 714,340 Z" fill="#2d7a3a" opacity="0.5"/>
    <!-- Bulles -->
    <circle cx="470" cy="450" r="8" fill="#e8f5e0" opacity="0.6"/>
    <circle cx="512" cy="400" r="5" fill="#e8f5e0" opacity="0.5"/>
    <circle cx="548" cy="470" r="6" fill="#e8f5e0" opacity="0.6"/>
    <circle cx="490" cy="380" r="4" fill="#e8f5e0" opacity="0.4"/>
    <!-- Tige -->
    <line x1="512" y1="560" x2="512" y2="730" stroke="#e8f5e0" stroke-width="16" opacity="0.9" stroke-linecap="round"/>
    <!-- Base -->
    <ellipse cx="512" cy="730" rx="160" ry="20" fill="none" stroke="#e8f5e0" stroke-width="16" opacity="0.9"/>
    <!-- Ligne décorative -->
    <line x1="160" y1="820" x2="864" y2="820" stroke="#4caf70" stroke-width="3" opacity="0.6"/>
    <!-- Texte -->
    <text x="512" y="930" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="200" font-size="84" fill="#e8f5e0" text-anchor="middle" letter-spacing="18">BAR OPS</text>
  </svg>`,
}

async function run() {
  for (const [filename, svg] of Object.entries(icons)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, filename))
    console.log('✓', filename)
  }
}

run().catch(console.error)
