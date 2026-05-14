const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const designs = {
  // B et O géométriques construits sur la même grille — le O est un cercle parfait,
  // le B partage le même rayon. Tracé custom au SVG path.
  'preview-BOLD-A.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="700" height="420" viewBox="0 0 700 420">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#d4b47a"/>
          <stop offset="100%" stop-color="#c4a46b"/>
        </linearGradient>
      </defs>
      <!-- B custom: colonne + 2 demi-cercles construits sur r=100 -->
      <!-- Colonne -->
      <rect x="60" y="60" width="72" height="300" fill="url(#g)"/>
      <!-- Bosse haute (r=96) -->
      <path d="M132,60 h40 a96,96 0 0,1 0,150 h-40 Z" fill="url(#g)"/>
      <!-- Bosse basse (r=108, plus grande = optiquement équilibré) -->
      <path d="M132,210 h52 a105,105 0 0,1 0,150 h-52 Z" fill="url(#g)"/>

      <!-- O custom: anneau épais, même poids que le B -->
      <!-- Centre: 530,210 r_ext=150 r_int=78 -->
      <circle cx="530" cy="210" r="150" fill="url(#g)"/>
      <circle cx="530" cy="210" r="78"  fill="#080808"/>
    </svg>
  `,

  // BO où le O encercle partiellement le B — superposition graphique
  'preview-BOLD-B.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="620" height="420" viewBox="0 0 620 420">
      <!-- O: grand cercle doré en arrière -->
      <circle cx="370" cy="210" r="190" fill="#c4a46b"/>
      <!-- Trou du O -->
      <circle cx="370" cy="210" r="110" fill="#080808"/>
      <!-- B par-dessus en noir, recoupant le O -->
      <rect x="60" y="60" width="66" height="300" fill="#ede8e0"/>
      <path d="M126,60 h36 a88,88 0 0,1 0,150 h-36 Z" fill="#ede8e0"/>
      <path d="M126,210 h46 a96,96 0 0,1 0,150 h-46 Z" fill="#ede8e0"/>
      <!-- Là où le B chevauche le O: rend le B en noir -->
      <rect x="60" y="60" width="66" height="300" fill="#080808" opacity="0"/>
    </svg>
  `,

  // BO ultra-minimal: juste les deux lettres, poids maximal, tout en géométrie pure
  'preview-BOLD-C.png': `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
      .t {
        font-family:'Bebas Neue', sans-serif;
        font-size:620px;
        color:#c4a46b;
        letter-spacing:-20px;
        line-height:1;
      }
    </style>
    <div class="t">BO</div>
  `,

  // Mark abstrait: le B et O fusionnés en un seul glyphe — la colonne du B EST le bord gauche du O
  'preview-BOLD-D.png': `
    <style>
      * { margin:0; padding:0; }
      body { width:${SIZE}px; height:${SIZE}px; background:#080808; border-radius:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    </style>
    <svg width="560" height="460" viewBox="0 0 560 460">
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#d4b47a"/>
          <stop offset="100%" stop-color="#b8924a"/>
        </linearGradient>
      </defs>
      <!-- Colonne partagée B+O -->
      <rect x="30" y="30" width="74" height="400" rx="8" fill="url(#g2)"/>
      <!-- Bosse haute B -->
      <path d="M104,30 h38 a95,95 0 0,1 0,170 h-38 Z" fill="url(#g2)"/>
      <!-- Bosse basse B -->
      <path d="M104,200 h44 a105,105 0 0,1 0,183 h-44 Z" fill="url(#g2)"/>
      <!-- O: cercle dont le bord gauche = colonne -->
      <circle cx="420" cy="230" r="158" fill="url(#g2)"/>
      <circle cx="420" cy="230" r="88" fill="#080808"/>
      <!-- Séparateur entre B et O: fine ligne noire -->
      <line x1="270" y1="30" x2="270" y2="430" stroke="#080808" stroke-width="18"/>
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
    await new Promise(r => setTimeout(r, 800))
    await page.screenshot({ path: path.join(ASSETS, filename), type: 'png' })
    await page.close()
    console.log('✓', filename)
  }
  await browser.close()
}

run().catch(console.error)
