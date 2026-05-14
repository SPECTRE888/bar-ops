const sharp = require('sharp')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const ASSETS = path.join(__dirname, 'assets')

const apps = [
  { src: 'final-TV-BAR2.png',      name: 'bar-ops' },
  { src: 'final-TV-TRAITEUR.png',  name: 'traiteur-ops' },
  { src: 'final-TV-EVENT2.png',    name: 'event-ops' },
]

async function buildIcns(pngPath, name) {
  const iconsetDir = path.join(ASSETS, `${name}.iconset`)
  if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir)
  const sizes = [16, 32, 64, 128, 256, 512]
  for (const s of sizes) {
    await sharp(pngPath).resize(s, s).png().toFile(path.join(iconsetDir, `icon_${s}x${s}.png`))
    await sharp(pngPath).resize(s*2, s*2).png().toFile(path.join(iconsetDir, `icon_${s}x${s}@2x.png`))
  }
  execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(ASSETS, `${name}.icns`)}"`)
  fs.rmSync(iconsetDir, { recursive: true })
}

async function run() {
  for (const app of apps) {
    const src = path.join(ASSETS, app.src)
    // PNG 1024
    await sharp(src).resize(1024, 1024).png().toFile(path.join(ASSETS, `${app.name}-1024.png`))
    // .icns
    await buildIcns(src, app.name)
    // .ico 256px
    await sharp(src).resize(256, 256).png().toFile(path.join(ASSETS, `${app.name}.ico`))
    console.log(`✓ ${app.name}: .icns + .ico + 1024px`)
  }

  // Copie bar-ops comme icône active de l'app Electron
  fs.copyFileSync(path.join(ASSETS, 'bar-ops.icns'), path.join(ASSETS, 'icon.icns'))
  fs.copyFileSync(path.join(ASSETS, 'bar-ops.ico'),  path.join(ASSETS, 'icon.ico'))
  fs.copyFileSync(path.join(ASSETS, 'bar-ops-1024.png'), path.join(ASSETS, 'icon-1024.png'))
  console.log('\n✓ icon.icns + icon.ico mis à jour pour l\'app Electron')
}

run().catch(console.error)
