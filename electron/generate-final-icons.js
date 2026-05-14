const puppeteer = require('puppeteer')
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const apps = [
  { file: 'final-bar-ops.png',      label: 'BO', sub: 'BAR OPS',      color: '#c4a46b', color2: '#d4b47a' },
  { file: 'final-traiteur-ops.png', label: 'TO', sub: 'TRAITEUR OPS', color: '#b87333', color2: '#cc8844' },
  { file: 'final-event-ops.png',    label: 'EO', sub: 'EVENT OPS',    color: '#e8d5b0', color2: '#f0e4c4' },
  { file: 'final-house-ops.png',    label: 'HO', sub: 'HOUSE OPS',    color: '#9b2335', color2: '#c42840' },
]

function makeIcon({ label, sub, color, color2 }) {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400&family=Jost:wght@200&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        width:${SIZE}px; height:${SIZE}px;
        background:#080808;
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        border-radius:180px; overflow:hidden;
      }
      svg { position:absolute; top:0; left:0; }
      .mono {
        font-family:'Cormorant Garamond', serif;
        font-weight:400;
        font-size:258px;
        color:${color};
        letter-spacing:20px;
        line-height:1;
        position:relative; z-index:2;
        margin-top:40px;
      }
      .sub {
        font-family:'Jost', sans-serif;
        font-weight:200;
        font-size:52px;
        color:${color};
        letter-spacing:10px;
        opacity:0.5;
        position:relative; z-index:2;
        margin-top:18px;
      }
    </style>
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <defs>
        <radialGradient id="glow" cx="55%" cy="38%" r="50%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.13"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <polygon points="512,100 170,306 512,500" fill="${color}" opacity="0.13"/>
      <polygon points="512,100 854,306 512,500" fill="${color}" opacity="0.24"/>
      <polygon points="854,306 854,718 512,500" fill="${color}" opacity="0.09"/>
      <polygon points="854,718 512,924 512,500" fill="#080808" opacity="0.55"/>
      <polygon points="512,924 170,718 512,500" fill="#080808" opacity="0.72"/>
      <polygon points="170,718 170,306 512,500" fill="#080808" opacity="0.32"/>
      <circle cx="512" cy="420" r="400" fill="url(#glow)"/>
      <polygon points="512,100 854,306 854,718 512,924 170,718 170,306"
               fill="none" stroke="${color}" stroke-width="5"/>
      <line x1="512" y1="100" x2="512" y2="500" stroke="${color}" stroke-width="2" opacity="0.60"/>
      <line x1="854" y1="306" x2="512" y2="500" stroke="${color}" stroke-width="1.5" opacity="0.50"/>
      <line x1="854" y1="718" x2="512" y2="500" stroke="${color}" stroke-width="1.5" opacity="0.28"/>
      <line x1="512" y1="924" x2="512" y2="500" stroke="${color}" stroke-width="2" opacity="0.28"/>
      <line x1="170" y1="718" x2="512" y2="500" stroke="${color}" stroke-width="1.5" opacity="0.22"/>
      <line x1="170" y1="306" x2="512" y2="500" stroke="${color}" stroke-width="1.5" opacity="0.42"/>
      <polygon points="672,140 776,208 696,222" fill="${color2}" opacity="0.40"/>
      <polygon points="752,180 806,222 770,228" fill="${color2}" opacity="0.25"/>
    </svg>
    <div class="mono">${label}</div>
    <div class="sub">${sub}</div>
  `
}

async function buildIcns(pngPath, name) {
  const iconsetDir = path.join(ASSETS, `${name}.iconset`)
  if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir)
  const sizes = [16, 32, 64, 128, 256, 512]
  for (const s of sizes) {
    await sharp(pngPath).resize(s, s).png().toFile(path.join(iconsetDir, `icon_${s}x${s}.png`))
    await sharp(pngPath).resize(s * 2, s * 2).png().toFile(path.join(iconsetDir, `icon_${s}x${s}@2x.png`))
  }
  execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(ASSETS, `${name}.icns`)}"`)
  fs.rmSync(iconsetDir, { recursive: true })
}

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })

  for (const app of apps) {
    const page = await browser.newPage()
    await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 })
    await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${makeIcon(app)}</body></html>`)
    await page.evaluateHandle('document.fonts.ready')
    await new Promise(r => setTimeout(r, 800))
    const outPath = path.join(ASSETS, app.file)
    await page.screenshot({ path: outPath, type: 'png' })
    await page.close()
    console.log('✓ PNG', app.file)
  }

  await browser.close()

  // Build .icns + .ico for Bar OPS (production)
  const barPng = path.join(ASSETS, 'final-bar-ops.png')
  await buildIcns(barPng, 'icon')
  await sharp(barPng).resize(256, 256).png().toFile(path.join(ASSETS, 'icon.ico'))
  await sharp(barPng).resize(1024, 1024).png().toFile(path.join(ASSETS, 'icon-1024.png'))
  console.log('✓ icon.icns + icon.ico générés pour Bar OPS')
}

run().catch(console.error)
