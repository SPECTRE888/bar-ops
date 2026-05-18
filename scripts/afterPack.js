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

  // Strip frameworks and helpers
  const find = (pattern) => {
    try {
      return execSync(`find "${appPath}" ${pattern}`, { stdio: 'pipe' })
        .toString().trim().split('\n').filter(Boolean)
    } catch (e) { return [] }
  }

  const binaries = [
    ...find('-name "*.dylib"'),
    ...find('-name "*.node"'),
    ...find('-name "Electron Framework" -type f'),
    ...find('-name "*.helper" -type f'),
    ...find('-perm +111 -type f'),
  ]

  for (const bin of binaries) strip(bin)
  strip(appPath)

  console.log('[afterPack] Done stripping signatures.')
}
