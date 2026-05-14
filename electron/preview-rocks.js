const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const designs = {
  // Rocks glass: contour épais, glaçon géométrique dedans
  'preview-RK-A.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e2cc84"/>
          <stop offset="100%" stop-color="#c4a46b"/>
        </linearGradient>
      </defs>
      <!-- Verre rocks: trapèze légèrement évasé vers le haut -->
      <path d="M240,720 L290,240 L734,240 L784,720 Z"
            fill="none" stroke="url(#g)" stroke-width="44" stroke-linejoin="round" stroke-linecap="round"/>
      <!-- Fond du verre -->
      <line x1="240" y1="720" x2="784" y2="720" stroke="url(#g)" stroke-width="44" stroke-linecap="round"/>
      <!-- Glaçon: carré avec coin cassé, style géométrique -->
      <polygon points="350,390 620,340 680,600 410,650"
               fill="none" stroke="url(#g)" stroke-width="22" stroke-linejoin="round" opacity="0.9"/>
      <!-- Reflet glaçon -->
      <line x1="390" y1="370" x2="340" y2="430" stroke="url(#g)" stroke-width="14" stroke-linecap="round" opacity="0.5"/>
    </svg>
  `,

  // Rocks glass vue de face, bords droits, glaçon sphérique (style japonais)
  'preview-RK-B.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e2cc84"/>
          <stop offset="100%" stop-color="#c4a46b"/>
        </linearGradient>
        <linearGradient id="ice" cx="40%" cy="35%" r="50%" id="ice" gradientUnits="objectBoundingBox">
          <stop offset="0%" stop-color="#e2cc84" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#c4a46b" stop-opacity="0.3"/>
        </linearGradient>
      </defs>
      <!-- Verre: rectangle strict, bords nets -->
      <rect x="262" y="230" width="500" height="500" rx="12"
            fill="none" stroke="url(#g)" stroke-width="40"/>
      <!-- Sphère de glace japonaise -->
      <circle cx="512" cy="480" r="170" fill="none" stroke="url(#g)" stroke-width="22"/>
      <!-- Reflets sphère -->
      <path d="M420,370 Q440,350 470,360" fill="none" stroke="url(#g)" stroke-width="14" stroke-linecap="round" opacity="0.7"/>
      <path d="M400,400 Q415,385 435,392" fill="none" stroke="url(#g)" stroke-width="10" stroke-linecap="round" opacity="0.45"/>
    </svg>
  `,

  // Rocks glass rempli à moitié, glaçon énorme qui dépasse du bord, très graphique
  'preview-RK-C.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f0dc98"/>
          <stop offset="100%" stop-color="#b8903a"/>
        </linearGradient>
      </defs>
      <!-- Glaçon énorme: losange qui déborde en haut du verre -->
      <polygon points="512,148 750,360 512,572 274,360"
               fill="none" stroke="url(#g)" stroke-width="28" stroke-linejoin="round" opacity="0.85"/>
      <!-- Reflets glaçon -->
      <line x1="512" y1="148" x2="574" y2="248" stroke="url(#g)" stroke-width="14" stroke-linecap="round" opacity="0.5"/>
      <!-- Verre: trapèze sous le glaçon -->
      <path d="M248,390 L298,760 L726,760 L776,390"
            fill="none" stroke="url(#g)" stroke-width="40" stroke-linejoin="round" stroke-linecap="round"/>
      <line x1="298" y1="760" x2="726" y2="760" stroke="url(#g)" stroke-width="40" stroke-linecap="round"/>
    </svg>
  `,

  // Vue de dessus du verre rocks: cercle + glaçon carré dedans, très graphique et inattendu
  'preview-RK-D.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e2cc84"/>
          <stop offset="100%" stop-color="#c4a46b"/>
        </linearGradient>
      </defs>
      <!-- Vue de dessus: cercle = bord du verre -->
      <circle cx="512" cy="512" r="340" fill="none" stroke="url(#g)" stroke-width="40"/>
      <circle cx="512" cy="512" r="298" fill="none" stroke="url(#g)" stroke-width="8" opacity="0.3"/>
      <!-- Glaçon carré en rotation 20° -->
      <rect x="332" y="332" width="360" height="360" rx="18"
            fill="none" stroke="url(#g)" stroke-width="28"
            transform="rotate(20 512 512)"/>
      <!-- Reflet glaçon -->
      <line x1="362" y1="380" x2="320" y2="340" stroke="url(#g)" stroke-width="16" stroke-linecap="round" opacity="0.6" transform="rotate(20 512 512)"/>
    </svg>
  `,
}

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  for (const [filename, body] of Object.entries(designs)) {
    const page = await browser.newPage()
    await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 2 })
    await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${body}</body></html>`)
    await new Promise(r => setTimeout(r, 400))
    await page.screenshot({ path: path.join(ASSETS, filename), type: 'png' })
    await page.close()
    console.log('✓', filename)
  }
  await browser.close()
}

run().catch(console.error)
