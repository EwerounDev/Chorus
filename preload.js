const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('env', {
  API_URL: process.env.API_URL,
  PARSER_SERVER_URL: process.env.PARSER_SERVER_URL,
  MAIN_SERVER_URL: process.env.MAIN_SERVER_URL,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_APPLICATION_NAME: process.env.DISCORD_APPLICATION_NAME
});

contextBridge.exposeInMainWorld('session', {
  save: (data) => ipcRenderer.invoke('save-session', data),
  load: () => ipcRenderer.invoke('load-session'),
  delete: () => ipcRenderer.invoke('delete-session')
});


contextBridge.exposeInMainWorld('store', {
  get: (key) => ipcRenderer.invoke('store-get', key),
  set: (key, value) => ipcRenderer.invoke('store-set', { key, value }),
  delete: (key) => ipcRenderer.invoke('store-delete', key),
  clear: () => ipcRenderer.invoke('store-clear')
});

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  reload: () => ipcRenderer.send('window-reload'),
  openExternal: (url) => ipcRenderer.send('open-external-link', url),
  
  sendMusicStateUpdate: (data) => ipcRenderer.send('music-state-update', data),
  sendTrackInfoUpdate: (data) => ipcRenderer.send('track-info-update', data),
  
  updateDiscordRPCProgress: (data) => ipcRenderer.send('discord-rpc-update-progress', data),
  clearDiscordRPC: () => ipcRenderer.send('discord-rpc-clear'),
  setWidgetVisibility: (isEnabled) => {
      ipcRenderer.invoke('set-widget-visibility', isEnabled);
  },
  on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  send: (channel, data) => {
      ipcRenderer.send(channel, data);
  },
  openExternal: (url) => {
      ipcRenderer.send('open-external', url);
  },
  reload: () => {
      ipcRenderer.send('reload');
  }
}); 

contextBridge.exposeInMainWorld('googleAuth', {
    getAuthUrl: () => ipcRenderer.invoke('google-auth-url'),
    getToken: (code) => ipcRenderer.invoke('google-auth-token', code),
    isAuthenticated: () => ipcRenderer.invoke('google-auth-status'),
    logout: () => ipcRenderer.invoke('google-auth-logout'),
    onAuthCallback: (callback) => {
        ipcRenderer.on('google-auth-callback', (event, code) => callback(code));
    }
}); 

contextBridge.exposeInMainWorld('sessionAPI', {
    saveToken: (token) => ipcRenderer.invoke('save-token', token),
    loadToken: () => ipcRenderer.invoke('load-token'),
    saveSession: (data) => ipcRenderer.invoke('save-session', data),
    loadSession: () => ipcRenderer.invoke('load-session'),
    clearSession: () => ipcRenderer.invoke('clear-session')
}); 