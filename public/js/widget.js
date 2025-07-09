let currentTrack = null;
let isPlaying = false;
let currentTime = 0;
let duration = 0;

const trackCover = document.getElementById('trackCover');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const playOverlay = document.getElementById('playOverlay');
const trackCoverContainer = document.querySelector('.track-cover-container');

const minimizeBtn = document.querySelector('.minimize-btn');
const closeBtn = document.querySelector('.close-btn');

document.addEventListener('DOMContentLoaded', () => {
    initializeWidget();
    setupEventListeners();
    setupMusicSync();
});

function initializeWidget() {
    updatePlayButton();
    updateProgress();
}

function setupEventListeners() {
    minimizeBtn.addEventListener('click', () => {
        window.widgetAPI.minimize();
    });
    
    closeBtn.addEventListener('click', () => {
        window.widgetAPI.close();
    });
    
    playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        updatePlayButton();
        updateTrackCoverAnimation();
    });
    
    prevBtn.addEventListener('click', () => {
        console.log('Previous track');
    });
    
    nextBtn.addEventListener('click', () => {
        console.log('Next track');
    });
    
    trackCoverContainer.addEventListener('click', () => {
        isPlaying = !isPlaying;
        updatePlayButton();
        updateTrackCoverAnimation();
    });
    
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    document.querySelector('.widget-header').addEventListener('mousedown', (e) => {
        if (e.target.closest('.widget-controls')) return;
        
        isDragging = true;
        dragOffset.x = e.clientX;
        dragOffset.y = e.clientY;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        console.log('Moving widget:', { x: newX, y: newY });
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

function setupMusicSync() {
    window.widgetAPI.onMusicStateUpdate((data) => {
        console.log('Received music state update:', data);
        
        if (data.isPlaying !== undefined) {
            isPlaying = data.isPlaying;
            updatePlayButton();
            updateTrackCoverAnimation();
        }
        
        if (data.currentTime !== undefined) {
            currentTime = data.currentTime;
            updateProgress();
        }
        
        if (data.duration !== undefined) {
            duration = data.duration;
            updateProgress();
        }
    });
    
    window.widgetAPI.onTrackInfoUpdate((data) => {
        console.log('Received track info:', data);
        
        currentTrack = data;
        updateTrackInfo();
    });
}

function updateTrackInfo() {
    if (!currentTrack) {
        trackTitle.textContent = 'No track';
        trackArtist.textContent = 'Unknown artist';
        trackCover.src = 'default-avatar.svg';
        return;
    }
    
    trackTitle.textContent = currentTrack.title || 'Unknown track';
    trackArtist.textContent = currentTrack.artist || 'Unknown artist';
    
    if (currentTrack.cover) {
        trackCover.src = currentTrack.cover;
    } else {
        trackCover.src = 'default-avatar.svg';
    }
}

function updatePlayButton() {
    if (isPlaying) {
        playBtn.textContent = '⏸';
        playBtn.classList.add('playing');
    } else {
        playBtn.textContent = '▶';
        playBtn.classList.remove('playing');
    }
}

function updateTrackCoverAnimation() {
    if (isPlaying) {
        trackCoverContainer.classList.add('playing');
    } else {
        trackCoverContainer.classList.remove('playing');
    }
}

function updateProgress() {
    if (duration > 0) {
        const progress = (currentTime / duration) * 100;
        progressFill.style.width = `${progress}%`;
    } else {
        progressFill.style.width = '0%';
    }
    
    currentTimeEl.textContent = formatTime(currentTime);
    totalTimeEl.textContent = formatTime(duration);
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function sendCommand(command, data = {}) {
    console.log('Sending command:', command, data);
}

trackCover.addEventListener('error', () => {
    trackCover.src = 'default-avatar.svg';
});

setInterval(() => {
    if (isPlaying && duration > 0) {
        currentTime += 1;
        if (currentTime > duration) {
            currentTime = duration;
        }
        updateProgress();
    }
}, 1000);

window.addEventListener('beforeunload', () => {
    window.widgetAPI.removeAllListeners('music-state-update');
    window.widgetAPI.removeAllListeners('track-info-update');
}); 