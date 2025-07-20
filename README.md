# Chorus Music Player - Desktop Version
<img width="1191" height="794" alt="image" src="https://github.com/user-attachments/assets/9cd8141c-7207-4a4e-8a4e-80481df683fb" />
<img width="1188" height="792" alt="image" src="https://github.com/user-attachments/assets/a79532c3-da4d-493d-ab44-9e5712e44e71" />

Desktop version of Chorus music player with YouTube parser integration, Discord RPC, and control widget.

## 🎵 Main Features

### 🎧 Music Player
- YouTube music playback
- Track search and filtering
- Playlists and playback queue
- Playback controls (play/pause, next/prev)
- Progress and track time display

### 📱 Control Widget
- Separate widget window for quick control
- Synchronization with main application
- Always on top of other windows
- Positioned in top-right corner of screen
- Draggable and resizable
- Track cover animation during playback

### 🎮 Discord Rich Presence
- Full Discord integration
- Current track and playback state display
- Progress bar in Discord
- Configurable buttons and images
- Automatic status updates

### 🎤 Lyrics Display
- Synchronized lyrics display
- Automatic scrolling to current line
- LRC format support
- Lyrics loading via API

### 🔍 YouTube Parser
- Server-side parser architecture (port 3002)
- CORS bypass through proxy server
- Video search and information retrieval
- Official channel filtering (- Topic)
- Shorts exclusion (videos under 40 seconds)
- Configurable search parameters

## 📁 Project Structure

```
desktop/
├── main.js                 # Electron main process
├── preload.js              # Main window preload script
├── widget-preload.js       # Widget preload script
├── discord-rpc.js          # Discord RPC manager
├── package.json            # Project dependencies
├── config/                 # Configuration files
│   ├── discord-config.json # Discord RPC settings
│   ├── manifest.json       # Application manifest
├── public/                 # Public files
│   ├── assets/             # Images and resources
│   │   ├── logo.png        # Application logo
│   │   └── default-avatar.svg # Default avatar
│   ├── css/                # Styles
│   │   ├── styles.css      # Main styles
│   │   └── widget-styles.css # Widget styles
│   ├── js/                 # JavaScript files
│   │   ├── script.js       # Main application script
│   │   ├── widget.js       # Widget script
│   │   ├── LyricDisplay.js # Lyrics display
│   └── views/              # HTML views
│       ├── index.html      # Main page
│       └── widget.html     # Widget page
├── dist/                   # Built files
└── node_modules/           # Node.js dependencies
```

## 🚀 Installation and Setup

### 1. Install dependencies
```bash
npm install
```
### 2. Start desktop application
```bash
npm start
```

### 3. Build application
```bash
npm run build
```

## ⚙️ Configuration

### Discord RPC
Edit `config/discord-config.json`:
```json
{
  "clientId": "your own id",
  "applicationName": "Chorus Music Player",
  "largeImageKey": "chorus_logo",
  "largeImageText": "Chorus Music Player",
  "smallImageKey": "music_icon",
  "smallImageText": "Listening to music",
  "buttons": [
    {
      "label": "GitHub",
      "url": "https://github.com/your-username/chorus-player"
    }
  ]
}
```

### Default api urls
- `ParserURL`: Parser server URL in .env.example
- `ApiURL`: Api server URL in .env.example
- `StaticServerURL`: StaticServer server URL in .env.example

## 🎯 Features

### Main Window
- Full-featured music player
- YouTube search and playback
- Playlist management
- Lyrics display(working on it, currently unavailable)
- Discord RPC integration

### Widget
- Compact control window
- Synchronization with main application
- Always on top of other windows
- Draggable and resizable(working on it, currently unavailable)
- Track cover animation during playback

### Discord RPC
- Current track display
- Playback state (playing/paused) (working on it, currently unavailable)
- Progress bar with time(working on it, currently unavailable)
- Configurable buttons
- Automatic updates

### YouTube Parser
- Server-side architecture with Express.js
- Video search by query
- Popular videos retrieval
- Video information (duration, channel, description)
- Duration and channel type filtering
- CORS bypass through proxy server (currently disabled cuz dont need:D)

### Lyrics Display
- Synchronized display (working on it, currently unavailable)
- Automatic scrolling (working on it, currently unavailable)
- LRC format support (working on it, currently unavailable)
- Error handling for loading (working on it, currently unavailable)

## 🛠️ Development

### Adding new features
1. Lyrics: `public/js/LyricDisplay.js`

### Debugging
- Main window: DevTools open automatically

### IPC Events
- `music-state-update`: Playback state update
- `track-info-update`: Track information update
- `discord-rpc-update-progress`: Discord progress update (working on it, currently unavailable)
- `discord-rpc-clear`: Discord activity clear
- `window-minimize/maximize/close`: Window management
- `widget-minimize/close/toggle-visibility`: Widget management

## 📋 Requirements

- Node.js 16+
- Electron 36+
- Internet access for YouTube parser
- Discord (for RPC functionality)

## 🔧 Troubleshooting

### Discord RPC not connecting
1. Check `clientId` in configuration
2. Ensure Discord is running
3. Check console logs

### Playback issues
1. Check internet connection
2. Check console for video loading errors

## 📝 Scripts

- `npm start`: Start application in development mode
- `npm run dev`: Start with auto-reload
- `npm run build`: Build application for distribution

## 🤝 Contributing

1. Fork the repository
2. Create a branch for new feature
3. Make changes
4. Create Pull Request

## 📄 License

This project is licensed under the MIT License. 
