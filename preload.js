const { contextBridge, ipcRenderer } = require('electron');

// Передаем переменные окружения в renderer процесс
contextBridge.exposeInMainWorld('env', {
  API_URL: process.env.API_URL,
  PARSER_SERVER_URL: process.env.PARSER_SERVER_URL,
  MAIN_SERVER_URL: process.env.MAIN_SERVER_URL,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_APPLICATION_NAME: process.env.DISCORD_APPLICATION_NAME
});

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  sendMusicStateUpdate: (data) => ipcRenderer.send('music-state-update', data),
  sendTrackInfoUpdate: (data) => ipcRenderer.send('track-info-update', data),
  
  updateDiscordRPCProgress: (data) => ipcRenderer.send('discord-rpc-update-progress', data),
  clearDiscordRPC: () => ipcRenderer.send('discord-rpc-clear')
}); 