const { app, BrowserWindow, shell } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')

const AUTH_FILE = path.join(__dirname, 'app', 'auth.html')
const APP_FILE  = path.join(__dirname, 'app', 'app.html')

let mainWin = null
let pendingCallbackUrl = null

// ─── Custom protocol: barops:// ──────────────────────────────────────────────
// Google redirige vers barops://callback#access_token=...
// macOS ouvre l'app Electron directement — plus fiable que localhost:54321

function handleCallbackUrl(rawUrl) {
  try {
    // barops://callback?action=login#access_token=...
    // new URL() ne parse pas bien les schemes custom, on le remplace
    const httpUrl = rawUrl.replace(/^barops:\/\//, 'http://barops/')
    const parsed  = new URL(httpUrl)
    const search  = parsed.search || ''   // ?action=login
    const hash    = parsed.hash   || ''   // #access_token=...

    if (!mainWin) { pendingCallbackUrl = rawUrl; return }
    mainWin.show()
    mainWin.focus()
    const authUrl = `file://${AUTH_FILE.replace(/\\/g, '/')}${search}${hash}`
    mainWin.loadURL(authUrl)
  } catch(e) {
    console.error('handleCallbackUrl error:', e)
  }
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

  // Tout ce qui n'est pas local → browser système
  mainWin.webContents.setWindowOpenHandler(({ url: u }) => {
    if (u.startsWith('file://') || u.startsWith('barops://')) return { action: 'allow' }
    shell.openExternal(u)
    return { action: 'deny' }
  })

  mainWin.webContents.on('will-navigate', (event, u) => {
    if (!u.startsWith('file://') && !u.startsWith('barops://')) {
      event.preventDefault()
      shell.openExternal(u)
    }
  })

  // Si un callback est arrivé avant la création de la fenêtre
  if (pendingCallbackUrl) {
    const pending = pendingCallbackUrl
    pendingCallbackUrl = null
    mainWin.webContents.once('did-finish-load', () => handleCallbackUrl(pending))
  }
}

// ─── Single instance ──────────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  // Windows/Linux : deep link via second instance
  app.on('second-instance', (_event, argv) => {
    const url = argv.find(a => a.startsWith('barops://'))
    if (url) handleCallbackUrl(url)
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
    `).then(() => setTimeout(() => autoUpdater.quitAndInstall(false, true), 5000)).catch(() => {})
  })

  autoUpdater.on('error', (err) => {
    console.error('[updater] error:', err?.message || err)
  })

  autoUpdater.checkForUpdates().catch((err) => console.error('[updater] check failed:', err?.message))
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 30 * 60 * 1000)
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Remove macOS quarantine on first launch
  if (process.platform === 'darwin' && app.isPackaged) {
    try {
      const { execSync } = require('child_process')
      const appPath = process.execPath.split('.app/Contents/')[0] + '.app'
      execSync(`xattr -cr "${appPath}"`)
    } catch(e) {}
  }

  createWindow()
  if (app.isPackaged) setupUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// macOS : deep link via open-url
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleCallbackUrl(url)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
