const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const DiscordRPCManager = require('./discord-rpc');

require('dotenv').config({ path: path.join(__dirname, '.env') });

let mainWindow;
let widgetWindow;
let discordRPC;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        visualEffectState: 'active',
        backgroundColor: '#00000000',
        frame: true,
        transparent: false,
        roundedCorners: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: false,
        autoHideMenuBar: true,
        show: true,
        thickFrame: true,
        hasShadow: false,
        
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          backgroundThrottling: false,
          preload: path.join(__dirname, 'preload.js')
        },
      });

  mainWindow.setBackgroundMaterial('acrylic');
    mainWindow.loadURL(`${process.env.MAIN_SERVER_URL}/public/views/index.html`);
    mainWindow.webContents.openDevTools();
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
    
    mainWindow.on('blur', () => {
        mainWindow.setMenuBarVisibility(false);
    });
    mainWindow.on('focus', () => {
        mainWindow.setMenuBarVisibility(false);
    });
    mainWindow.on('restore', () => {
        mainWindow.setMenuBarVisibility(false);
    });
    mainWindow.on('maximize', () => {
        mainWindow.setMenuBarVisibility(false);
    });
    mainWindow.on('unmaximize', () => {
        mainWindow.setMenuBarVisibility(false);
    });
    mainWindow.on('resize', () => {
        mainWindow.setMenuBarVisibility(false);
    });
    mainWindow.on('move', () => {
        mainWindow.setMenuBarVisibility(false);
    });
    mainWindow.on('show', () => {
        mainWindow.setMenuBarVisibility(false);
    });
    mainWindow.on('hide', () => {
        mainWindow.setMenuBarVisibility(false);
    });
    mainWindow.webContents.on('context-menu', (e) => {
        e.preventDefault();
    });
}

function createWidget() {
    widgetWindow = new BrowserWindow({
        width: 300,
        height: 200,
        minWidth: 300,
        minHeight: 200,
        maxWidth: 300,
        maxHeight: 200,
        frame: false,
        transparent: false,
        backgroundColor: '#00000000',
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: false,
        autoHideMenuBar: true,
        show: true,
        thickFrame: false,
        hasShadow: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'widget-preload.js')
        }
    });

    widgetWindow.loadURL(`${process.env.MAIN_SERVER_URL}/public/views/widget.html`);
    
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    widgetWindow.setPosition(width - 320, 20);
    
    widgetWindow.once('ready-to-show', () => {
        widgetWindow.show();
    });
    
    widgetWindow.on('blur', () => {
        widgetWindow.setMenuBarVisibility(false);
    });
    widgetWindow.on('focus', () => {
        widgetWindow.setMenuBarVisibility(false);
    });
    widgetWindow.on('restore', () => {
        widgetWindow.setMenuBarVisibility(false);
    });
    widgetWindow.on('maximize', () => {
        widgetWindow.setMenuBarVisibility(false);
    });
    widgetWindow.on('unmaximize', () => {
        widgetWindow.setMenuBarVisibility(false);
    });
    widgetWindow.on('resize', () => {
        widgetWindow.setMenuBarVisibility(false);
    });
    widgetWindow.on('move', () => {
        widgetWindow.setMenuBarVisibility(false);
    });
    widgetWindow.on('show', () => {
        widgetWindow.setMenuBarVisibility(false);
    });
    widgetWindow.on('hide', () => {
        widgetWindow.setMenuBarVisibility(false);
    });
    widgetWindow.webContents.on('context-menu', (e) => {
        e.preventDefault();
    });
}

async function initializeDiscordRPC() {
    discordRPC = new DiscordRPCManager();
    await discordRPC.initialize();
}

ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});

ipcMain.on('window-close', () => {
    mainWindow?.close();
});

ipcMain.on('widget-minimize', () => {
    widgetWindow?.minimize();
});

ipcMain.on('widget-close', () => {
    widgetWindow?.close();
});

ipcMain.on('widget-toggle-visibility', () => {
    if (widgetWindow?.isVisible()) {
        widgetWindow.hide();
    } else {
        widgetWindow?.show();
    }
});

ipcMain.on('music-state-update', (event, data) => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
        widgetWindow.webContents.send('music-state-update', data);
    }
    
    if (discordRPC) {
        discordRPC.updatePlaybackState(data.isPlaying);
    }
});

ipcMain.on('track-info-update', (event, data) => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
        widgetWindow.webContents.send('track-info-update', data);
    }
    
    if (discordRPC) {
        discordRPC.updateTrackInfo(data);
    }
});

ipcMain.on('discord-rpc-update-progress', (event, data) => {
    if (discordRPC) {
        discordRPC.updateProgress(data.currentTime, data.duration);
    }
});

ipcMain.on('discord-rpc-clear', () => {
    if (discordRPC) {
        discordRPC.clearActivity();
    }
});

app.whenReady().then(async () => {
    const { Menu } = require('electron');
    Menu.setApplicationMenu(null);
    
    await initializeDiscordRPC();
    
    createWindow();
    createWidget();
    
    app.on('browser-window-blur', (event, window) => {
        if (window && !window.isDestroyed()) {
            window.setMenuBarVisibility(false);
        }
    });
    app.on('browser-window-focus', (event, window) => {
        if (window && !window.isDestroyed()) {
            window.setMenuBarVisibility(false);
        }
    });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (discordRPC) {
        discordRPC.disconnect();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
    createWidget();
  } else {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.setMenuBarVisibility(false);
      }
    });
  }
});

app.on('before-quit', () => {
    if (discordRPC) {
        discordRPC.disconnect();
    }
}); 