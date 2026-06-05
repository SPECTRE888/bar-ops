/*!
 * Bar Ops — Electron main process
 * Copyright © 2026 Jérôme Jarrige. All rights reserved.
 * Proprietary and confidential. See LICENSE file for terms.
 * Unauthorized copying, modification, distribution, or use of this file,
 * via any medium, is strictly prohibited.
 */
const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron')
const http = require('http')
const path = require('path')
const url  = require('url')

const AUTH_PORT = 59876
const AUTH_FILE = path.join(__dirname, 'app', 'auth.html')

let mainWin   = null
let authServer = null

// ─── IPC handlers ────────────────────────────────────────────────────────────
ipcMain.handle('open-external', (_e, u) => shell.openExternal(u))
ipcMain.handle('restart-auth-server', () => {
  if (authServer?.listening) return 'already-running'
  startAuthServer()
  return 'restarted'
})

// Ouvre l'OAuth Google dans une fenêtre Electron interne (pas de navigateur externe)
let oauthWin = null
ipcMain.handle('open-oauth-window', (_e, oauthUrl) => {
  if (oauthWin && !oauthWin.isDestroyed()) oauthWin.close()

  oauthWin = new BrowserWindow({
    width: 480,
    height: 640,
    title: 'Connexion — Bar Ops',
    parent: mainWin,
    modal: false,
    resizable: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })

  oauthWin.setMenuBarVisibility(false)
  oauthWin.loadURL(oauthUrl)

  // Ferme la fenêtre dès que Google redirige vers notre callback local
  const closeOnCallback = (_, navUrl) => {
    if (navUrl && navUrl.startsWith(`http://127.0.0.1:${AUTH_PORT}`)) {
      setTimeout(() => {
        if (oauthWin && !oauthWin.isDestroyed()) oauthWin.close()
      }, 800)
    }
  }
  oauthWin.webContents.on('did-navigate', closeOnCallback)
  oauthWin.webContents.on('will-redirect', closeOnCallback)
  oauthWin.on('closed', () => { oauthWin = null })
})

// ─── Local OAuth callback server ─────────────────────────────────────────────
function startAuthServer() {
  if (authServer?.listening) return           // already up, skip
  authServer = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true)

    if (parsed.pathname === '/callback') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>Bar Ops — Connexion réussie</title>
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#080808;color:#ede8e0;display:flex;align-items:center;justify-content:center;height:100vh}
          .box{text-align:center;padding:48px 40px;max-width:360px}
          .icon{font-size:52px;margin-bottom:20px;animation:pop .4s ease}
          @keyframes pop{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}
          h1{font-size:20px;font-weight:500;letter-spacing:.06em;margin-bottom:10px;color:#c4a46b}
          p{font-size:13px;color:#666;margin-bottom:24px;line-height:1.6}
          .btn{padding:11px 32px;background:#c4a46b;color:#080808;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
          .btn:hover{background:#d4b47a}
        </style>
        </head><body>
        <div class="box">
          <div class="icon">✓</div>
          <h1>BAR OPS</h1>
          <p>Authentification réussie.<br>L'application est prête.</p>
          <button class="btn" id="btn">Fermer cet onglet</button>
        </div>
        <script>
          const hash   = window.location.hash   || ''
          const search = window.location.search || ''
          fetch('/token?' + new URLSearchParams({ hash, search })).catch(()=>{})

          function closeTab(){
            window.open('about:blank','_self');
            window.close();
          }
          document.getElementById('btn').addEventListener('click', closeTab)
          // Tentative auto après 1s
          setTimeout(closeTab, 1000)
        </script></body></html>`)
      return
    }

    if (parsed.pathname === '/token') {
      const hash   = parsed.query.hash   || ''
      const search = parsed.query.search || ''
      res.writeHead(200); res.end('ok')
      if (mainWin) {
        // Petit délai pour laisser le navigateur afficher la page de succès
        setTimeout(() => {
          mainWin.show()
          mainWin.focus()
          mainWin.loadURL(`file://${AUTH_FILE.replace(/\\/g, '/')}${search}${hash}`)
        }, 400)
      }
      return
    }

    res.writeHead(404); res.end()
  })

  authServer.on('error', (e) => {
    console.error('[authServer] error:', e.message)
    authServer = null   // allow restart on next attempt
  })
  authServer.on('close', () => { authServer = null })
  authServer.listen(AUTH_PORT, '127.0.0.1', () => {
    console.log(`Auth server listening on http://127.0.0.1:${AUTH_PORT}`)
  })
}

// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Bar Ops',
    icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.icns'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWin.webContents.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  )

  mainWin.maximize()
  mainWin.loadFile(AUTH_FILE)

  mainWin.webContents.setWindowOpenHandler(({ url: u }) => {
    if (u.startsWith('file://')) return { action: 'allow' }
    shell.openExternal(u)
    return { action: 'deny' }
  })

  mainWin.webContents.on('will-navigate', (event, u) => {
    if (!u.startsWith('file://') && !u.startsWith(`http://127.0.0.1:${AUTH_PORT}`)) {
      event.preventDefault()
      shell.openExternal(u)
    }
  })
}

