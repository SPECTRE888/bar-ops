/*!
 * Bar Ops — Electron preload bridge
 * Copyright © 2026 Jérôme Jarrige. All rights reserved.
 * Proprietary and confidential. See LICENSE.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronConfig', {
  supabaseUrl:     'https://hrpcdtkhnewigewomcvv.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycGNkdGtobmV3aWdld29tY3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTE2ODEsImV4cCI6MjA5MjIyNzY4MX0.VExeqSOA8M_kR4Uw8GXBRaqbctQjpZ8DgOn_-n-HJ5c',
  stripePublicKey: 'pk_live_51TPeGrH4pmIQwgqgv1oUnw3u4B1JqqmSOfvUOb13YEh6Wp0vTNpck7oDmUreNa2jqvjuHqxd8UcrYDNNx00162OWLeN',
});

contextBridge.exposeInMainWorld('electronBridge', {
  openExternal:      (u) => ipcRenderer.invoke('open-external', u),
  restartAuthServer: ()  => ipcRenderer.invoke('restart-auth-server'),
  openOAuthWindow:   (u) => ipcRenderer.invoke('open-oauth-window', u),
});
