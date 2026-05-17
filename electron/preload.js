const { contextBridge, ipcRenderer } = require('electron');
const cfg = require('./config.js');

// Expose la config au renderer (auth.html, app.html) via window.electronConfig
const { app } = require('electron').remote || {};
const version = process.env.npm_package_version || require('../package.json').version;

contextBridge.exposeInMainWorld('electronConfig', {
  supabaseUrl:     cfg.supabaseUrl,
  supabaseAnonKey: cfg.supabaseAnonKey,
  stripePublicKey: cfg.stripePublicKey,
  version,
});