// ─── Single instance ──────────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWin) { mainWin.show(); mainWin.focus() }
  })
}

// ─── Auto-updater custom (bypass Squirrel.Mac — app non signée) ───────────────
const https    = require('https')
const fs       = require('fs')
const os       = require('os')
const { spawn } = require('child_process')

const GH_OWNER = 'SPECTRE888'
const GH_REPO  = 'bar-ops'

function toast(msg) {
  const safe = msg.replace(/\\/g, '\\\\').replace(/`/g, '\\`')
  mainWin?.webContents.executeJavaScript(`
    if(typeof showToast==='function') showToast(\`${safe}\`);
    else console.warn('[updater]', \`${safe}\`);
  `).catch(() => {})
}

function get(url) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      https.get(u, { headers: { 'User-Agent': 'Bar-Ops-Updater' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302)
          return follow(res.headers.location)
        let d = ''
        res.on('data', c => d += c)
        res.on('end', () => resolve(d))
      }).on('error', reject)
    }
    follow(url)
  })
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (u, redirects) => {
      if (redirects > 10) return reject(new Error('Trop de redirections'))
      https.get(u, { headers: { 'User-Agent': 'Bar-Ops-Updater' } }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          res.resume() // consommer le corps pour libérer la connexion
          return follow(res.headers.location, redirects + 1)
        }
        if (res.statusCode !== 200) {
          res.resume()
          return reject(new Error(`HTTP ${res.statusCode} lors du téléchargement`))
        }
        const f = fs.createWriteStream(dest)
        res.pipe(f)
        f.on('finish', () => f.close(() => resolve()))
        f.on('error', reject)
      }).on('error', reject)
    }
    follow(url, 0)
  })
}

function semverGt(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return true
    if (pa[i] < pb[i]) return false
  }
  return false
}

async function checkAndUpdate() {
  try {
    const raw     = await get(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/latest`)
    const release = JSON.parse(raw)
    const latest  = release.tag_name.replace(/^v/, '')
    const current = app.getVersion()

    if (!semverGt(latest, current)) return  // déjà à jour

    toast(`Mise à jour v${latest} disponible — téléchargement…`)

    const asset = release.assets.find(a => a.name.match(/arm64-mac\.zip$/) && !a.name.endsWith('.blockmap'))
    if (!asset) throw new Error('Asset ZIP introuvable dans la release')

    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'bar-ops-upd-'))
    const zipPath = path.join(tmpDir, 'update.zip')

    await download(asset.browser_download_url, zipPath)
    toast('Installation en cours…')

    const appPath   = process.execPath.split('.app/Contents/')[0] + '.app'
    const extractDir = path.join(tmpDir, 'ext')
    fs.mkdirSync(extractDir)

    // Extrait, signe en ad-hoc, remplace l'app en place, relance
    const logFile = path.join(tmpDir, 'update.log')
    const script = [
      `exec > "${logFile}" 2>&1`,
      `set -ex`,
      `echo "=== Bar Ops update script ==="`,
      `echo "Waiting for app to quit..."`,
      `sleep 5`,
      `# Attendre que le process soit vraiment mort`,
      `for i in $(seq 1 20); do`,
      `  pgrep -f "Bar Ops" >/dev/null 2>&1 || break`,
      `  sleep 1`,
      `done`,
      `echo "App quit confirmed"`,
      `cd "${extractDir}"`,
      `unzip -q "${zipPath}"`,
      `NEWAPP=$(find "${extractDir}" -maxdepth 2 -name "*.app" -type d | head -1)`,
      `echo "Found: $NEWAPP"`,
      `if [ -z "$NEWAPP" ]; then echo "ERROR: no .app found"; exit 1; fi`,
      `xattr -cr "$NEWAPP"`,
      `echo "Removing old app..."`,
      `rm -rf "${appPath}"`,
      `echo "Copying new app..."`,
      `cp -R "$NEWAPP" "${appPath}"`,
      `xattr -cr "${appPath}"`,
      `codesign --force --deep --sign - --timestamp=none "${appPath}" 2>/dev/null || true`,
      `echo "Opening app..."`,
      `open "${appPath}"`,
      `echo "Done."`,
    ].join('\n')

    toast('Mise à jour prête — redémarrage dans 3s…')
    setTimeout(() => {
      spawn('bash', ['-c', script], { detached: true, stdio: 'ignore' }).unref()
      app.quit()
    }, 3000)

  } catch (err) {
    console.error('[updater]', err?.message || err)
    toast(`Mise à jour échouée : ${err?.message || err}`)
  }
}

function setupUpdater() {
  setTimeout(checkAndUpdate, 10000)
  setInterval(checkAndUpdate, 30 * 60 * 1000)
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.isPackaged) {
    try {
      const { execSync } = require('child_process')
      const appPath = process.execPath.split('.app/Contents/')[0] + '.app'
      execSync(`xattr -cr "${appPath}"`)
    } catch(e) {}
  }

  startAuthServer()
  createWindow()
  if (app.isPackaged) setupUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  authServer?.close()
  if (process.platform !== 'darwin') app.quit()
})
