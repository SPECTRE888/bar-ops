const sharp = require('sharp')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const icons = {
  // U: O comme lune, B comme soleil couchant derrière — espace négatif dramatique
  'preview-U.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- Grand cercle doré = O -->
    <circle cx="560" cy="512" r="300" fill="#c4a46b"/>
    <!-- Cercle noir décalé = crée croissant + espace négatif B -->
    <circle cx="420" cy="512" r="300" fill="#080808"/>
    <!-- Accent: petit disque doré plein = point du i / détail signature -->
    <circle cx="695" cy="300" r="38" fill="#c4a46b"/>
  </svg>`,

  // V: B géométrique pur — 3 rectangles horizontaux + 1 vertical, style bauhaus
  'preview-V.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#d4b47a"/>
        <stop offset="100%" stop-color="#c4a46b"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- B Bauhaus: colonne + 3 barres horizontales + 2 demi-cercles -->
    <!-- Colonne verticale -->
    <rect x="240" y="200" width="80" height="624" rx="0" fill="url(#gold)"/>
    <!-- Barre haute -->
    <rect x="240" y="200" width="340" height="80" rx="0" fill="url(#gold)"/>
    <!-- Barre milieu -->
    <rect x="240" y="472" width="300" height="80" rx="0" fill="url(#gold)"/>
    <!-- Barre basse -->
    <rect x="240" y="744" width="340" height="80" rx="0" fill="url(#gold)"/>
    <!-- Demi-cercle haut -->
    <path d="M580,200 A160,272 0 0,1 580,552" fill="none" stroke="url(#gold)" stroke-width="80"/>
    <!-- Demi-cercle bas -->
    <path d="M540,472 A180,296 0 0,1 540,824" fill="none" stroke="url(#gold)" stroke-width="80"/>
    <!-- O minimaliste à droite: juste un cercle épais -->
    <circle cx="800" cy="512" r="140" fill="none" stroke="url(#gold)" stroke-width="80"/>
  </svg>`,

  // W: BO fragmenté — lettres découpées en bandes horizontales décalées
  'preview-W.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <clipPath id="band1"><rect x="0" y="160" width="1024" height="148"/></clipPath>
      <clipPath id="band2"><rect x="0" y="338" width="1024" height="148"/></clipPath>
      <clipPath id="band3"><rect x="0" y="516" width="1024" height="148"/></clipPath>
      <clipPath id="band4"><rect x="0" y="694" width="1024" height="148"/></clipPath>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- BO répété 4 fois, décalé progressivement -->
    <text x="100" y="730" font-family="Arial Black, sans-serif" font-weight="900" font-size="560" fill="#c4a46b" clip-path="url(#band1)" dx="0">BO</text>
    <text x="100" y="730" font-family="Arial Black, sans-serif" font-weight="900" font-size="560" fill="#c4a46b" clip-path="url(#band2)" dx="40">BO</text>
    <text x="100" y="730" font-family="Arial Black, sans-serif" font-weight="900" font-size="560" fill="#c4a46b" clip-path="url(#band3)" dx="-30">BO</text>
    <text x="100" y="730" font-family="Arial Black, sans-serif" font-weight="900" font-size="560" fill="#c4a46b" clip-path="url(#band4)" dx="20">BO</text>
    <!-- Lignes de séparation entre bandes -->
    <line x1="0" y1="308" x2="1024" y2="308" stroke="#080808" stroke-width="20"/>
    <line x1="0" y1="486" x2="1024" y2="486" stroke="#080808" stroke-width="20"/>
    <line x1="0" y1="664" x2="1024" y2="664" stroke="#080808" stroke-width="20"/>
  </svg>`,

  // X: O doré plein, B en contour blanc/crème qui chevauche le cercle
  'preview-X.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- Cercle doré décalé à droite -->
    <circle cx="580" cy="512" r="290" fill="#c4a46b"/>
    <!-- B en contour crème, chevauche le cercle -->
    <text x="340" y="670" font-family="Arial Black, sans-serif" font-weight="900" font-size="500" fill="none" stroke="#ede8e0" stroke-width="18" text-anchor="middle">B</text>
    <!-- B rempli noir là où il chevauche le doré (illusion) -->
    <text x="340" y="670" font-family="Arial Black, sans-serif" font-weight="900" font-size="500" fill="#080808" text-anchor="middle" opacity="0.0">B</text>
  </svg>`,
}

async function run() {
  for (const [filename, svg] of Object.entries(icons)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, filename))
    console.log('✓', filename)
  }
}

run().catch(console.error)
