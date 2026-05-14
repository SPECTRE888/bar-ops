const sharp = require('sharp')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

// Exact colors from the site
// --bg: #080808, --gold: #c4a46b, --gold2: #d4b47a, --text: #ede8e0

const icons = {
  // G: verre martini ligne ultra-fine, épuré, typographie Cormorant style
  'preview-G.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- Verre martini minimaliste, centré haut -->
    <!-- Bord supérieur (trait horizontal) -->
    <line x1="240" y1="248" x2="784" y2="248" stroke="#c4a46b" stroke-width="10" stroke-linecap="round"/>
    <!-- Côté gauche -->
    <line x1="240" y1="248" x2="512" y2="570" stroke="#c4a46b" stroke-width="10" stroke-linecap="round"/>
    <!-- Côté droit -->
    <line x1="784" y1="248" x2="512" y2="570" stroke="#c4a46b" stroke-width="10" stroke-linecap="round"/>
    <!-- Tige -->
    <line x1="512" y1="570" x2="512" y2="720" stroke="#c4a46b" stroke-width="10" stroke-linecap="round"/>
    <!-- Base -->
    <line x1="390" y1="720" x2="634" y2="720" stroke="#c4a46b" stroke-width="10" stroke-linecap="round"/>
    <!-- Olive discrète -->
    <circle cx="512" cy="380" r="22" fill="none" stroke="#c4a46b" stroke-width="8"/>
    <circle cx="512" cy="380" r="8" fill="#c4a46b"/>
    <!-- Pic olive -->
    <line x1="512" y1="248" x2="512" y2="358" stroke="#c4a46b" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
    <!-- Séparateur -->
    <line x1="300" y1="790" x2="724" y2="790" stroke="#c4a46b" stroke-width="1" opacity="0.4"/>
    <!-- Texte Cormorant style: léger, espacé -->
    <text x="512" y="888" font-family="Georgia, 'Times New Roman', serif" font-weight="300" font-size="70" fill="#c4a46b" text-anchor="middle" letter-spacing="22">BAR OPS</text>
  </svg>`,

  // H: fond noir, typographie dominante Cormorant, trait décoratif doré minimal
  'preview-H.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- Trait fin haut -->
    <line x1="140" y1="220" x2="884" y2="220" stroke="#c4a46b" stroke-width="1" opacity="0.5"/>
    <!-- Grand B serif en gold très léger watermark -->
    <text x="512" y="660" font-family="Georgia, serif" font-weight="400" font-size="580" fill="#c4a46b" text-anchor="middle" opacity="0.06">B</text>
    <!-- Texte principal grand -->
    <text x="512" y="480" font-family="Georgia, 'Times New Roman', serif" font-weight="300" font-size="148" fill="#c4a46b" text-anchor="middle" letter-spacing="8">BAR</text>
    <!-- Trait entre les deux -->
    <line x1="340" y1="530" x2="684" y2="530" stroke="#c4a46b" stroke-width="1" opacity="0.6"/>
    <!-- OPS plus petit, espacé -->
    <text x="512" y="640" font-family="Georgia, 'Times New Roman', serif" font-weight="300" font-size="88" fill="#c4a46b" text-anchor="middle" letter-spacing="38" opacity="0.9">OPS</text>
    <!-- Trait fin bas -->
    <line x1="140" y1="804" x2="884" y2="804" stroke="#c4a46b" stroke-width="1" opacity="0.5"/>
    <!-- Tagline très fine -->
    <text x="512" y="880" font-family="Georgia, serif" font-weight="300" font-size="34" fill="#ede8e0" text-anchor="middle" letter-spacing="12" opacity="0.4">EVENT MANAGEMENT</text>
  </svg>`,

  // I: noir, verre champagne coupe + monogramme BO superposé, très premium
  'preview-I.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d4b47a"/>
        <stop offset="100%" stop-color="#c4a46b"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- Cercle extérieur fin -->
    <circle cx="512" cy="430" r="290" fill="none" stroke="#c4a46b" stroke-width="1" opacity="0.25"/>
    <!-- Cercle intérieur très fin -->
    <circle cx="512" cy="430" r="240" fill="none" stroke="#c4a46b" stroke-width="0.5" opacity="0.15"/>
    <!-- Shaker ultra-minimaliste (contour seulement) -->
    <!-- Corps rectangle arrondi -->
    <rect x="466" y="250" width="92" height="196" rx="10" fill="none" stroke="url(#gold)" stroke-width="9"/>
    <!-- Cap -->
    <rect x="476" y="234" width="72" height="22" rx="5" fill="none" stroke="url(#gold)" stroke-width="9"/>
    <!-- Bec -->
    <rect x="506" y="218" width="12" height="18" rx="3" fill="url(#gold)"/>
    <!-- Jonction shaker -->
    <line x1="466" y1="350" x2="558" y2="350" stroke="url(#gold)" stroke-width="9"/>
    <!-- Bas conique contour -->
    <path d="M466,446 L558,446 L536,564 L488,564 Z" fill="none" stroke="url(#gold)" stroke-width="9" stroke-linejoin="round"/>
    <!-- Trait horizontal milieu -->
    <line x1="220" y1="640" x2="804" y2="640" stroke="#c4a46b" stroke-width="1" opacity="0.3"/>
    <!-- Texte -->
    <text x="512" y="750" font-family="Georgia, 'Times New Roman', serif" font-weight="300" font-size="96" fill="#c4a46b" text-anchor="middle" letter-spacing="20">BAR OPS</text>
    <!-- Tagline -->
    <text x="512" y="840" font-family="Georgia, serif" font-weight="300" font-size="30" fill="#ede8e0" text-anchor="middle" letter-spacing="14" opacity="0.35">EVENT MANAGEMENT</text>
  </svg>`,
}

async function run() {
  for (const [filename, svg] of Object.entries(icons)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, filename))
    console.log('✓', filename)
  }
}

run().catch(console.error)
