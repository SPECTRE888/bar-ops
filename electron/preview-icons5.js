const sharp = require('sharp')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const icons = {
  // M: BO ligaturé, le O encercle le B, trait doré fin sur noir
  'preview-M.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d4b47a"/>
        <stop offset="100%" stop-color="#c4a46b"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- Grand cercle O -->
    <circle cx="512" cy="512" r="310" fill="none" stroke="url(#gold)" stroke-width="28"/>
    <!-- B centré dans le O, léger décalage gauche pour équilibre visuel -->
    <text x="498" y="620" font-family="Georgia, 'Times New Roman', serif" font-weight="400" font-size="420" fill="url(#gold)" text-anchor="middle">B</text>
  </svg>`,

  // N: BO en serif condensé, superposés en diagonale, très graphique
  'preview-N.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#d4b47a"/>
        <stop offset="100%" stop-color="#b8924a"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- O en fond, grand, léger -->
    <text x="600" y="720" font-family="Georgia, serif" font-weight="300" font-size="580" fill="url(#gold)" text-anchor="middle" opacity="0.18">O</text>
    <!-- B devant, plus petit, décalé haut-gauche -->
    <text x="420" y="620" font-family="Georgia, serif" font-weight="600" font-size="480" fill="url(#gold)" text-anchor="middle">B</text>
    <!-- Trait diagonal accent -->
    <line x1="680" y1="260" x2="760" y2="180" stroke="url(#gold)" stroke-width="12" stroke-linecap="round" opacity="0.6"/>
  </svg>`,

  // O: monogramme BO dans un carré rotaté 45° (losange), serif fin, très luxe
  'preview-O.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d4b47a"/>
        <stop offset="100%" stop-color="#c4a46b"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- Losange fin -->
    <polygon points="512,148 864,512 512,876 160,512" fill="none" stroke="url(#gold)" stroke-width="10"/>
    <!-- Second losange intérieur très fin -->
    <polygon points="512,220 792,512 512,804 232,512" fill="none" stroke="url(#gold)" stroke-width="3" opacity="0.3"/>
    <!-- BO centré, serif léger -->
    <text x="512" y="572" font-family="Georgia, 'Times New Roman', serif" font-weight="300" font-size="260" fill="url(#gold)" text-anchor="middle" letter-spacing="-8">BO</text>
  </svg>`,

  // P: B et O côte à côte, trait doré sous le O qui devient le pied du verre
  'preview-P.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d4b47a"/>
        <stop offset="100%" stop-color="#c4a46b"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- Trait fin haut et bas encadrant -->
    <line x1="180" y1="200" x2="844" y2="200" stroke="url(#gold)" stroke-width="3" opacity="0.4"/>
    <line x1="180" y1="824" x2="844" y2="824" stroke="url(#gold)" stroke-width="3" opacity="0.4"/>
    <!-- BO centré, très grand, serif -->
    <text x="512" y="680" font-family="Georgia, 'Times New Roman', serif" font-weight="400" font-size="460" fill="url(#gold)" text-anchor="middle" letter-spacing="-20">BO</text>
    <!-- Point décoratif entre B et O -->
    <circle cx="512" cy="390" r="12" fill="url(#gold)" opacity="0.7"/>
  </svg>`,
}

async function run() {
  for (const [filename, svg] of Object.entries(icons)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, filename))
    console.log('✓', filename)
  }
}

run().catch(console.error)
