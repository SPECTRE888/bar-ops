const sharp = require('sharp')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const ASSETS = path.join(__dirname, 'assets')
if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true })

// SVG icon: cocktail glass silhouette + "BO" monogram, dark bg
const SIZE = 1024
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
  <!-- Background with rounded corners -->
  <rect width="1024" height="1024" rx="200" ry="200" fill="#1a1a2e"/>

  <!-- Gradient overlay -->
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#16213e"/>
      <stop offset="100%" stop-color="#0f3460"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8c97e"/>
      <stop offset="100%" stop-color="#c9982a"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="200" ry="200" fill="url(#bg)"/>

  <!-- Cocktail glass (martini shape) -->
  <!-- Top rim -->
  <line x1="220" y1="260" x2="804" y2="260" stroke="url(#glass)" stroke-width="28" stroke-linecap="round"/>
  <!-- Left side of V -->
  <line x1="220" y1="260" x2="512" y2="590" stroke="url(#glass)" stroke-width="28" stroke-linecap="round"/>
  <!-- Right side of V -->
  <line x1="804" y1="260" x2="512" y2="590" stroke="url(#glass)" stroke-width="28" stroke-linecap="round"/>
  <!-- Stem -->
  <line x1="512" y1="590" x2="512" y2="760" stroke="url(#glass)" stroke-width="28" stroke-linecap="round"/>
  <!-- Base -->
  <line x1="380" y1="760" x2="644" y2="760" stroke="url(#glass)" stroke-width="28" stroke-linecap="round"/>

  <!-- Olive / garnish dot -->
  <circle cx="512" cy="390" r="38" fill="#e8c97e" opacity="0.9"/>
  <circle cx="512" cy="390" r="18" fill="#1a1a2e"/>

  <!-- "BAR OPS" text -->
  <text x="512" y="900" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="100" fill="#e8c97e" text-anchor="middle" letter-spacing="8">BAR OPS</text>
</svg>`

async function run() {
  const png1024 = path.join(ASSETS, 'icon-1024.png')

  await sharp(Buffer.from(svg))
    .png()
    .toFile(png1024)

  console.log('✓ icon-1024.png')

  // Generate sizes needed for .icns
  const sizes = [16, 32, 64, 128, 256, 512, 1024]
  const iconsetDir = path.join(ASSETS, 'icon.iconset')
  if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir)

  for (const s of sizes) {
    await sharp(png1024).resize(s, s).png().toFile(path.join(iconsetDir, `icon_${s}x${s}.png`))
    if (s <= 512) {
      await sharp(png1024).resize(s * 2, s * 2).png().toFile(path.join(iconsetDir, `icon_${s}x${s}@2x.png`))
    }
  }
  console.log('✓ iconset generated')

  // Build .icns
  execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(ASSETS, 'icon.icns')}"`)
  console.log('✓ icon.icns')

  // Build .ico (256px PNG renamed — electron-builder accepts PNG for ico on win cross-build)
  await sharp(png1024).resize(256, 256).png().toFile(path.join(ASSETS, 'icon.ico'))
  console.log('✓ icon.ico (256px PNG)')

  // Clean up iconset
  fs.rmSync(iconsetDir, { recursive: true })
  console.log('\nDone! Icons in electron/assets/')
}

run().catch(console.error)
