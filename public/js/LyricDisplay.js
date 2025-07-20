class LyricDisplay {
    constructor(container) {
        this.container = container;
        this.lyrics = [];
        this.currentIndex = -1;
        this.timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000;
        this.updateQueued = false;
        this.pendingLyrics = null;
    }

    parseLyrics(lyricsText) {
        const lines = lyricsText.split('\n');
        this.lyrics = lines
            .map(line => {
                const match = this.timeRegex.exec(line);
                if (!match) return null;

                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3].padEnd(3, '0'));
                const time = minutes * 60000 + seconds * 1000 + milliseconds;
                const text = line.replace(this.timeRegex, '').trim();

                return { time, text };
            })
            .filter(line => line !== null)
            .sort((a, b) => a.time - b.time);

        this.render();
    }

    updateTime(currentTime) {
        const timeMs = currentTime * 1000;
        let newIndex = this.lyrics.findIndex(
            (line, index) => {
                const nextLine = this.lyrics[index + 1];
                return line.time <= timeMs && (!nextLine || nextLine.time > timeMs);
            }
        );

        if (newIndex !== this.currentIndex) {
            this.currentIndex = newIndex;
            this.render();
        }
    }

    render() {
        this.container.innerHTML = '';

        if (this.lyrics.length === 0) {
            this.showNoLyrics();
            return;
        }

        const lyricsDiv = document.createElement('div');
        lyricsDiv.className = 'lyrics-container';

        this.lyrics.forEach((line, index) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'lyric-line';
            lineDiv.textContent = line.text;
            lineDiv.dataset.index = index;
            lineDiv.dataset.time = line.time;

            if (index === this.currentIndex) {
                lineDiv.classList.add('active');
            }

            lyricsDiv.appendChild(lineDiv);
        });

        this.container.appendChild(lyricsDiv);

        if (this.currentIndex >= 0) {
            const activeElement = this.container.querySelector('.active');
            if (activeElement) {
                setTimeout(() => {
                    this.smartScrollToElement(activeElement);
                }, 1);
            }
        }
    }

    onLyricClick(timeMs) {
        const timeSeconds = timeMs / 1000;
        const youtubePlayer = window.player || (typeof player !== 'undefined' ? player : null);

        if (youtubePlayer && youtubePlayer.seekTo && youtubePlayer.getPlayerState) {
            try {
                const playerState = youtubePlayer.getPlayerState();
                if (playerState !== -1) {
                    const wasPlaying = playerState === 1;
                    youtubePlayer.seekTo(timeSeconds);

                    try {
                        const iframe = youtubePlayer.getIframe && youtubePlayer.getIframe();
                        if (iframe && typeof iframe.focus === 'function') {
                            iframe.focus();
                        }
                    } catch (e) {}

                    setTimeout(() => {
                        try {
                            youtubePlayer.playVideo();
                            this.showNotification(`Rewind to ${this.formatTime(timeSeconds)} ✓`);
                        } catch (error) {
                            this.showNotification(`Rewind to ${this.formatTime(timeSeconds)} (playback error)`);
                        }
                    }, 500);
                    return;
                }
            } catch (error) {}
        }

        const audioPlayer = document.querySelector('audio');
        if (audioPlayer) {
            const wasPlaying = !audioPlayer.paused;
            audioPlayer.currentTime = timeSeconds;

            if (wasPlaying) {
                setTimeout(() => {
                    try {
                        audioPlayer.play();
                        this.showNotification(`Rewind to ${this.formatTime(timeSeconds)} ✓`);
                    } catch (error) {
                        this.showNotification(`Rewind to ${this.formatTime(timeSeconds)} (playback error)`);
                    }
                }, 100);
            } else {
                this.showNotification(`Rewind to ${this.formatTime(timeSeconds)} ✓`);
            }
            return;
        }

        this.showNotification(`Rewind to ${this.formatTime(timeSeconds)}`);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification info';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(138, 43, 226, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            animation: fadeIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    async loadLyrics(artist, title) {
        try {
            this.showLoading();
            const cleanArtist = this.removeCommonSuffixes(this.cleanString(artist));
            const cleanTitle = this.removeCommonSuffixes(this.cleanString(title));
            const cacheKey = `${cleanArtist}-${cleanTitle}`;

            const cachedLyrics = this.getFromCache(cacheKey);
            if (cachedLyrics) {
                this.parseLyrics(cachedLyrics);
                return;
            }

            const lrclibResponse = await this.loadFromLrclib(artist, title);
            if (lrclibResponse) {
                this.addToCache(cacheKey, lrclibResponse);
                this.parseLyrics(lrclibResponse);
                return;
            }

            const response = await fetch(`/api/songs/lyrics?artist=${encodeURIComponent(cleanArtist)}&title=${encodeURIComponent(cleanTitle)}`);
            if (!response.ok) {
                if (response.status === 404) {
                    this.showNoLyrics();
                    return;
                }
                throw new Error('Failed to fetch lyrics');
            }

            const data = await response.json();
            if (!data.lyrics || data.lyrics.trim() === '') {
                this.showNoLyrics();
                return;
            }

            this.addToCache(cacheKey, data.lyrics);
            this.parseLyrics(data.lyrics);
        } catch (error) {
            this.showError('Failed to load lyrics');
        }

        if (!this.lyrics || this.lyrics.length === 0) {
            this.showNoLyrics();
        }
    }

    async loadFromLrclib(artist, title) {
        try {
            const cleanArtist = this.removeCommonSuffixes(this.cleanString(artist));
            const cleanTitle = this.removeCommonSuffixes(this.cleanString(title));

            const searchVariants = [
                { artist: cleanArtist, title: cleanTitle },
                { artist: cleanArtist, title: this.removeParentheses(cleanTitle) },
                { artist: this.removeParentheses(cleanArtist), title: cleanTitle },
                { artist: cleanArtist, title: this.extractMainTitle(cleanTitle) }
            ];

            for (const variant of searchVariants) {
                const lyrics = await this.searchLrclib(variant.artist, variant.title);
                if (lyrics) return lyrics;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    async searchLrclib(artist, title) {
        try {
            const searchResponse = await fetch(`https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`);
            if (!searchResponse.ok) return null;

            const searchData = await searchResponse.json();
            if (!searchData || searchData.length === 0) return null;

            const track = searchData[0];
            const lyricsResponse = await fetch(`https://lrclib.net/api/get/${track.id}`);
            if (!lyricsResponse.ok) return null;

            const lyricsData = await lyricsResponse.json();
            if (!lyricsData || !lyricsData.syncedLyrics) return null;

            const convertedLyrics = this.convertLrclibFormat(lyricsData.syncedLyrics);
            return convertedLyrics || null;
        } catch (error) {
            return null;
        }
    }

    cleanString(str) {
        return str
            .replace(/[^\w\sа-яёА-ЯЁ\-'()]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    removeParentheses(str) {
        return str.replace(/\([^)]*\)/g, '').trim();
    }

    extractMainTitle(str) {
        return str.split(/[-–—(]/)[0].trim();
    }

    removeCommonSuffixes(str) {
        return str
            .replace(/\s*-\s*Topic\s*$/i, '')
            .replace(/\s*\(.*?\)\s*$/gi, '')
            .trim();
    }

    convertLrclibFormat(syncedLyrics) {
        return syncedLyrics;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.lyrics;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }

    addToCache(key, lyrics) {
        this.cache.set(key, {
            lyrics: lyrics,
            timestamp: Date.now()
        });

        if (this.cache.size > 50) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="lyrics-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading lyrics...</p>
            </div>
        `;
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="lyrics-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    showNoLyrics() {
        this.container.innerHTML = `
            <div class="lyrics-not-found">
                <i class="fas fa-music"></i>
                <p>No lyrics found</p>
                <small>Try another track</small>
            </div>
        `;
    }

    smartScrollToElement(element, center = false) {
        const container = this.container.querySelector('.lyrics-container');
        if (!container || !element) return;

        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;
        const elementOffsetTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const elementTop = elementOffsetTop;
        const elementBottom = elementTop + elementHeight;
        const visibleTop = scrollTop;
        const visibleBottom = scrollTop + containerHeight;

        if (center) {
            const targetScrollTop = elementOffsetTop - (containerHeight / 2) + (elementHeight / 2);
            container.scrollTo({
                top: Math.max(0, Math.min(targetScrollTop, container.scrollHeight - containerHeight)),
                behavior: 'auto'
            });
            return;
        }

        if (elementTop >= visibleTop && elementBottom <= visibleBottom) return;

        const targetScrollTop = elementOffsetTop - containerHeight * 0.6 + elementHeight / 2;
        container.scrollTo({
            top: Math.max(0, Math.min(targetScrollTop, container.scrollHeight - containerHeight)),
            behavior: 'auto'
        });
    }

    updateLyrics(lyrics) {
        this.pendingLyrics = lyrics;

        if (!this.updateQueued) {
            this.updateQueued = true;
            requestAnimationFrame(() => this.performUpdate());
        }
    }

    performUpdate() {
        if (this.pendingLyrics !== null) {
            this.container.innerHTML = this.pendingLyrics;
            this.pendingLyrics = null;
        }
        this.updateQueued = false;
    }
}
