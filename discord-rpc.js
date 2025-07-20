const DiscordRPC = require('discord-rpc');
const fs = require('fs');
const path = require('path');

class DiscordRPCManager {
    constructor() {
        this.rpc = null;
        this.config = this.loadConfig();
        this.isConnected = false;
        this.currentTrack = null;
        this.isPlaying = false;
        this.startTime = null;
        this.progressInterval = null;
    }

    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'config', 'discord-config.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            let config = JSON.parse(configData);
            
            if (config.clientId === 'DISCORD_CLIENT_ID') {
                config.clientId = process.env.DISCORD_CLIENT_ID;
            }
            if (config.applicationName === 'DISCORD_APPLICATION_NAME') {
                config.applicationName = process.env.DISCORD_APPLICATION_NAME || 'Chorus Music Player';
            }
            if (config.largeImageText === 'DISCORD_APPLICATION_NAME') {
                config.largeImageText = process.env.DISCORD_APPLICATION_NAME || 'Chorus Music Player';
            }
            
            return config;
        } catch (error) {
            console.error('error connecting to Discord RPC:', error);
            return {
                clientId: process.env.DISCORD_CLIENT_ID,
                applicationName: process.env.DISCORD_APPLICATION_NAME || 'Chorus Music Player',
                largeImageKey: 'chorus_logo',
                largeImageText: process.env.DISCORD_APPLICATION_NAME || 'Chorus Music Player',
                smallImageKey: 'music_icon',
                smallImageText: 'Listening to music'
            };
        }
    }

    async initialize() {
        try {
            this.rpc = new DiscordRPC.Client({ transport: 'ipc' });
            
            this.rpc.on('ready', () => {
                this.isConnected = true;
                this.setDefaultActivity();
            });

            this.rpc.on('disconnected', () => {
                this.isConnected = false;
                this.clearProgressInterval();
            });

            await this.rpc.login({ clientId: this.config.clientId });
        } catch (error) {
            console.error('Error connecting to Discord RPC:', error);
        }
    }

    setDefaultActivity() {
        if (!this.isConnected) return;

        const activity = {
            details: 'Listening to music',
            state: 'Ready to play',
            largeImageKey: this.config.largeImageKey,
            largeImageText: this.config.largeImageText,
            smallImageKey: this.config.smallImageKey,
            smallImageText: this.config.smallImageText,
            instance: false
        };

        if (this.config.buttons && this.config.buttons.length > 0) {
            activity.buttons = this.config.buttons;
        }

        this.rpc.setActivity(activity);
    }

    updateTrackInfo(trackInfo) {
        if (!this.isConnected || !trackInfo) return;

        this.currentTrack = trackInfo;
        this.startTime = Date.now();

        const activity = {
            details: trackInfo.title || 'Unknown track',
            state: trackInfo.artist || 'Unknown artist',
            largeImageKey: this.config.largeImageKey,
            largeImageText: this.config.largeImageText,
            smallImageKey: this.isPlaying ? 'play_icon' : 'pause_icon',
            smallImageText: this.isPlaying ? 'Listening' : 'Paused',
            instance: false
        };

        if (this.config.buttons && this.config.buttons.length > 0) {
            activity.buttons = this.config.buttons;
        }

        if (this.isPlaying && trackInfo.duration) {
            activity.startTimestamp = this.startTime;
            activity.endTimestamp = this.startTime + (trackInfo.duration * 1000);
        }

        this.rpc.setActivity(activity);
    }

    updatePlaybackState(isPlaying) {
        this.isPlaying = isPlaying;
        
        if (this.currentTrack) {
            this.updateTrackInfo(this.currentTrack);
        } else {
            this.setDefaultActivity();
        }
    }

    updateProgress(currentTime, duration) {
        if (!this.isConnected || !this.currentTrack || !this.isPlaying) return;

        const activity = {
            details: this.currentTrack.title || 'Unknown track',
            state: this.currentTrack.artist || 'Unknown artist',
            largeImageKey: this.config.largeImageKey,
            largeImageText: this.config.largeImageText,
            smallImageKey: 'play_icon',
            smallImageText: 'Listening',
            startTimestamp: Date.now() - (currentTime * 1000),
            endTimestamp: Date.now() + ((duration - currentTime) * 1000),
            instance: false
        };

        if (this.config.buttons && this.config.buttons.length > 0) {
            activity.buttons = this.config.buttons;
        }

        this.rpc.setActivity(activity);
    }

    startProgressUpdates(currentTime, duration) {
        this.clearProgressInterval();
        
        if (!this.isConnected || !this.currentTrack || !this.isPlaying) return;

        this.progressInterval = setInterval(() => {
            if (currentTime < duration) {
                this.updateProgress(currentTime, duration);
                currentTime += 1;
            } else {
                this.clearProgressInterval();
            }
        }, 1000);
    }

    clearProgressInterval() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    clearActivity() {
        if (!this.isConnected) return;
        this.clearProgressInterval();
        this.rpc.clearActivity();
    }

    disconnect() {
        this.clearProgressInterval();
        if (this.rpc) {
            this.rpc.destroy();
            this.isConnected = false;
        }
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        try {
            const configPath = path.join(__dirname, 'config', 'discord-config.json');
            fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.error('Error saving Discord RPC configuration:', error);
        }
    }
}

process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.message && reason.message.includes('Could not connect')) {
        return;
    }
    if (reason && reason.message && reason.message.includes('Request has been terminated')) {
        return;
    }
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = DiscordRPCManager;
