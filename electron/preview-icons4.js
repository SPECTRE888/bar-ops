const sharp = require('sharp')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const icons = {
  // J: V martini ultra-épuré, un seul trait continu, très fin
  'preview-J.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- V martini: deux lignes qui se rejoignent, tige, base -->
    <polyline points="200,280 512,620 824,280" fill="none" stroke="#c4a46b" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="512" y1="620" x2="512" y2="780" stroke="#c4a46b" stroke-width="36" stroke-linecap="round"/>
    <line x1="380" y1="780" x2="644" y2="780" stroke="#c4a46b" stroke-width="36" stroke-linecap="round"/>
  </svg>`,

  // K: shaker incliné 30°, une seule forme géométrique, comme un logo sportif
  'preview-K.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#d4b47a"/>
        <stop offset="100%" stop-color="#c4a46b"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- Shaker incliné: forme géométrique solide -->
    <g transform="rotate(-25, 512, 512)">
      <!-- Corps principal -->
      <rect x="432" y="230" width="160" height="340" rx="22" fill="url(#gold)"/>
      <!-- Cap -->
      <rect x="448" y="196" width="128" height="42" rx="12" fill="#d4b47a"/>
      <!-- Bec -->
      <rect x="500" y="172" width="24" height="30" rx="6" fill="#d4b47a"/>
      <!-- Bas conique -->
      <path d="M432,570 L592,570 L558,700 L466,700 Z" fill="url(#gold)"/>
      <!-- Rainures -->
      <line x1="432" y1="370" x2="592" y2="370" stroke="#080808" stroke-width="14" opacity="0.4"/>
      <line x1="432" y1="420" x2="592" y2="420" stroke="#080808" stroke-width="14" opacity="0.4"/>
    </g>
  </svg>`,

  // L: B intégré dans silhouette verre — la courbe du B forme le corps du verre
  'preview-L.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d4b47a"/>
        <stop offset="100%" stop-color="#b8924a"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- Forme custom: B dont la colonne verticale gauche est la tige du verre,
         et les deux bosses sont les côtés du verre martini -->
    <!-- Tige verticale gauche du B = tige du verre -->
    <line x1="340" y1="200" x2="340" y2="760" stroke="url(#gold)" stroke-width="44" stroke-linecap="round"/>
    <!-- Bord supérieur du verre = bosse haute du B -->
    <!-- Arc haut: de la tige vers la droite, mi-hauteur -->
    <path d="M340,200 L700,200 Q820,200 820,350 Q820,500 340,500" fill="none" stroke="url(#gold)" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Arc bas: de la tige vers la droite, bas -->
    <path d="M340,500 L660,500 Q800,500 800,640 Q800,780 340,760" fill="none" stroke="url(#gold)" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Base du verre sous la tige -->
    <line x1="240" y1="760" x2="440" y2="760" stroke="url(#gold)" stroke-width="44" stroke-linecap="round"/>
  </svg>`,
}

async function run() {
  for (const [filename, svg] of Object.entries(icons)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, filename))
    console.log('✓', filename)
  }
}

run().catch(console.error)
