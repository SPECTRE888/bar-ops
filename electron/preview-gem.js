const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const designs = {
  // Pierre taillée hexagonale, facettes dorées, BO au centre
  'preview-GEM-A.png': `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        width:${SIZE}px; height:${SIZE}px;
        background:#080808;
        display:flex; align-items:center; justify-content:center;
        border-radius:180px; overflow:hidden;
      }
      svg { position:absolute; top:0; left:0; }
      .mono {
        font-family:'Cormorant Garamond', serif;
        font-weight:400;
        font-size:220px;
        color:#c4a46b;
        letter-spacing:16px;
        line-height:1;
        position:relative;
        z-index:2;
      }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <!-- Gemme hexagonale facettée -->
      <!-- Face principale -->
      <polygon points="512,140 820,320 820,680 512,860 204,680 204,320" fill="none" stroke="#c4a46b" stroke-width="5"/>
      <!-- Facette haut gauche -->
      <polygon points="512,140 204,320 512,420" fill="#c4a46b" opacity="0.06"/>
      <!-- Facette haut droite -->
      <polygon points="512,140 820,320 512,420" fill="#c4a46b" opacity="0.10"/>
      <!-- Facette gauche -->
      <polygon points="204,320 204,680 512,420" fill="#c4a46b" opacity="0.04"/>
      <!-- Facette droite -->
      <polygon points="820,320 820,680 512,420" fill="#c4a46b" opacity="0.14"/>
      <!-- Facette bas gauche -->
      <polygon points="204,680 512,860 512,620" fill="#c4a46b" opacity="0.07"/>
      <!-- Facette bas droite -->
      <polygon points="820,680 512,860 512,620" fill="#c4a46b" opacity="0.04"/>
      <!-- Lignes internes de facettes -->
      <line x1="512" y1="140" x2="512" y2="420" stroke="#c4a46b" stroke-width="2" opacity="0.5"/>
      <line x1="204" y1="320" x2="512" y2="420" stroke="#c4a46b" stroke-width="1.5" opacity="0.4"/>
      <line x1="820" y1="320" x2="512" y2="420" stroke="#c4a46b" stroke-width="1.5" opacity="0.4"/>
      <line x1="204" y1="680" x2="512" y2="620" stroke="#c4a46b" stroke-width="1.5" opacity="0.3"/>
      <line x1="820" y1="680" x2="512" y2="620" stroke="#c4a46b" stroke-width="1.5" opacity="0.3"/>
      <line x1="512" y1="860" x2="512" y2="620" stroke="#c4a46b" stroke-width="2" opacity="0.5"/>
      <!-- Centre horizontal -->
      <line x1="204" y1="500" x2="820" y2="500" stroke="#c4a46b" stroke-width="1" opacity="0.2"/>
    </svg>
    <div class="mono">BO</div>
  `,

  // Diamant taillé (forme brillant vue de dessus), très graphic
  'preview-GEM-B.png': `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        width:${SIZE}px; height:${SIZE}px;
        background:#080808;
        display:flex; align-items:center; justify-content:center;
        border-radius:180px; overflow:hidden;
      }
      svg { position:absolute; top:0; left:0; }
      .mono {
        font-family:'Cormorant Garamond', serif;
        font-weight:300;
        font-size:200px;
        color:#c4a46b;
        letter-spacing:14px;
        position:relative; z-index:2;
        margin-top:-60px;
      }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <!-- Couronne du diamant (top) -->
      <polygon points="512,180 680,380 512,340 344,380" fill="#c4a46b" opacity="0.15"/>
      <polygon points="680,380 820,380 512,340" fill="#c4a46b" opacity="0.09"/>
      <polygon points="344,380 204,380 512,340" fill="#c4a46b" opacity="0.12"/>
      <polygon points="820,380 760,180 512,340" fill="#c4a46b" opacity="0.07"/>
      <polygon points="204,380 264,180 512,340" fill="#c4a46b" opacity="0.10"/>
      <polygon points="760,180 512,180 512,340" fill="#c4a46b" opacity="0.13"/>
      <polygon points="264,180 512,180 512,340" fill="#c4a46b" opacity="0.08"/>
      <!-- Table (centre plat) -->
      <polygon points="512,180 760,180 820,380 680,380 512,340 344,380 204,380 264,180" fill="none" stroke="#c4a46b" stroke-width="4"/>
      <!-- Pavillon (bas) pointu -->
      <polygon points="204,380 512,840 344,380" fill="#c4a46b" opacity="0.06"/>
      <polygon points="344,380 512,840 680,380" fill="#c4a46b" opacity="0.10"/>
      <polygon points="680,380 512,840 820,380" fill="#c4a46b" opacity="0.05"/>
      <!-- Contour pavillon -->
      <polygon points="204,380 820,380 512,840" fill="none" stroke="#c4a46b" stroke-width="4"/>
      <!-- Lignes internes pavillon -->
      <line x1="344" y1="380" x2="512" y2="840" stroke="#c4a46b" stroke-width="2" opacity="0.4"/>
      <line x1="680" y1="380" x2="512" y2="840" stroke="#c4a46b" stroke-width="2" opacity="0.4"/>
      <line x1="512" y1="340" x2="512" y2="840" stroke="#c4a46b" stroke-width="2" opacity="0.3"/>
    </svg>
    <div class="mono">BO</div>
  `,

  // Éclat de pierre obsidienne — forme asymétrique irrégulière, très haut de gamme
  'preview-GEM-C.png': `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        width:${SIZE}px; height:${SIZE}px;
        background:#080808;
        display:flex; align-items:center; justify-content:center;
        border-radius:180px; overflow:hidden;
      }
      svg { position:absolute; top:0; left:0; }
      .mono {
        font-family:'Cormorant Garamond', serif;
        font-weight:300;
        font-style:italic;
        font-size:230px;
        color:#c4a46b;
        letter-spacing:18px;
        position:relative; z-index:2;
      }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <!-- Forme obsidienne: éclat avec arêtes vives, asymétrique -->
      <polygon points="512,120 800,260 860,520 720,840 380,860 160,640 180,300" fill="none" stroke="#c4a46b" stroke-width="5"/>
      <!-- Facettes internes -->
      <polygon points="512,120 800,260 580,420" fill="#c4a46b" opacity="0.09"/>
      <polygon points="800,260 860,520 580,420" fill="#c4a46b" opacity="0.13"/>
      <polygon points="860,520 720,840 540,580" fill="#c4a46b" opacity="0.07"/>
      <polygon points="720,840 380,860 512,580" fill="#c4a46b" opacity="0.10"/>
      <polygon points="380,860 160,640 440,560" fill="#c4a46b" opacity="0.06"/>
      <polygon points="160,640 180,300 420,460" fill="#c4a46b" opacity="0.11"/>
      <polygon points="180,300 512,120 460,440" fill="#c4a46b" opacity="0.08"/>
      <!-- Lignes arêtes -->
      <line x1="512" y1="120" x2="512" y2="500" stroke="#c4a46b" stroke-width="2" opacity="0.5"/>
      <line x1="800" y1="260" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.4"/>
      <line x1="860" y1="520" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.4"/>
      <line x1="720" y1="840" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.35"/>
      <line x1="380" y1="860" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.35"/>
      <line x1="160" y1="640" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.4"/>
      <line x1="180" y1="300" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.4"/>
    </svg>
    <div class="mono">BO</div>
  `,
}

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  for (const [filename, body] of Object.entries(designs)) {
    const page = await browser.newPage()
    await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 })
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
