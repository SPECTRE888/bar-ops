const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const gold = `
  <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#eddea0"/>
    <stop offset="50%" stop-color="#c4a46b"/>
    <stop offset="100%" stop-color="#a07838"/>
  </linearGradient>`

const designs = {

  // BAR OPS v2 — verre rocks + glaçon plus massif, paille supprimée, tranche citron
  'final-TV-BAR2.png': `
    <style>* {margin:0;padding:0;} body{width:${SIZE}px;height:${SIZE}px;background:#080808;border-radius:180px;overflow:hidden;display:flex;align-items:center;justify-content:center;}</style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>${gold}
        <filter id="glow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <!-- Bord du verre -->
      <circle cx="512" cy="512" r="348" fill="none" stroke="url(#g)" stroke-width="38"/>
      <circle cx="512" cy="512" r="308" fill="none" stroke="url(#g)" stroke-width="5" opacity="0.28"/>

      <!-- Glaçon: plus grand, plus massif, incliné 15° -->
      <rect x="298" y="298" width="428" height="428" rx="42"
            fill="none" stroke="url(#g)" stroke-width="38"
            transform="rotate(15 512 512)"/>
      <!-- Arête intérieure subtile -->
      <rect x="338" y="338" width="348" height="348" rx="30"
            fill="none" stroke="url(#g)" stroke-width="5" opacity="0.20"
            transform="rotate(15 512 512)"/>
      <!-- Reflets glaçon — plus longs, plus visibles -->
      <g transform="rotate(15 512 512)" filter="url(#glow)">
        <line x1="326" y1="322" x2="268" y2="262" stroke="url(#g)" stroke-width="22" stroke-linecap="round" opacity="0.80"/>
        <line x1="378" y1="306" x2="338" y2="266" stroke="url(#g)" stroke-width="14" stroke-linecap="round" opacity="0.50"/>
        <line x1="306" y1="374" x2="268" y2="338" stroke="url(#g)" stroke-width="11" stroke-linecap="round" opacity="0.35"/>
      </g>

      <!-- Tranche citron: demi-cercle avec segments -->
      <g transform="translate(640 340) rotate(-30)">
        <path d="M0,-68 A68,68 0 0,1 0,68" fill="none" stroke="url(#g)" stroke-width="22" stroke-linecap="round"/>
        <line x1="0" y1="-68" x2="0" y2="68" stroke="url(#g)" stroke-width="14" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="59" y2="-34" stroke="url(#g)" stroke-width="8" stroke-linecap="round" opacity="0.55"/>
        <line x1="0" y1="0" x2="59" y2="34"  stroke="url(#g)" stroke-width="8" stroke-linecap="round" opacity="0.55"/>
        <line x1="0" y1="0" x2="68" y2="0"   stroke="url(#g)" stroke-width="8" stroke-linecap="round" opacity="0.55"/>
      </g>
    </svg>
  `,

  // EVENT OPS — 5 flûtes disposées en cercle (toast), vue de dessus
  // Evoque la connexion, la célébration, les gens ensemble
  'final-TV-EVENT2.png': `
    <style>* {margin:0;padding:0;} body{width:${SIZE}px;height:${SIZE}px;background:#080808;border-radius:180px;overflow:hidden;display:flex;align-items:center;justify-content:center;}</style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eddea0"/>
          <stop offset="50%" stop-color="#c4a46b"/>
          <stop offset="100%" stop-color="#a07838"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <!-- 6 verres en cercle, chacun = ellipse (ouverture flûte vue dessus)
           Rayon de placement: 260, angles: 0°, 60°, 120°, 180°, 240°, 300° -->

      <!-- Verre 1 — 0° (droite) -->
      <g transform="translate(772, 512) rotate(0)">
        <ellipse cx="0" cy="0" rx="72" ry="28" fill="none" stroke="url(#g)" stroke-width="28"/>
        <ellipse cx="0" cy="0" rx="50" ry="14" fill="none" stroke="url(#g)" stroke-width="5" opacity="0.3"/>
      </g>
      <!-- Verre 2 — 60° -->
      <g transform="translate(642, 737) rotate(60)">
        <ellipse cx="0" cy="0" rx="72" ry="28" fill="none" stroke="url(#g)" stroke-width="28"/>
        <ellipse cx="0" cy="0" rx="50" ry="14" fill="none" stroke="url(#g)" stroke-width="5" opacity="0.3"/>
      </g>
      <!-- Verre 3 — 120° -->
      <g transform="translate(382, 737) rotate(120)">
        <ellipse cx="0" cy="0" rx="72" ry="28" fill="none" stroke="url(#g)" stroke-width="28"/>
        <ellipse cx="0" cy="0" rx="50" ry="14" fill="none" stroke="url(#g)" stroke-width="5" opacity="0.3"/>
      </g>
      <!-- Verre 4 — 180° (gauche) -->
      <g transform="translate(252, 512) rotate(180)">
        <ellipse cx="0" cy="0" rx="72" ry="28" fill="none" stroke="url(#g)" stroke-width="28"/>
        <ellipse cx="0" cy="0" rx="50" ry="14" fill="none" stroke="url(#g)" stroke-width="5" opacity="0.3"/>
      </g>
      <!-- Verre 5 — 240° -->
      <g transform="translate(382, 287) rotate(240)">
        <ellipse cx="0" cy="0" rx="72" ry="28" fill="none" stroke="url(#g)" stroke-width="28"/>
        <ellipse cx="0" cy="0" rx="50" ry="14" fill="none" stroke="url(#g)" stroke-width="5" opacity="0.3"/>
      </g>
      <!-- Verre 6 — 300° -->
      <g transform="translate(642, 287) rotate(300)">
        <ellipse cx="0" cy="0" rx="72" ry="28" fill="none" stroke="url(#g)" stroke-width="28"/>
        <ellipse cx="0" cy="0" rx="50" ry="14" fill="none" stroke="url(#g)" stroke-width="5" opacity="0.3"/>
      </g>

      <!-- Lignes reliant les verres au centre (connexion) -->
      <line x1="772" y1="512" x2="512" y2="512" stroke="url(#g)" stroke-width="5" opacity="0.18"/>
      <line x1="642" y1="737" x2="512" y2="512" stroke="url(#g)" stroke-width="5" opacity="0.18"/>
      <line x1="382" y1="737" x2="512" y2="512" stroke="url(#g)" stroke-width="5" opacity="0.18"/>
      <line x1="252" y1="512" x2="512" y2="512" stroke="url(#g)" stroke-width="5" opacity="0.18"/>
      <line x1="382" y1="287" x2="512" y2="512" stroke="url(#g)" stroke-width="5" opacity="0.18"/>
      <line x1="642" y1="287" x2="512" y2="512" stroke="url(#g)" stroke-width="5" opacity="0.18"/>

      <!-- Point central: le moment partagé -->
      <circle cx="512" cy="512" r="28" fill="url(#g)" filter="url(#glow)"/>
      <circle cx="512" cy="512" r="14" fill="#080808"/>

      <!-- Cercle extérieur très fin: unité du groupe -->
      <circle cx="512" cy="512" r="360" fill="none" stroke="url(#g)" stroke-width="5" opacity="0.22"/>
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
