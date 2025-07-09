class LyricDisplay {
    constructor(container) {
        this.container = container;
        this.lyrics = [];
        this.currentIndex = -1;
        this.timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
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
        
        const lyricsDiv = document.createElement('div');
        lyricsDiv.className = 'lyrics-container';
        
        this.lyrics.forEach((line, index) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'lyric-line';
            lineDiv.textContent = line.text;
            
            if (index === this.currentIndex) {
                lineDiv.classList.add('active');
            }
            
            lyricsDiv.appendChild(lineDiv);
        });
        
        this.container.appendChild(lyricsDiv);
        
        if (this.currentIndex >= 0) {
            const activeElement = this.container.querySelector('.active');
            if (activeElement) {
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }

    async loadLyrics(artist, title) {
        try {
            const response = await fetch(`/api/songs/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
            if (!response.ok) throw new Error('Failed to fetch lyrics');
            
            const data = await response.json();
            this.parseLyrics(data.lyrics);
        } catch (error) {
            console.error('Error loading lyrics:', error);
            this.container.innerHTML = '<div class="error">Failed to load song lyrics</div>';
        }
    }
}
