const puppeteer = require('puppeteer')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

// Gem 3D — facettes éclairées individuellement comme Obsidian
const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:${SIZE}px; height:${SIZE}px;
    background:#080808;
    display:flex; align-items:center; justify-content:center;
    border-radius:180px; overflow:hidden;
  }
</style>
</head>
<body>
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Facette top-droite: très éclairée -->
    <linearGradient id="f1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e8d09a"/>
      <stop offset="100%" stop-color="#a07830"/>
    </linearGradient>
    <!-- Facette top-gauche: mi-éclairée -->
    <linearGradient id="f2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#c4a46b"/>
      <stop offset="100%" stop-color="#6b4e1a"/>
    </linearGradient>
    <!-- Facette droite -->
    <linearGradient id="f3" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#b8903a"/>
      <stop offset="100%" stop-color="#3a2800"/>
    </linearGradient>
    <!-- Facette bas-droite: sombre -->
    <linearGradient id="f4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a3510"/>
      <stop offset="100%" stop-color="#0d0800"/>
    </linearGradient>
    <!-- Facette bas-gauche: très sombre -->
    <linearGradient id="f5" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2a1e08"/>
      <stop offset="100%" stop-color="#080500"/>
    </linearGradient>
    <!-- Facette gauche: mi-sombre -->
    <linearGradient id="f6" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7a5820"/>
      <stop offset="100%" stop-color="#1a1000"/>
    </linearGradient>
    <!-- Centre: noyau sombre -->
    <radialGradient id="core" cx="60%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#3a2a0a"/>
      <stop offset="100%" stop-color="#080500"/>
    </radialGradient>
    <!-- Reflet global -->
    <radialGradient id="shine" cx="65%" cy="20%" r="40%">
      <stop offset="0%" stop-color="#fff8e8" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#fff8e8" stop-opacity="0"/>
    </radialGradient>
    <!-- Ombre portée -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="30" stdDeviation="40" flood-color="#c4a46b" flood-opacity="0.20"/>
    </filter>
  </defs>

  <!-- Gem: forme irrégulière type obsidian, pas symétrique -->
  <!-- Points principaux de la pierre:
    Sommet: 520, 95
    Haut-droite: 790, 230
    Droite: 870, 500
    Bas-droite: 730, 820
    Bas: 480, 900
    Bas-gauche: 220, 790
    Gauche: 150, 490
    Haut-gauche: 280, 210
    Point intérieur (centre visuel): 530, 460
  -->

  <g filter="url(#shadow)">
    <!-- Facette 1: sommet → haut-droite → centre (très éclairée, source lumière) -->
    <polygon points="520,95 790,230 530,460" fill="url(#f1)"/>

    <!-- Facette 2: sommet → haut-gauche → centre -->
    <polygon points="520,95 280,210 530,460" fill="url(#f2)"/>

    <!-- Facette 3: haut-droite → droite → centre -->
    <polygon points="790,230 870,500 530,460" fill="url(#f3)"/>

    <!-- Facette 4: droite → bas-droite → centre -->
    <polygon points="870,500 730,820 530,460" fill="url(#f4)"/>

    <!-- Facette 5: bas-droite → bas → centre -->
    <polygon points="730,820 480,900 530,460" fill="url(#f4)"/>

    <!-- Facette 6: bas → bas-gauche → centre (très sombre) -->
    <polygon points="480,900 220,790 530,460" fill="url(#f5)"/>

    <!-- Facette 7: bas-gauche → gauche → centre -->
    <polygon points="220,790 150,490 530,460" fill="url(#f6)"/>

    <!-- Facette 8: gauche → haut-gauche → centre -->
    <polygon points="150,490 280,210 530,460" fill="url(#f6)"/>

    <!-- Contour externe net -->
    <polygon points="520,95 790,230 870,500 730,820 480,900 220,790 150,490 280,210"
             fill="none" stroke="#c4a46b" stroke-width="3" opacity="0.8"/>

    <!-- Arêtes internes (lignes de facettes vers le centre) -->
    <line x1="520" y1="95"  x2="530" y2="460" stroke="#c4a46b" stroke-width="1.5" opacity="0.5"/>
    <line x1="790" y1="230" x2="530" y2="460" stroke="#c4a46b" stroke-width="1" opacity="0.4"/>
    <line x1="870" y1="500" x2="530" y2="460" stroke="#c4a46b" stroke-width="1" opacity="0.3"/>
    <line x1="730" y1="820" x2="530" y2="460" stroke="#c4a46b" stroke-width="1" opacity="0.25"/>
    <line x1="480" y1="900" x2="530" y2="460" stroke="#c4a46b" stroke-width="1" opacity="0.25"/>
    <line x1="220" y1="790" x2="530" y2="460" stroke="#c4a46b" stroke-width="1" opacity="0.3"/>
    <line x1="150" y1="490" x2="530" y2="460" stroke="#c4a46b" stroke-width="1" opacity="0.35"/>
    <line x1="280" y1="210" x2="530" y2="460" stroke="#c4a46b" stroke-width="1.5" opacity="0.45"/>
  </g>

  <!-- Reflet global par-dessus -->
  <polygon points="520,95 790,230 870,500 730,820 480,900 220,790 150,490 280,210"
           fill="url(#shine)"/>

  <!-- Éclat speculaire principal (coin haut-droite) -->
  <polygon points="680,125 790,190 730,175" fill="white" opacity="0.55"/>
  <polygon points="730,155 800,210 765,198" fill="white" opacity="0.30"/>

  <!-- Micro-éclat secondaire -->
  <polygon points="290,230 340,255 308,265" fill="white" opacity="0.18"/>

</svg>
</body>
</html>
`

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 2 })
  await page.setContent(html)
  await page.evaluateHandle('document.fonts.ready')
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: path.join(ASSETS, 'preview-3D-A.png'), type: 'png' })
  await page.close()
  await browser.close()
  console.log('✓ preview-3D-A.png')
}

run().catch(console.error)
