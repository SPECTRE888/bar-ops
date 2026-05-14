const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const designs = {
  // Martini V: trait très épais, olive sur pic, fond noir
  'preview-CK-A.png': `
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
      <!-- V du verre, traits épais arrondis -->
      <polyline points="160,220 512,620 864,220"
        fill="none" stroke="url(#g)" stroke-width="48" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Tige -->
      <line x1="512" y1="620" x2="512" y2="790" stroke="url(#g)" stroke-width="48" stroke-linecap="round"/>
      <!-- Base -->
      <line x1="360" y1="790" x2="664" y2="790" stroke="url(#g)" stroke-width="48" stroke-linecap="round"/>
      <!-- Pic olive -->
      <line x1="512" y1="220" x2="512" y2="390" stroke="url(#g)" stroke-width="18" stroke-linecap="round" opacity="0.7"/>
      <!-- Olive -->
      <circle cx="512" cy="420" r="52" fill="url(#g)"/>
      <circle cx="512" cy="420" r="24" fill="#080808"/>
    </svg>
  `,

  // Même V mais fond bleu marine comme l'original, olive pleine, trait plus fin et élégant
  'preview-CK-B.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#1a2744; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e2cc84"/>
          <stop offset="100%" stop-color="#c4a46b"/>
        </linearGradient>
      </defs>
      <polyline points="160,220 512,620 864,220"
        fill="none" stroke="url(#g)" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="512" y1="620" x2="512" y2="790" stroke="url(#g)" stroke-width="44" stroke-linecap="round"/>
      <line x1="360" y1="790" x2="664" y2="790" stroke="url(#g)" stroke-width="44" stroke-linecap="round"/>
      <line x1="512" y1="220" x2="512" y2="386" stroke="url(#g)" stroke-width="16" stroke-linecap="round" opacity="0.75"/>
      <circle cx="512" cy="420" r="50" fill="url(#g)"/>
      <circle cx="512" cy="420" r="22" fill="#1a2744"/>
    </svg>
  `,

  // V plus large et ouvert, trait fin, look plus moderne/minimaliste
  'preview-CK-C.png': `
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
      <!-- V très ouvert, bords arrondis, trait fin premium -->
      <polyline points="100,180 512,660 924,180"
        fill="none" stroke="url(#g)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="512" y1="660" x2="512" y2="820" stroke="url(#g)" stroke-width="28" stroke-linecap="round"/>
      <line x1="340" y1="820" x2="684" y2="820" stroke="url(#g)" stroke-width="28" stroke-linecap="round"/>
      <!-- Olive: juste un disque plein, sans anneau -->
      <circle cx="512" cy="380" r="38" fill="url(#g)"/>
    </svg>
  `,

  // Coupe champagne (silhouette différente) — plus féminin, haut de gamme
  'preview-CK-D.png': `
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
      <!-- Coupe: courbe en U large, pas un V pointu -->
      <path d="M160,200 Q160,640 512,700 Q864,640 864,200"
        fill="none" stroke="url(#g)" stroke-width="44" stroke-linecap="round"/>
      <!-- Bord supérieur plat -->
      <line x1="160" y1="200" x2="864" y2="200" stroke="url(#g)" stroke-width="44" stroke-linecap="round"/>
      <!-- Tige -->
      <line x1="512" y1="700" x2="512" y2="840" stroke="url(#g)" stroke-width="44" stroke-linecap="round"/>
      <!-- Base -->
      <line x1="350" y1="840" x2="674" y2="840" stroke="url(#g)" stroke-width="44" stroke-linecap="round"/>
      <!-- Bulle dans le verre -->
      <circle cx="430" cy="460" r="16" fill="url(#g)" opacity="0.7"/>
      <circle cx="512" cy="380" r="12" fill="url(#g)" opacity="0.6"/>
      <circle cx="590" cy="480" r="14" fill="url(#g)" opacity="0.7"/>
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
