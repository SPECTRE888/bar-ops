const { app, BrowserWindow, shell } = require('electron')
const { autoUpdater } = require('electron-updater')
const http = require('http')
const path = require('path')
const url  = require('url')

const AUTH_PORT = 54321
const AUTH_FILE = path.join(__dirname, 'app', 'auth.html')

let mainWin   = null
let authServer = null

// ─── Local OAuth callback server ─────────────────────────────────────────────
function startAuthServer() {
  authServer = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true)

    if (parsed.pathname === '/callback') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>Bar Ops — Connexion...</title>
        <style>body{font-family:sans-serif;background:#080808;color:#c4a46b;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-size:18px}</style>
        </head><body><p>Connexion réussie, retour à l'application...</p>
        <script>
          const hash   = window.location.hash   || ''
          const search = window.location.search || ''
          fetch('/token?' + new URLSearchParams({ hash, search })).then(() => window.close())
        </script></body></html>`)
      return
    }

    if (parsed.pathname === '/token') {
      const hash   = parsed.query.hash   || ''
      const search = parsed.query.search || ''
      res.writeHead(200); res.end('ok')
      if (mainWin) {
        mainWin.show(); mainWin.focus()
        mainWin.loadURL(`file://${AUTH_FILE.replace(/\\/g, '/')}${search}${hash}`)
      }
      return
    }

    res.writeHead(404); res.end()
  })

  authServer.on('error', (e) => console.error('[authServer] error:', e.message))
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

// ─── Auto-updater ─────────────────────────────────────────────────────────────
function setupUpdater() {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWin?.webContents.executeJavaScript(`
      if(typeof showToast==='function') showToast('Mise à jour v${info?.version || ''} disponible — téléchargement en cours…');
    `).catch(() => {})
  })

  autoUpdater.on('update-downloaded', () => {
    mainWin?.webContents.executeJavaScript(`
      if(typeof showToast==='function') showToast('Mise à jour prête — redémarrage dans 5s…');
    `).catch(() => {})
    setTimeout(() => autoUpdater.quitAndInstall(false, true), 5000)
  })

  autoUpdater.on('error', (err) => console.error('[updater] error:', err?.message || err))
  autoUpdater.checkForUpdates().catch((err) => console.error('[updater] check failed:', err?.message))
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 30 * 60 * 1000)
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
