const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const designs = {
  // B bold + courbe fluide qui le traverse (style Nescafé)
  'preview-SW-A.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e0c880"/>
          <stop offset="100%" stop-color="#b8903a"/>
        </linearGradient>
        <linearGradient id="sw" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#d4b47a" stop-opacity="0"/>
          <stop offset="30%" stop-color="#d4b47a"/>
          <stop offset="100%" stop-color="#f0d890"/>
        </linearGradient>
      </defs>
      <!-- B custom bold centré -->
      <rect x="240" y="190" width="88" height="644" rx="6" fill="url(#g)"/>
      <path d="M328,190 h90 a178,178 0 0,1 0,322 h-90 Z" fill="url(#g)"/>
      <path d="M328,512 h110 a160,160 0 0,1 0,322 h-110 Z" fill="url(#g)"/>
      <!-- Swoosh: courbe fluide qui part de bas-gauche, traverse le B, s'étire à droite -->
      <path d="M160,780 C300,700 400,560 560,480 C680,420 780,380 900,260"
            fill="none" stroke="url(#sw)" stroke-width="32" stroke-linecap="round"/>
      <!-- Petit point terminal du swoosh -->
      <circle cx="900" cy="260" r="20" fill="#f0d890"/>
    </svg>
  `,

  // BO avec un arc qui unit les deux lettres par dessus
  'preview-SW-B.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e0c880"/>
          <stop offset="100%" stop-color="#b8903a"/>
        </linearGradient>
        <linearGradient id="arc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#c4a46b"/>
          <stop offset="50%" stop-color="#f0d890"/>
          <stop offset="100%" stop-color="#c4a46b"/>
        </linearGradient>
      </defs>
      <!-- B -->
      <rect x="140" y="240" width="76" height="540" rx="4" fill="url(#g)"/>
      <path d="M216,240 h78 a148,148 0 0,1 0,270 h-78 Z" fill="url(#g)"/>
      <path d="M216,510 h92 a135,135 0 0,1 0,270 h-92 Z" fill="url(#g)"/>
      <!-- O -->
      <circle cx="740" cy="510" r="210" fill="url(#g)"/>
      <circle cx="740" cy="510" r="118" fill="#080808"/>
      <!-- Arc qui unit B et O par le haut, comme un sourire inversé -->
      <path d="M216,240 C350,80 600,80 740,300"
            fill="none" stroke="url(#arc)" stroke-width="28" stroke-linecap="round"/>
    </svg>
  `,

  // B seul, très grand, avec une diagonale dorée qui le coupe — simple et fort
  'preview-SW-C.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e0c880"/>
          <stop offset="100%" stop-color="#b8903a"/>
        </linearGradient>
        <linearGradient id="slash" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#c4a46b" stop-opacity="0"/>
          <stop offset="40%" stop-color="#f0d890"/>
          <stop offset="100%" stop-color="#c4a46b" stop-opacity="0"/>
        </linearGradient>
        <clipPath id="b-clip">
          <rect x="150" y="130" width="724" height="764"/>
        </clipPath>
      </defs>
      <!-- B très grand, centré -->
      <rect x="152" y="132" width="96" height="760" rx="6" fill="url(#g)"/>
      <path d="M248,132 h100 a208,208 0 0,1 0,380 h-100 Z" fill="url(#g)"/>
      <path d="M248,512 h120 a244,244 0 0,1 0,380 h-120 Z" fill="url(#g)"/>
      <!-- Slash diagonal qui traverse tout de bas-gauche à haut-droite -->
      <line x1="100" y1="900" x2="924" y2="124"
            stroke="url(#slash)" stroke-width="22" stroke-linecap="round"/>
    </svg>
  `,

  // B + swoosh courbe en dessous, comme une vague signature
  'preview-SW-D.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e2cc84"/>
          <stop offset="100%" stop-color="#b8903a"/>
        </linearGradient>
        <linearGradient id="wave" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#c4a46b" stop-opacity="0.2"/>
          <stop offset="20%" stop-color="#f0d890"/>
          <stop offset="80%" stop-color="#c4a46b"/>
          <stop offset="100%" stop-color="#c4a46b" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- B centré, taille medium -->
      <rect x="220" y="170" width="84" height="580" rx="5" fill="url(#g)"/>
      <path d="M304,170 h86 a160,160 0 0,1 0,290 h-86 Z" fill="url(#g)"/>
      <path d="M304,460 h100 a145,145 0 0,1 0,290 h-100 Z" fill="url(#g)"/>
      <!-- Vague signature fluide sous le B, s'étire loin à droite -->
      <path d="M180,820 C280,760 360,820 460,780 C560,740 640,680 780,700 C860,710 920,740 960,720"
            fill="none" stroke="url(#wave)" stroke-width="26" stroke-linecap="round"/>
    </svg>
  `,
}

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  for (const [filename, body] of Object.entries(designs)) {
    const page = await browser.newPage()
    await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 2 })
    await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${body}</body></html>`)
    await page.evaluateHandle('document.fonts.ready')
    await new Promise(r => setTimeout(r, 500))
    await page.screenshot({ path: path.join(ASSETS, filename), type: 'png' })
    await page.close()
    console.log('✓', filename)
  }
  await browser.close()
}

run().catch(console.error)
