const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const apps = [
  { file: 'system-BO.png', label: 'BO', color: '#c4a46b', color2: '#d4b47a', bg: '#080808' },
  { file: 'system-EV.png', label: 'EV', color: '#e8d5b0', color2: '#f0e4c4', bg: '#080808' },
  { file: 'system-TR.png', label: 'TR', color: '#b87333', color2: '#cc8844', bg: '#080808' },
  { file: 'system-RS.png', label: 'RS', color: '#9b2335', color2: '#c42840', bg: '#080808' },
]

function makeIcon({ label, color, color2, bg }) {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        width:${SIZE}px; height:${SIZE}px;
        background:${bg};
        display:flex; align-items:center; justify-content:center;
        border-radius:180px; overflow:hidden;
      }
      svg { position:absolute; top:0; left:0; }
      .mono {
        font-family:'Cormorant Garamond', serif;
        font-weight:400;
        font-size:260px;
        color:${color};
        letter-spacing:20px;
        line-height:1;
        position:relative; z-index:2;
        margin-top:55px;
      }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <radialGradient id="glow" cx="55%" cy="38%" r="50%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.13"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Facettes -->
      <polygon points="512,100 170,306 512,500" fill="${color}" opacity="0.13"/>
      <polygon points="512,100 854,306 512,500" fill="${color}" opacity="0.24"/>
      <polygon points="854,306 854,718 512,500" fill="${color}" opacity="0.09"/>
      <polygon points="854,718 512,924 512,500" fill="${bg}" opacity="0.55"/>
      <polygon points="512,924 170,718 512,500" fill="${bg}" opacity="0.72"/>
      <polygon points="170,718 170,306 512,500" fill="${bg}" opacity="0.32"/>
      <!-- Halo -->
      <circle cx="512" cy="420" r="400" fill="url(#glow)"/>
      <!-- Contour -->
      <polygon points="512,100 854,306 854,718 512,924 170,718 170,306"
               fill="none" stroke="${color}" stroke-width="5"/>
      <!-- Arêtes internes -->
      <line x1="512" y1="100" x2="512" y2="500" stroke="${color}" stroke-width="2" opacity="0.60"/>
      <line x1="854" y1="306" x2="512" y2="500" stroke="${color}" stroke-width="1.5" opacity="0.50"/>
      <line x1="854" y1="718" x2="512" y2="500" stroke="${color}" stroke-width="1.5" opacity="0.28"/>
      <line x1="512" y1="924" x2="512" y2="500" stroke="${color}" stroke-width="2" opacity="0.28"/>
      <line x1="170" y1="718" x2="512" y2="500" stroke="${color}" stroke-width="1.5" opacity="0.22"/>
      <line x1="170" y1="306" x2="512" y2="500" stroke="${color}" stroke-width="1.5" opacity="0.42"/>
      <!-- Reflet éclat -->
      <polygon points="672,140 776,208 696,222" fill="${color2}" opacity="0.40"/>
      <polygon points="752,180 806,222 770,228" fill="${color2}" opacity="0.25"/>
    </svg>
    <div class="mono">${label}</div>
  `
}

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  for (const app of apps) {
    const page = await browser.newPage()
    await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 })
    await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${makeIcon(app)}</body></html>`)
    await page.evaluateHandle('document.fonts.ready')
    await new Promise(r => setTimeout(r, 800))
    await page.screenshot({ path: path.join(ASSETS, app.file), type: 'png' })
    await page.close()
    console.log('✓', app.file)
  }
  await browser.close()
}

run().catch(console.error)
