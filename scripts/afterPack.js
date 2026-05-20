const { execSync } = require('child_process')
const path = require('path')

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return

  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productName}.app`
  )

  console.log('[afterPack] Ad-hoc re-signing:', appPath)

  const sign = (target) => {
    try {
      execSync(`codesign --force --sign - --timestamp=none --preserve-metadata=identifier,entitlements "${target}"`, { stdio: 'pipe' })
    } catch (e) {
      // fallback sans preserve-metadata
      try {
        execSync(`codesign --force --sign - --timestamp=none "${target}"`, { stdio: 'pipe' })
      } catch (e2) { /* ignore */ }
    }
  }

  const find = (pattern) => {
    try {
      return execSync(`find "${appPath}" ${pattern}`, { stdio: 'pipe' })
        .toString().trim().split('\n').filter(Boolean)
    } catch (e) { return [] }
  }

  // Signer dans l'ordre : d'abord les composants internes, puis les bundles parents

  // 1. Dylibs et binaires natifs
  for (const p of find('-name "*.dylib"')) sign(p)
  for (const p of find('-name "*.node"')) sign(p)

  // 2. Executables dans les helpers
  for (const p of find('-perm +111 -type f')) sign(p)

  // 3. Frameworks (bundles répertoire)
  for (const p of find('-name "*.framework" -type d')) sign(p)

  // 4. Helper .app bundles
  for (const p of find('-name "*.app" -type d')) sign(p)

  // 5. L'app principale en dernier
  sign(appPath)

  console.log('[afterPack] Ad-hoc signing done.')
}
