const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('widgetAPI', {
  minimize: () => ipcRenderer.send('widget-minimize'),
  close: () => ipcRenderer.send('widget-close'),
  toggleVisibility: () => ipcRenderer.send('widget-toggle-visibility'),
  
  onMusicStateUpdate: (callback) => {
    ipcRenderer.on('music-state-update', (event, data) => callback(data));
  },
  
  onTrackInfoUpdate: (callback) => {
    ipcRenderer.on('track-info-update', (event, data) => callback(data));
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
}); 