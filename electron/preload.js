const { contextBridge } = require('electron');
const cfg = require('./config.js');

// Expose la config au renderer (auth.html, app.html) via window.electronConfig
contextBridge.exposeInMainWorld('electronConfig', {
  supabaseUrl:     cfg.supabaseUrl,
  supabaseAnonKey: cfg.supabaseAnonKey,
  stripePublicKey: cfg.stripePublicKey,
});
