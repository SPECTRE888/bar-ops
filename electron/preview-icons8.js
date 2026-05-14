const sharp = require('sharp')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const icons = {
  // BO serif classique, centré, avec un cercle doré fin autour
  'preview-AA.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <circle cx="512" cy="480" r="330" fill="none" stroke="#c4a46b" stroke-width="6"/>
    <text x="512" y="570" font-family="Georgia, 'Times New Roman', serif" font-weight="400" font-size="320" fill="#c4a46b" text-anchor="middle" letter-spacing="10">BO</text>
  </svg>`,

  // BO sans-serif bold, centré, deux traits horizontaux fins encadrants
  'preview-AB.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <line x1="200" y1="310" x2="824" y2="310" stroke="#c4a46b" stroke-width="4"/>
    <line x1="200" y1="714" x2="824" y2="714" stroke="#c4a46b" stroke-width="4"/>
    <text x="512" y="660" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-weight="200" font-size="340" fill="#c4a46b" text-anchor="middle" letter-spacing="30">BO</text>
  </svg>`,

  // BO en serif, B et O de taille différente, équilibre optique
  'preview-AC.png': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d4b47a"/>
        <stop offset="100%" stop-color="#c4a46b"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="180" fill="#080808"/>
    <!-- B grand -->
    <text x="290" y="640" font-family="Georgia, serif" font-weight="400" font-size="460" fill="url(#gold)" text-anchor="middle">B</text>
    <!-- O plus petit, aligné bas -->
    <text x="690" y="640" font-family="Georgia, serif" font-weight="300" font-size="300" fill="url(#gold)" text-anchor="middle">O</text>
    <!-- Trait fin bas -->
    <line x1="160" y1="700" x2="864" y2="700" stroke="#c4a46b" stroke-width="3" opacity="0.4"/>
  </svg>`,
}

async function run() {
  for (const [filename, svg] of Object.entries(icons)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, filename))
    console.log('✓', filename)
  }
}

run().catch(console.error)
