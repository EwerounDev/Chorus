const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const DiscordRPCManager = require('./discord-rpc.js');
const Store = require('electron-store');
require('dotenv').config({ path: path.join(__dirname, '.env') });

app.commandLine.appendSwitch('force-gpu-mem-available-mb', '128');

app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('force-gpu-mem-available-mb', '512');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512');
app.commandLine.appendSwitch('enable-precise-memory-info');

let mainWindow;
let widgetWindow;
let discordRPC;
let staticServer = null;
const sessionFile = path.join(app.getPath('userData'), 'session.json');

async function startStaticServer() {
  try {
    const express = require('express');
    const cors = require('cors');
    const serverApp = express();
    const PORT = process.env.MAIN_SERVER_PORT;

    const authenticateRequest = (req, res, next) => {
      const token = req.headers['x-auth-token'];
      if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') return next();
      if (!token || token !== process.env.API_SECRET) return res.status(401).json({ error: 'Unauthorized' });
      next();
    };

    serverApp.use(cors({ origin: ['http://localhost:*', 'http://127.0.0.1:*'], credentials: true }));
    serverApp.use('/public', authenticateRequest, express.static(path.join(__dirname, 'public')));
    serverApp.use('/config', authenticateRequest, express.static(path.join(__dirname, 'config')));
    serverApp.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/views/index.html')));
    serverApp.get('/widget', (req, res) => res.sendFile(path.join(__dirname, 'public/views/widget.html')));
    staticServer = serverApp.listen(PORT);
    process.env.MAIN_SERVER_URL = `http://localhost:${PORT}`;
    return true;
  } catch {
    return false;
  }
}

function encryptSession(data) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.SESSION_KEY);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), encrypted };
}

function decryptSession(encryptedData) {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.SESSION_KEY);
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

