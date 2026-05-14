const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:${SIZE}px; height:${SIZE}px;
    background:#080808;
    display:flex; align-items:center; justify-content:center;
    border-radius:180px; overflow:hidden;
    position:relative;
  }
  .label {
    position:absolute;
    font-family:'Cormorant Garamond', serif;
    font-weight:300;
    font-size:210px;
    color:rgba(255,245,220,0.92);
    letter-spacing:18px;
    z-index:10;
    top:50%; left:50%;
    transform:translate(-50%, -42%);
    text-shadow: 0 2px 30px rgba(0,0,0,0.8), 0 0 60px rgba(196,164,107,0.3);
  }
</style>
</head>
<body>
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;">
  <defs>
    <linearGradient id="f1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0d888"/>
      <stop offset="60%" stop-color="#c49040"/>
      <stop offset="100%" stop-color="#8a6010"/>
    </linearGradient>
    <linearGradient id="f2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#c8a050"/>
      <stop offset="100%" stop-color="#5a3a08"/>
    </linearGradient>
    <linearGradient id="f3" x1="0%" y1="0%" x2="30%" y2="100%">
      <stop offset="0%" stop-color="#a07828"/>
      <stop offset="100%" stop-color="#2a1800"/>
    </linearGradient>
    <linearGradient id="f4" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3a2808"/>
      <stop offset="100%" stop-color="#0a0500"/>
    </linearGradient>
    <linearGradient id="f5" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1208"/>
      <stop offset="100%" stop-color="#050300"/>
    </linearGradient>
    <linearGradient id="f6" x1="100%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#1a1005"/>
      <stop offset="100%" stop-color="#604010"/>
    </linearGradient>
    <radialGradient id="shine" cx="62%" cy="22%" r="45%">
      <stop offset="0%" stop-color="#fffaee" stop-opacity="0.22"/>
      <stop offset="60%" stop-color="#f0d888" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#f0d888" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="20" stdDeviation="35" flood-color="#c4a46b" flood-opacity="0.25"/>
    </filter>
    <clipPath id="gem-clip">
      <polygon points="520,95 790,230 870,500 730,820 480,900 220,790 150,490 280,210"/>
    </clipPath>
  </defs>

  <g filter="url(#shadow)">
    <!-- Facettes -->
    <polygon points="520,95 790,230 530,460" fill="url(#f1)"/>
    <polygon points="520,95 280,210 530,460" fill="url(#f2)"/>
    <polygon points="790,230 870,500 530,460" fill="url(#f3)"/>
    <polygon points="870,500 730,820 530,460" fill="url(#f4)"/>
    <polygon points="730,820 480,900 530,460" fill="url(#f4)"/>
    <polygon points="480,900 220,790 530,460" fill="url(#f5)"/>
    <polygon points="220,790 150,490 530,460" fill="url(#f6)"/>
    <polygon points="150,490 280,210 530,460" fill="url(#f6)"/>

    <!-- Shine overlay clippé sur la gemme -->
    <rect x="0" y="0" width="1024" height="1024" fill="url(#shine)" clip-path="url(#gem-clip)"/>

    <!-- Contour -->
    <polygon points="520,95 790,230 870,500 730,820 480,900 220,790 150,490 280,210"
             fill="none" stroke="#c4a46b" stroke-width="3" opacity="0.7"/>

    <!-- Arêtes internes -->
    <line x1="520" y1="95"  x2="530" y2="460" stroke="#c4a46b" stroke-width="1.5" opacity="0.45"/>
    <line x1="790" y1="230" x2="530" y2="460" stroke="#c4a46b" stroke-width="1"   opacity="0.35"/>
    <line x1="870" y1="500" x2="530" y2="460" stroke="#c4a46b" stroke-width="1"   opacity="0.25"/>
    <line x1="730" y1="820" x2="530" y2="460" stroke="#c4a46b" stroke-width="1"   opacity="0.20"/>
    <line x1="480" y1="900" x2="530" y2="460" stroke="#c4a46b" stroke-width="1"   opacity="0.20"/>
    <line x1="220" y1="790" x2="530" y2="460" stroke="#c4a46b" stroke-width="1"   opacity="0.22"/>
    <line x1="150" y1="490" x2="530" y2="460" stroke="#c4a46b" stroke-width="1"   opacity="0.28"/>
    <line x1="280" y1="210" x2="530" y2="460" stroke="#c4a46b" stroke-width="1.5" opacity="0.38"/>

    <!-- Éclats speculaires SUR la gemme -->
    <polygon points="660,128 760,188 700,178" fill="white" opacity="0.60" clip-path="url(#gem-clip)"/>
    <polygon points="710,160 775,200 748,194" fill="white" opacity="0.35" clip-path="url(#gem-clip)"/>
    <polygon points="295,238 335,258 310,270" fill="white" opacity="0.18" clip-path="url(#gem-clip)"/>
  </g>
</svg>
<div class="label">BO</div>
</body>
</html>
`

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 2 })
  await page.setContent(html)
  await page.evaluateHandle('document.fonts.ready')
  await new Promise(r => setTimeout(r, 800))
  await page.screenshot({ path: path.join(ASSETS, 'preview-3D-B.png'), type: 'png' })
  await page.close()
  await browser.close()
  console.log('✓ preview-3D-B.png')
}

run().catch(console.error)
