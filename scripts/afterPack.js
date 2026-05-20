const { execSync } = require('child_process')
const path = require('path')

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return

  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productName}.app`
  )

  console.log('[afterPack] Stripping all code signatures from:', appPath)

  const strip = (target) => {
    try {
      execSync(`codesign --remove-signature "${target}"`, { stdio: 'pipe' })
    } catch (e) {
      // Ignore — some binaries may not have a signature
    }
  }

  const find = (pattern) => {
    try {
      return execSync(`find "${appPath}" ${pattern}`, { stdio: 'pipe' })
        .toString().trim().split('\n').filter(Boolean)
    } catch (e) { return [] }
  }

  // 1. Strip nested .app helper bundles (e.g. Electron Helper.app)
  const helperApps = find('-name "*.app" -type d')
  for (const p of helperApps) strip(p)

  // 2. Strip .framework bundles
  const frameworks = find('-name "*.framework" -type d')
  for (const p of frameworks) strip(p)

  // 3. Strip individual binaries & dylibs
  const binaries = [
    ...find('-name "*.dylib"'),
    ...find('-name "*.node"'),
    ...find('-perm +111 -type f'),
  ]
  for (const bin of binaries) strip(bin)

  // 4. Strip the top-level .app bundle last
  strip(appPath)

  console.log('[afterPack] Done stripping signatures.')
}
