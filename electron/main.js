const { app, BrowserWindow, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')

const AUTH_FILE = path.join(__dirname, 'app', 'auth.html')

let mainWin = null

// ─── OAuth popup in-app ───────────────────────────────────────────────────────
// On ouvre Google auth dans une BrowserWindow Electron, pas dans Safari.
// On intercepte la navigation vers le callback pour extraire les tokens.

ipcMain.handle('open-oauth', async (_event, oauthUrl) => {
  return new Promise((resolve) => {
    const popup = new BrowserWindow({
      width: 900,
      height: 700,
      title: 'Connexion — Bar Ops',
      parent: mainWin,
      modal: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    })

    popup.setMenuBarVisibility(false)
    popup.loadURL(oauthUrl)

    function handleRedirect(url) {
      // On intercepte quand Google redirige vers notre callback
      if (!url.includes('127.0.0.1:54321') && !url.startsWith('barops://')) return false
      try {
        const fixed  = url.replace(/^barops:\/\//, 'http://barops/')
        const parsed = new URL(fixed)
        const search = parsed.search || ''
        const hash   = parsed.hash   || ''
        popup.destroy()
        const authUrl = `file://${AUTH_FILE.replace(/\\/g, '/')}${search}${hash}`
        mainWin.loadURL(authUrl)
      } catch(e) { console.error('oauth redirect parse error:', e) }
      resolve()
      return true
    }

    popup.webContents.on('will-redirect', (_e, url) => handleRedirect(url))
    popup.webContents.on('will-navigate', (_e, url) => handleRedirect(url))
    popup.on('closed', () => resolve())
  })
})

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
