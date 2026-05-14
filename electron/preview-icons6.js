const sharp = require('sharp')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const icons = {
  // Q: B coupé net par une ligne diagonale dorée, le O complète en négatif
  'preview-Q.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#d4b47a"/>
        <stop offset="100%" stop-color="#c4a46b"/>
      </linearGradient>
      <clipPath id="left">
        <polygon points="0,0 540,0 540,1024 0,1024"/>
      </clipPath>
      <clipPath id="right">
        <polygon points="540,0 1024,0 1024,1024 540,1024"/>
      </clipPath>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- B gauche, coupé net au milieu -->
    <text x="200" y="680" font-family="Arial Black, sans-serif" font-weight="900" font-size="580" fill="#c4a46b" clip-path="url(#left)">BO</text>
    <!-- Même BO mais doré clair sur fond doré, côté droit -->
    <rect x="540" y="0" width="484" height="1024" fill="#c4a46b" clip-path="url(#right)"/>
    <text x="200" y="680" font-family="Arial Black, sans-serif" font-weight="900" font-size="580" fill="#080808" clip-path="url(#right)">BO</text>
    <!-- Ligne de coupe -->
    <line x1="540" y1="0" x2="540" y2="1024" stroke="#080808" stroke-width="6"/>
  </svg>`,

  // R: O géométrique avec B en espace négatif à l'intérieur
  'preview-R.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- Grand disque doré -->
    <circle cx="512" cy="490" r="330" fill="#c4a46b"/>
    <!-- B en espace négatif (couleur fond) -->
    <text x="490" y="660" font-family="Arial Black, sans-serif" font-weight="900" font-size="420" fill="#080808" text-anchor="middle">B</text>
    <!-- Petit arc en bas du disque = sourire / détail -->
    <path d="M340,750 Q512,820 684,750" fill="none" stroke="#080808" stroke-width="10" opacity="0.3"/>
  </svg>`,

  // S: B et O fusionnés — le O est un cercle, le B partage sa colonne avec le bord gauche du O
  'preview-S.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d4b47a"/>
        <stop offset="100%" stop-color="#b8924a"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- Colonne verticale commune B+O -->
    <rect x="260" y="210" width="52" height="604" rx="26" fill="url(#gold)"/>
    <!-- Bosse haute du B -->
    <path d="M312,210 Q560,210 560,422 Q560,634 312,634" fill="none" stroke="url(#gold)" stroke-width="52" stroke-linecap="round"/>
    <!-- Cercle O (partage la colonne gauche) -->
    <circle cx="660" cy="512" r="220" fill="none" stroke="url(#gold)" stroke-width="52"/>
    <!-- Jonction: ligne horizontale entre B et O -->
    <line x1="560" y1="422" x2="440" y2="422" stroke="url(#gold)" stroke-width="52" stroke-linecap="round"/>
  </svg>`,

  // T: BO en négatif sur fond doré avec texture diagonal subtile
  'preview-T.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e0c080"/>
        <stop offset="50%" stop-color="#c4a46b"/>
        <stop offset="100%" stop-color="#a8863a"/>
      </linearGradient>
      <pattern id="lines" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="40" stroke="#080808" stroke-width="1.5" opacity="0.12"/>
      </pattern>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="url(#gold)"/>
    <!-- Texture diagonale subtile -->
    <rect width="1024" height="1024" rx="180" fill="url(#lines)"/>
    <!-- BO en négatif, sans-serif bold -->
    <text x="512" y="660" font-family="Arial Black, 'Helvetica Neue', sans-serif" font-weight="900" font-size="430" fill="#080808" text-anchor="middle" letter-spacing="-20">BO</text>
  </svg>`,
}

async function run() {
  for (const [filename, svg] of Object.entries(icons)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, filename))
    console.log('✓', filename)
  }
}

run().catch(console.error)
