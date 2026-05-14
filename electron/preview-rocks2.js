const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const designs = {
  // Face: contour épais, glaçon carré, liquide à mi-hauteur
  'preview-RK2-A.png': `
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
      <!-- Verre de face: trapèze légèrement évasé en haut -->
      <path d="M260,200 L200,800 L824,800 L764,200 Z"
            fill="none" stroke="url(#g)" stroke-width="40" stroke-linejoin="round"/>
      <!-- Niveau du liquide -->
      <line x1="224" y1="560" x2="800" y2="560" stroke="url(#g)" stroke-width="16" opacity="0.45"/>
      <!-- Glaçon carré incliné -->
      <rect x="340" y="310" width="340" height="340" rx="16"
            fill="none" stroke="url(#g)" stroke-width="28"
            transform="rotate(12 512 480)"/>
      <!-- Reflet glaçon -->
      <line x1="356" y1="334" x2="310" y2="370"
            stroke="url(#g)" stroke-width="16" stroke-linecap="round" opacity="0.55"
            transform="rotate(12 512 480)"/>
    </svg>
  `,

  // Face: verre plein, glaçon cube qui dépasse légèrement du bord supérieur
  'preview-RK2-B.png': `
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
      <!-- Verre -->
      <path d="M270,220 L210,800 L814,800 L754,220 Z"
            fill="none" stroke="url(#g)" stroke-width="40" stroke-linejoin="round"/>
      <!-- Glaçon qui dépasse: carré incliné, moitié dans le verre -->
      <rect x="330" y="130" width="370" height="370" rx="18"
            fill="#080808" stroke="url(#g)" stroke-width="32"
            transform="rotate(10 515 315)"/>
      <!-- Reflets glaçon -->
      <line x1="348" y1="152" x2="296" y2="196"
            stroke="url(#g)" stroke-width="18" stroke-linecap="round" opacity="0.6"
            transform="rotate(10 515 315)"/>
      <line x1="390" y1="148" x2="358" y2="178"
            stroke="url(#g)" stroke-width="12" stroke-linecap="round" opacity="0.35"
            transform="rotate(10 515 315)"/>
    </svg>
  `,

  // Face: verre rocks minimaliste, trait seul, glaçon carré plein (silhouette)
  'preview-RK2-C.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e8d490"/>
          <stop offset="100%" stop-color="#c4a46b"/>
        </linearGradient>
      </defs>
      <!-- Verre: contour simple, bords droits -->
      <path d="M280,210 L220,790 L804,790 L744,210 Z"
            fill="none" stroke="url(#g)" stroke-width="36" stroke-linejoin="round"/>
      <!-- Glaçon: carré solide, centré, légèrement incliné -->
      <rect x="348" y="290" width="340" height="340" rx="20"
            fill="url(#g)"
            transform="rotate(-8 512 460)"/>
      <!-- Retrait intérieur: donne l'effet verre -->
      <rect x="376" y="318" width="284" height="284" rx="14"
            fill="#080808"
            transform="rotate(-8 512 460)"/>
      <!-- Reflet: trait blanc court en haut gauche du glaçon -->
      <line x1="366" y1="308" x2="318" y2="348"
            stroke="white" stroke-width="16" stroke-linecap="round" opacity="0.5"
            transform="rotate(-8 512 460)"/>
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
