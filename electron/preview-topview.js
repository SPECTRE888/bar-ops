const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const designs = {
  // BAR OPS — verre rocks vue dessus: cercle + glaçon carré + paille + tranche citron
  'preview-TV-BAR.png': `
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
      <!-- Cercle extérieur: bord du verre -->
      <circle cx="512" cy="512" r="340" fill="none" stroke="url(#g)" stroke-width="44"/>
      <!-- Cercle intérieur fin: ombre intérieure du verre -->
      <circle cx="512" cy="512" r="296" fill="none" stroke="url(#g)" stroke-width="6" opacity="0.25"/>
      <!-- Glaçon carré incliné 20° -->
      <rect x="340" y="340" width="344" height="344" rx="28"
            fill="none" stroke="url(#g)" stroke-width="34"
            transform="rotate(20 512 512)"/>
      <!-- Reflets glaçon (2 traits courts coin haut-gauche) -->
      <line x1="362" y1="362" x2="316" y2="318"
            stroke="url(#g)" stroke-width="20" stroke-linecap="round" opacity="0.7"
            transform="rotate(20 512 512)"/>
      <line x1="404" y1="352" x2="372" y2="322"
            stroke="url(#g)" stroke-width="14" stroke-linecap="round" opacity="0.4"
            transform="rotate(20 512 512)"/>
      <!-- Paille: ligne diagonale qui dépasse du bord -->
      <line x1="440" y1="820" x2="660" y2="172"
            stroke="url(#g)" stroke-width="22" stroke-linecap="round"/>
      <!-- Bout de la paille (hors verre) -->
      <line x1="660" y1="172" x2="690" y2="110"
            stroke="url(#g)" stroke-width="22" stroke-linecap="round" opacity="0.5"/>
    </svg>
  `,

  // TRAITEUR OPS — assiette vue dessus: cercle + anneau + couteau/fourchette
  'preview-TV-TRAITEUR.png': `
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
      <!-- Assiette: 3 cercles concentriques -->
      <circle cx="512" cy="512" r="340" fill="none" stroke="url(#g)" stroke-width="44"/>
      <circle cx="512" cy="512" r="260" fill="none" stroke="url(#g)" stroke-width="10" opacity="0.5"/>
      <circle cx="512" cy="512" r="140" fill="none" stroke="url(#g)" stroke-width="6" opacity="0.25"/>
      <!-- Fourchette à gauche (vue de dessus = projection verticale) -->
      <!-- Manche -->
      <line x1="300" y1="720" x2="300" y2="420" stroke="url(#g)" stroke-width="22" stroke-linecap="round"/>
      <!-- Dents -->
      <line x1="268" y1="420" x2="268" y2="320" stroke="url(#g)" stroke-width="14" stroke-linecap="round"/>
      <line x1="300" y1="420" x2="300" y2="310" stroke="url(#g)" stroke-width="14" stroke-linecap="round"/>
      <line x1="332" y1="420" x2="332" y2="320" stroke="url(#g)" stroke-width="14" stroke-linecap="round"/>
      <!-- Arc jonction dents/manche -->
      <path d="M268,420 Q300,460 332,420" fill="none" stroke="url(#g)" stroke-width="14"/>
      <!-- Couteau à droite -->
      <!-- Manche -->
      <line x1="724" y1="720" x2="724" y2="430" stroke="url(#g)" stroke-width="22" stroke-linecap="round"/>
      <!-- Lame: légèrement plus fine, bord droit -->
      <path d="M710,430 L710,300 Q724,280 738,300 L738,430 Z" fill="url(#g)"/>
    </svg>
  `,

  // EVENT OPS — flûte champagne vue dessus: ellipse étroite + bulles
  'preview-TV-EVENT.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e8d5b0"/>
          <stop offset="100%" stop-color="#d4b87a"/>
        </linearGradient>
      </defs>
      <!-- Flûte vue de dessus: ellipse fine (ouverture) -->
      <ellipse cx="512" cy="512" r="320" ry="100" fill="none" stroke="url(#g)" stroke-width="44"/>
      <!-- Anneau intérieur -->
      <ellipse cx="512" cy="512" r="276" ry="56" fill="none" stroke="url(#g)" stroke-width="8" opacity="0.3"/>
      <!-- Bulles de champagne: cercles de tailles variées -->
      <circle cx="460" cy="512" r="32" fill="none" stroke="url(#g)" stroke-width="18"/>
      <circle cx="512" cy="480" r="22" fill="none" stroke="url(#g)" stroke-width="14"/>
      <circle cx="570" cy="520" r="28" fill="none" stroke="url(#g)" stroke-width="16"/>
      <circle cx="500" cy="548" r="16" fill="none" stroke="url(#g)" stroke-width="12" opacity="0.7"/>
      <circle cx="548" cy="490" r="14" fill="none" stroke="url(#g)" stroke-width="10" opacity="0.6"/>
      <circle cx="474" cy="474" r="10" fill="url(#g)" opacity="0.5"/>
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