function saveSession(data) {
  try {
    const encryptedData = encryptSession(data);
    fs.writeFileSync(sessionFile, JSON.stringify(encryptedData, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

function loadSession() {
  try {
    if (fs.existsSync(sessionFile)) {
      const data = fs.readFileSync(sessionFile, 'utf8');
      const encryptedData = JSON.parse(data);
      return decryptSession(encryptedData);
    }
    return null;
  } catch {
    return null;
  }
}

function deleteSession() {
  try {
    if (fs.existsSync(sessionFile)) {
      fs.unlinkSync(sessionFile);
    }
    return true;
  } catch {
    return false;
  }
}

ipcMain.handle('save-session', async (_, data) => {
  const encryptedData = encryptSession(data);
  fs.writeFileSync(sessionFile, JSON.stringify(encryptedData, null, 2), 'utf-8');
  return true;
});

ipcMain.handle('load-session', async () => {
  if (fs.existsSync(sessionFile)) {
    const data = fs.readFileSync(sessionFile, 'utf-8');
    try {
      const encryptedData = JSON.parse(data);
      return decryptSession(encryptedData) || {};
    } catch {
      return {};
    }
  }
  return {};
});

ipcMain.handle('clear-session', async () => {
  if (fs.existsSync(sessionFile)) fs.unlinkSync(sessionFile);
  return true;
});

ipcMain.handle('save-token', async (_, token) => {
  fs.writeFileSync(sessionFile, JSON.stringify({ token }), 'utf-8');
  return true;
});

ipcMain.handle('load-token', async () => {
  if (fs.existsSync(sessionFile)) {
    const data = fs.readFileSync(sessionFile, 'utf-8');
    try {
      return JSON.parse(data).token || null;
    } catch {
      return null;
    }
  }
  return null;
});

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
    icon: path.join(__dirname, 'public/assets/logo.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableWebSQL: false,
      spellcheck: false,
      minimumFontSize: 12,
      defaultFontSize: 14
    }
  });

  mainWindow.webContents.setFrameRate(30);
  mainWindow.webContents.setBackgroundThrottling(true);
  mainWindow.on('minimize', () => mainWindow.webContents.session.clearCache());
  mainWindow.loadURL(`${process.env.MAIN_SERVER_URL}/public/views/index.html`);
 // mainWindow.webContents.openDevTools();
  mainWindow.once('ready-to-show', () => mainWindow.show());

  const hideMenuEvents = ['blur', 'focus', 'restore', 'maximize', 'unmaximize', 'resize', 'move', 'show', 'hide'];
  hideMenuEvents.forEach(event => mainWindow.on(event, () => mainWindow.setMenuBarVisibility(false)));
  mainWindow.webContents.on('context-menu', e => e.preventDefault());
  mainWindow.on('closed', () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.close();
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
    icon: path.join(__dirname, 'public/assets/logo.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'widget-preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  widgetWindow.loadURL(`${process.env.MAIN_SERVER_URL}/public/views/widget.html`);
  const { screen } = require('electron');
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  widgetWindow.setPosition(width - 320, 20);
  widgetWindow.once('ready-to-show', () => widgetWindow.show());

  const hideMenuEvents = ['blur', 'focus', 'restore', 'maximize', 'unmaximize', 'resize', 'move', 'show', 'hide'];
  hideMenuEvents.forEach(event => widgetWindow.on(event, () => widgetWindow.setMenuBarVisibility(false)));
  widgetWindow.webContents.on('context-menu', e => e.preventDefault());
}

async function initializeDiscordRPC() {
  discordRPC = new DiscordRPCManager();
  await discordRPC.initialize();
}

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('window-close', () => {
  if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.close();
  mainWindow?.close();
});
ipcMain.on('widget-minimize', () => widgetWindow?.minimize());
ipcMain.on('widget-close', () => widgetWindow?.close());
ipcMain.on('widget-toggle-visibility', () => {
  if (widgetWindow?.isVisible()) widgetWindow.hide();
  else widgetWindow?.show();
});
ipcMain.on('music-state-update', (_, data) => {
  if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.webContents.send('music-state-update', data);
  if (discordRPC) discordRPC.updatePlaybackState(data.isPlaying);
});
ipcMain.on('track-info-update', (_, data) => {
  if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.webContents.send('track-info-update', data);
  if (discordRPC) discordRPC.updateTrackInfo(data);
});
ipcMain.on('discord-rpc-update-progress', (_, data) => {
  if (discordRPC) discordRPC.updateProgress(data.currentTime, data.duration);
});
ipcMain.on('discord-rpc-clear', () => {
  if (discordRPC) discordRPC.clearActivity();
});

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.on('reload', () => {
  mainWindow.reload();
});

ipcMain.handle('set-widget-visibility', (event, isEnabled) => {
  const store = new Store();
  store.set('widgetEnabled', isEnabled);
  if (isEnabled) {
    if (!widgetWindow || widgetWindow.isDestroyed()) {
      createWidget();
    }
  } else {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.close();
      widgetWindow = null;
    }
  }
});

app.whenReady().then(async () => {
  const { Menu } = require('electron');
  Menu.setApplicationMenu(null);
  const serverStarted = await startStaticServer();
  if (!serverStarted) {
    app.quit();
    return;
  }
  await initializeDiscordRPC();
  createWindow();
  const store = new Store();
  // По умолчанию виджет выключен
  if (store.get('widgetEnabled', false)) {
    createWidget();
  }

  app.on('browser-window-blur', (_, win) => win?.setMenuBarVisibility(false));
  app.on('browser-window-focus', (_, win) => win?.setMenuBarVisibility(false));

  ipcMain.on('open-external-link', (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.on('window-reload', () => {
    if (mainWindow) {
      mainWindow.reload();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (discordRPC) discordRPC.disconnect();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
    const store = new Store();
    if (store.get('widgetEnabled', false)) {
      createWidget();
    }
  } else {
    BrowserWindow.getAllWindows().forEach(win => win?.setMenuBarVisibility(false));
  }
});

app.on('before-quit', () => {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    const bounds = widgetWindow.getBounds();
    const store = new Store();
    store.set('widgetBounds', bounds);
  }
  if (staticServer) {
    staticServer.close();
  }
  if (discordRPC) discordRPC.disconnect();
});
