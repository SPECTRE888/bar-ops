const sharp = require('sharp')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const icons = {
  // D: noir, coupe cocktail ligne fine dorée (style C mais gold)
  'preview-D.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0d0d0d"/>
        <stop offset="100%" stop-color="#1c1c1c"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f5d060"/>
        <stop offset="100%" stop-color="#c8860a"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>
    <!-- Coupe coupe champagne ligne fine -->
    <ellipse cx="512" cy="265" rx="230" ry="26" fill="none" stroke="url(#gold)" stroke-width="14"/>
    <path d="M282,265 Q330,470 512,548 Q694,470 742,265" fill="none" stroke="url(#gold)" stroke-width="14"/>
    <!-- Liquide doré partiel -->
    <path d="M318,320 Q375,490 512,540 Q649,490 706,320 Z" fill="#c8860a" opacity="0.25"/>
    <!-- Bulles -->
    <circle cx="474" cy="440" r="7" fill="#f5d060" opacity="0.5"/>
    <circle cx="512" cy="390" r="5" fill="#f5d060" opacity="0.4"/>
    <circle cx="548" cy="460" r="6" fill="#f5d060" opacity="0.5"/>
    <!-- Tige -->
    <line x1="512" y1="548" x2="512" y2="720" stroke="url(#gold)" stroke-width="14" stroke-linecap="round"/>
    <!-- Base -->
    <ellipse cx="512" cy="720" rx="155" ry="18" fill="none" stroke="url(#gold)" stroke-width="14"/>
    <!-- Ligne déco -->
    <line x1="180" y1="810" x2="844" y2="810" stroke="#c8860a" stroke-width="3" opacity="0.5"/>
    <!-- Texte -->
    <text x="512" y="924" font-family="Georgia, serif" font-weight="700" font-size="84" fill="url(#gold)" text-anchor="middle" letter-spacing="14">BAR OPS</text>
  </svg>`,

  // E: noir, losange doré + initiales BO
  'preview-E.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0d0d0d"/>
        <stop offset="100%" stop-color="#1c1c1c"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f5d060"/>
        <stop offset="100%" stop-color="#c8860a"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>
    <!-- Losange extérieur -->
    <polygon points="512,130 860,430 512,730 164,430" fill="none" stroke="url(#gold)" stroke-width="16"/>
    <!-- Losange intérieur -->
    <polygon points="512,200 790,430 512,660 234,430" fill="none" stroke="url(#gold)" stroke-width="6" opacity="0.35"/>
    <!-- BO centré -->
    <text x="512" y="500" font-family="Georgia, serif" font-weight="700" font-size="260" fill="url(#gold)" text-anchor="middle">BO</text>
    <!-- Texte bas -->
    <text x="512" y="910" font-family="Georgia, serif" font-weight="400" font-size="72" fill="url(#gold)" text-anchor="middle" letter-spacing="18" opacity="0.8">BAR OPS</text>
  </svg>`,

  // F: noir profond, shaker + étoile de points discrets, typographie serif luxe
  'preview-F.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stop-color="#080808"/>
        <stop offset="100%" stop-color="#1a1a1a"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fce282"/>
        <stop offset="50%" stop-color="#d4a017"/>
        <stop offset="100%" stop-color="#a06c00"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>
    <!-- Points décoratifs constellation -->
    <circle cx="200" cy="200" r="4" fill="#f5d060" opacity="0.3"/>
    <circle cx="820" cy="180" r="3" fill="#f5d060" opacity="0.25"/>
    <circle cx="150" cy="600" r="3" fill="#f5d060" opacity="0.2"/>
    <circle cx="870" cy="700" r="4" fill="#f5d060" opacity="0.25"/>
    <circle cx="300" cy="820" r="3" fill="#f5d060" opacity="0.2"/>
    <circle cx="740" cy="840" r="3" fill="#f5d060" opacity="0.2"/>
    <!-- Trait horizontal haut -->
    <line x1="200" y1="240" x2="824" y2="240" stroke="url(#gold)" stroke-width="2" opacity="0.4"/>
    <!-- Grand texte B centré -->
    <text x="512" y="630" font-family="Georgia, serif" font-weight="700" font-size="500" fill="url(#gold)" text-anchor="middle" opacity="0.12">B</text>
    <!-- Shaker minimaliste centré -->
    <!-- Corps -->
    <rect x="462" y="270" width="100" height="200" rx="12" fill="url(#gold)"/>
    <!-- Bas conique -->
    <polygon points="462,470 562,470 536,570 488,570" fill="url(#gold)"/>
    <!-- Cap -->
    <rect x="472" y="250" width="80" height="26" rx="6" fill="#fce282"/>
    <!-- Bec verseur -->
    <rect x="500" y="234" width="24" height="20" rx="4" fill="#fce282"/>
    <!-- Lignes décoratives sur shaker -->
    <line x1="462" y1="360" x2="562" y2="360" stroke="#0d0d0d" stroke-width="8"/>
    <line x1="462" y1="400" x2="562" y2="400" stroke="#0d0d0d" stroke-width="8"/>
    <!-- Gouttes -->
    <circle cx="440" cy="520" r="5" fill="#f5d060" opacity="0.6"/>
    <circle cx="584" cy="540" r="4" fill="#f5d060" opacity="0.5"/>
    <!-- Trait horizontal bas -->
    <line x1="200" y1="780" x2="824" y2="780" stroke="url(#gold)" stroke-width="2" opacity="0.4"/>
    <!-- Texte double ligne -->
    <text x="512" y="860" font-family="Georgia, serif" font-weight="400" font-size="62" fill="url(#gold)" text-anchor="middle" letter-spacing="22">BAR OPS</text>
  </svg>`,
}

async function run() {
  for (const [filename, svg] of Object.entries(icons)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, filename))
    console.log('✓', filename)
  }
}

run().catch(console.error)
