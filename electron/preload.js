const { contextBridge } = require('electron');
const cfg = require('./config.js');

contextBridge.exposeInMainWorld('electronConfig', {
  supabaseUrl:     cfg.supabaseUrl,
  supabaseAnonKey: cfg.supabaseAnonKey,
  stripePublicKey: cfg.stripePublicKey,
});
