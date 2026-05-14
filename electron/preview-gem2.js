const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const designs = {
  // V1: gem plus grande, facettes très contrastées, BO centré et plus grand
  'preview-GEM-A2.png': `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400&display=swap');
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
        font-size:260px;
        color:#c4a46b;
        letter-spacing:20px;
        line-height:1;
        position:relative; z-index:2;
        margin-top: 60px;
      }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <radialGradient id="glow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#c4a46b" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#c4a46b" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Gem hexagonale plus grande, centrée -->
      <!-- cx=512, cy=500, r=390 -->
      <!-- Points: top=110, tr=448/162, br=448/838, bot=890, bl=576/838, tl=576/162 -->
      <!-- Hexagone flat-top: -->
      <!-- 512,100  854,306  854,718  512,924  170,718  170,306 -->

      <!-- Facettes remplies avec dégradés de contraste -->
      <!-- Haut gauche: clair -->
      <polygon points="512,100 170,306 512,500" fill="#c4a46b" opacity="0.13"/>
      <!-- Haut droite: très clair (source de lumière) -->
      <polygon points="512,100 854,306 512,500" fill="#c4a46b" opacity="0.22"/>
      <!-- Droite: mi-clair -->
      <polygon points="854,306 854,718 512,500" fill="#c4a46b" opacity="0.10"/>
      <!-- Bas droite: sombre -->
      <polygon points="854,718 512,924 512,500" fill="#080808" opacity="0.5"/>
      <!-- Bas gauche: très sombre -->
      <polygon points="512,924 170,718 512,500" fill="#080808" opacity="0.7"/>
      <!-- Gauche: mi-sombre -->
      <polygon points="170,718 170,306 512,500" fill="#080808" opacity="0.3"/>

      <!-- Halo lumineux central -->
      <circle cx="512" cy="400" r="390" fill="url(#glow)"/>

      <!-- Contour hexagone, trait doré net -->
      <polygon points="512,100 854,306 854,718 512,924 170,718 170,306"
               fill="none" stroke="#c4a46b" stroke-width="5"/>

      <!-- Arêtes internes -->
      <line x1="512" y1="100" x2="512" y2="500" stroke="#c4a46b" stroke-width="2" opacity="0.6"/>
      <line x1="854" y1="306" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.5"/>
      <line x1="854" y1="718" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.3"/>
      <line x1="512" y1="924" x2="512" y2="500" stroke="#c4a46b" stroke-width="2" opacity="0.3"/>
      <line x1="170" y1="718" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.25"/>
      <line x1="170" y1="306" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.4"/>

      <!-- Reflet: petit éclat en haut droite -->
      <polygon points="680,148 780,220 700,230" fill="#c4a46b" opacity="0.35"/>
    </svg>
    <div class="mono">BO</div>
  `,

  // V2: même gem mais BO en haut, tagline en bas dans la facette inférieure
  'preview-GEM-A3.png': `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Jost:wght@200&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        width:${SIZE}px; height:${SIZE}px;
        background:#080808;
        display:flex; align-items:center; justify-content:center;
        border-radius:180px; overflow:hidden;
        flex-direction:column;
        gap:0;
      }
      svg { position:absolute; top:0; left:0; }
      .mono {
        font-family:'Cormorant Garamond', serif;
        font-weight:400;
        font-size:280px;
        color:#c4a46b;
        letter-spacing:22px;
        line-height:1;
        position:relative; z-index:2;
        margin-top:30px;
      }
      .sub {
        font-family:'Jost', sans-serif;
        font-weight:200;
        font-size:28px;
        color:#c4a46b;
        letter-spacing:20px;
        opacity:0.55;
        position:relative; z-index:2;
        margin-top:12px;
        text-transform:uppercase;
      }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <radialGradient id="glow2" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#c4a46b" stop-opacity="0.10"/>
          <stop offset="100%" stop-color="#c4a46b" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <polygon points="512,100 854,306 854,718 512,924 170,718 170,306" fill="none"/>
      <polygon points="512,100 170,306 512,500" fill="#c4a46b" opacity="0.13"/>
      <polygon points="512,100 854,306 512,500" fill="#c4a46b" opacity="0.22"/>
      <polygon points="854,306 854,718 512,500" fill="#c4a46b" opacity="0.10"/>
      <polygon points="854,718 512,924 512,500" fill="#080808" opacity="0.5"/>
      <polygon points="512,924 170,718 512,500" fill="#080808" opacity="0.7"/>
      <polygon points="170,718 170,306 512,500" fill="#080808" opacity="0.3"/>
      <circle cx="512" cy="400" r="390" fill="url(#glow2)"/>
      <polygon points="512,100 854,306 854,718 512,924 170,718 170,306" fill="none" stroke="#c4a46b" stroke-width="5"/>
      <line x1="512" y1="100" x2="512" y2="500" stroke="#c4a46b" stroke-width="2" opacity="0.6"/>
      <line x1="854" y1="306" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.5"/>
      <line x1="854" y1="718" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.3"/>
      <line x1="512" y1="924" x2="512" y2="500" stroke="#c4a46b" stroke-width="2" opacity="0.3"/>
      <line x1="170" y1="718" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.25"/>
      <line x1="170" y1="306" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.4"/>
      <polygon points="680,148 780,220 700,230" fill="#c4a46b" opacity="0.35"/>
    </svg>
    <div class="mono">BO</div>
    <div class="sub">Bar Ops</div>
  `,

  // V3: gem légèrement inclinée, plus de personnalité
  'preview-GEM-A4.png': `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400&display=swap');
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
        font-style:italic;
        font-size:250px;
        color:#c4a46b;
        letter-spacing:16px;
        line-height:1;
        position:relative; z-index:2;
        margin-top:50px;
      }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <radialGradient id="glow3" cx="55%" cy="38%" r="50%">
          <stop offset="0%" stop-color="#d4b47a" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#c4a46b" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Gem inclinée de 15° -->
      <g transform="rotate(15, 512, 512)">
        <polygon points="512,100 854,306 854,718 512,924 170,718 170,306" fill="none"/>
        <polygon points="512,100 170,306 512,500" fill="#c4a46b" opacity="0.16"/>
        <polygon points="512,100 854,306 512,500" fill="#c4a46b" opacity="0.28"/>
        <polygon points="854,306 854,718 512,500" fill="#c4a46b" opacity="0.08"/>
        <polygon points="854,718 512,924 512,500" fill="#080808" opacity="0.55"/>
        <polygon points="512,924 170,718 512,500" fill="#080808" opacity="0.75"/>
        <polygon points="170,718 170,306 512,500" fill="#080808" opacity="0.35"/>
        <polygon points="512,100 854,306 854,718 512,924 170,718 170,306" fill="none" stroke="#c4a46b" stroke-width="5"/>
        <line x1="512" y1="100" x2="512" y2="500" stroke="#c4a46b" stroke-width="2" opacity="0.6"/>
        <line x1="854" y1="306" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.55"/>
        <line x1="854" y1="718" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.3"/>
        <line x1="512" y1="924" x2="512" y2="500" stroke="#c4a46b" stroke-width="2" opacity="0.3"/>
        <line x1="170" y1="718" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.25"/>
        <line x1="170" y1="306" x2="512" y2="500" stroke="#c4a46b" stroke-width="1.5" opacity="0.45"/>
        <!-- Reflet éclat -->
        <polygon points="640,130 760,200 680,215" fill="#c4a46b" opacity="0.45"/>
        <polygon points="740,170 800,215 760,220" fill="#d4b47a" opacity="0.3"/>
      </g>
      <circle cx="512" cy="440" r="400" fill="url(#glow3)"/>
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
