const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const SW = 36   // stroke principal
const SW2 = 20  // stroke secondaire
const SW3 = 12  // stroke fin

const gold = (id, a='0%', b='100%') => `
  <linearGradient id="${id}" x1="0%" y1="${a}" x2="100%" y2="${b}">
    <stop offset="0%" stop-color="#eddea0"/>
    <stop offset="50%" stop-color="#c4a46b"/>
    <stop offset="100%" stop-color="#a07838"/>
  </linearGradient>`

const designs = {

  // ─── BAR OPS ─────────────────────────────────────────────────────────────
  'final-TV-BAR.png': `
    <style>* {margin:0;padding:0;} body{width:${SIZE}px;height:${SIZE}px;background:#080808;border-radius:180px;overflow:hidden;display:flex;align-items:center;justify-content:center;}</style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        ${gold('g','0%','100%')}
        <filter id="glow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <!-- Bord du verre: double cercle -->
      <circle cx="512" cy="512" r="348" fill="none" stroke="url(#g)" stroke-width="${SW}"/>
      <circle cx="512" cy="512" r="310" fill="none" stroke="url(#g)" stroke-width="5" opacity="0.3"/>

      <!-- Glaçon incliné 18°, coins arrondis, bien centré -->
      <rect x="326" y="326" width="360" height="360" rx="36"
            fill="none" stroke="url(#g)" stroke-width="${SW}"
            transform="rotate(18 512 512)"/>

      <!-- Arêtes du glaçon (lignes internes pour donner volume) -->
      <rect x="362" y="362" width="288" height="288" rx="24"
            fill="none" stroke="url(#g)" stroke-width="6" opacity="0.22"
            transform="rotate(18 512 512)"/>

      <!-- Reflets glaçon: 2 traits courts coin haut-gauche -->
      <g transform="rotate(18 512 512)">
        <line x1="354" y1="350" x2="304" y2="298" stroke="url(#g)" stroke-width="18" stroke-linecap="round" opacity="0.75" filter="url(#glow)"/>
        <line x1="400" y1="336" x2="366" y2="302" stroke="url(#g)" stroke-width="11" stroke-linecap="round" opacity="0.45"/>
      </g>

      <!-- Paille: diagonale élégante, épaisseur dégradée -->
      <line x1="454" y1="840" x2="668" y2="184"
            stroke="url(#g)" stroke-width="24" stroke-linecap="round" opacity="0.9"/>
      <!-- Extrémité paille hors verre: légèrement plus fine -->
      <line x1="668" y1="184" x2="700" y2="112"
            stroke="url(#g)" stroke-width="16" stroke-linecap="round" opacity="0.5"/>

      <!-- Petite bulle: détail cocktail -->
      <circle cx="400" cy="600" r="14" fill="url(#g)" opacity="0.35"/>
      <circle cx="612" cy="430" r="10" fill="url(#g)" opacity="0.25"/>
    </svg>
  `,

  // ─── TRAITEUR OPS ────────────────────────────────────────────────────────
  'final-TV-TRAITEUR.png': `
    <style>* {margin:0;padding:0;} body{width:${SIZE}px;height:${SIZE}px;background:#080808;border-radius:180px;overflow:hidden;display:flex;align-items:center;justify-content:center;}</style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>${gold('g','0%','100%')}</defs>

      <!-- Assiette: 3 cercles concentriques bien espacés -->
      <circle cx="512" cy="512" r="348" fill="none" stroke="url(#g)" stroke-width="${SW}"/>
      <circle cx="512" cy="512" r="268" fill="none" stroke="url(#g)" stroke-width="10" opacity="0.45"/>
      <circle cx="512" cy="512" r="130" fill="none" stroke="url(#g)" stroke-width="6" opacity="0.22"/>

      <!-- Fourchette gauche (cx≈310) vue de dessus, propre -->
      <g transform="translate(310, 512)">
        <!-- Manche -->
        <rect x="-12" y="40" width="24" height="240" rx="12" fill="url(#g)"/>
        <!-- Jonction -->
        <rect x="-12" y="-20" width="24" height="64" rx="4" fill="url(#g)"/>
        <!-- 4 dents fines -->
        <rect x="-42" y="-230" width="14" height="220" rx="7" fill="url(#g)"/>
        <rect x="-16" y="-240" width="14" height="228" rx="7" fill="url(#g)"/>
        <rect x="10"  y="-240" width="14" height="228" rx="7" fill="url(#g)"/>
        <rect x="36"  y="-230" width="14" height="220" rx="7" fill="url(#g)"/>
      </g>

      <!-- Couteau droit (cx≈714) -->
      <g transform="translate(714, 512)">
        <!-- Manche -->
        <rect x="-14" y="40" width="28" height="240" rx="14" fill="url(#g)"/>
        <!-- Séparateur manche/lame -->
        <rect x="-16" y="22" width="32" height="22" rx="4" fill="url(#g)"/>
        <!-- Lame: effilée vers le haut -->
        <path d="M-14,22 L-14,-210 Q0,-240 14,-210 L14,22 Z" fill="url(#g)"/>
      </g>
    </svg>
  `,

  // ─── EVENT OPS ───────────────────────────────────────────────────────────
  'final-TV-EVENT.png': `
    <style>* {margin:0;padding:0;} body{width:${SIZE}px;height:${SIZE}px;background:#080808;border-radius:180px;overflow:hidden;display:flex;align-items:center;justify-content:center;}</style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        ${gold('g2','0%','100%')}
        <filter id="glow2"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <!-- Coupe champagne vue dessus: ellipse large -->
      <ellipse cx="512" cy="512" rx="344" ry="112" fill="none" stroke="url(#g2)" stroke-width="${SW}"/>
      <!-- Bord intérieur -->
      <ellipse cx="512" cy="512" rx="306" ry="74" fill="none" stroke="url(#g2)" stroke-width="6" opacity="0.28"/>

      <!-- Bulles: 7 cercles de tailles variées, bien placés -->
      <circle cx="412" cy="512" r="44" fill="none" stroke="url(#g2)" stroke-width="${SW2}" filter="url(#glow2)"/>
      <circle cx="512" cy="468" r="32" fill="none" stroke="url(#g2)" stroke-width="18"/>
      <circle cx="612" cy="516" r="38" fill="none" stroke="url(#g2)" stroke-width="${SW2}"/>
      <circle cx="472" cy="550" r="22" fill="none" stroke="url(#g2)" stroke-width="${SW3}" opacity="0.75"/>
      <circle cx="556" cy="474" r="20" fill="none" stroke="url(#g2)" stroke-width="${SW3}" opacity="0.7"/>
      <circle cx="464" cy="484" r="13" fill="url(#g2)" opacity="0.5"/>
      <circle cx="564" cy="544" r="10" fill="url(#g2)" opacity="0.4"/>

      <!-- Reflet sur le bord de la flûte -->
      <path d="M200,480 Q220,512 200,544" fill="none" stroke="url(#g2)" stroke-width="16" stroke-linecap="round" opacity="0.45"/>
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
