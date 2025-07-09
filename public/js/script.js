let player = null;
let isYTApiReady = false;
let pendingVideoToPlay = null;
let pendingStartTime = undefined;
let pendingIsPlaying = false;
let playerControls = null;
let currentVideo = null;
let isPlaying = false;
let currentTime = 0;
let duration = 0;
let progressInterval;
let volume = 1;
let isMuted = false;
let searchResultsList = [];
let currentIndex = -1;
let isShuffled = false;
let isRepeated = false;
let playerReadyResolver = null;
let playerReady = new Promise(resolve => {
    playerReadyResolver = resolve;
});
let playerCheckInterval = null;
let currentTrackToAdd = null;
let isAnimationInProgress = false; 
const modal = document.getElementById('addToPlaylistModal');
const closeModalBtn = document.querySelector('.close-modal');
const playlistSelectionList = document.querySelector('.playlist-selection-list');


const currentCover = document.getElementById('currentCover');
const fullscreenCover = document.getElementById('fullscreenCover');
const fullscreenImage = document.getElementById('fullscreenImage');
const fullscreenTitle = document.getElementById('fullscreenTitle');
const fullscreenArtist = document.getElementById('fullscreenArtist');
const closeFullscreen = document.getElementById('closeFullscreen');


function openFullscreenCover() {
    
    let coverSrc = currentCover.src;
    const trackTitle = document.getElementById('currentTitle').textContent;
    const trackArtist = document.getElementById('currentArtist').textContent;
    
    
    if (coverSrc.includes('ytimg.com')) {
        
        const matches = coverSrc.match(/\/vi\/([^\/]+)\/[^\.]+\.jpg/);
        if (matches && matches[1]) {
            const videoId = matches[1];
            
            coverSrc = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        } else if (coverSrc.includes('mqdefault.jpg')) {
            
            coverSrc = coverSrc.replace('mqdefault.jpg', 'maxresdefault.jpg');
        } else if (coverSrc.includes('default.jpg')) {
            
            coverSrc = coverSrc.replace('default.jpg', 'maxresdefault.jpg');
        } else if (coverSrc.includes('hqdefault.jpg')) {
            
            coverSrc = coverSrc.replace('hqdefault.jpg', 'maxresdefault.jpg');
        } else if (coverSrc.includes('sddefault.jpg')) {
            
            coverSrc = coverSrc.replace('sddefault.jpg', 'maxresdefault.jpg');
        }
    }
    
    
    const fullscreenBackground = document.getElementById('fullscreenBackground');
    fullscreenBackground.style.backgroundImage = `url(${currentCover.src})`;
    
    
    const img = new Image();
    
    
    const timeout = setTimeout(() => {
        if (!img.complete) {
            
            if (coverSrc.includes('maxresdefault.jpg') && coverSrc.includes('ytimg.com')) {
                const fallbackSrc = coverSrc.replace('maxresdefault.jpg', 'hqdefault.jpg');
                const fallbackImg = new Image();
                fallbackImg.onload = function() {
                    fullscreenImage.src = fallbackSrc;
                    fullscreenImage.style.objectFit = "cover";
                    
                    
                    fullscreenBackground.style.backgroundImage = `url(${fallbackSrc})`;
                };
                fallbackImg.src = fallbackSrc;
            }
            
            fullscreenImage.src = currentCover.src;
            fullscreenImage.style.objectFit = "cover";
            fullscreenTitle.textContent = trackTitle;
            fullscreenArtist.textContent = trackArtist;
            
            fullscreenCover.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }, 1000);
    
    img.onload = function() {
        clearTimeout(timeout);
        fullscreenImage.src = this.src;
        fullscreenImage.style.objectFit = "cover";
        fullscreenTitle.textContent = trackTitle;
        fullscreenArtist.textContent = trackArtist;
        
        
        fullscreenBackground.style.backgroundImage = `url(${this.src})`;
        
        fullscreenCover.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    
    img.src = coverSrc;
    
    
    fullscreenImage.src = currentCover.src;
    fullscreenImage.style.objectFit = "cover";
    fullscreenTitle.textContent = trackTitle;
    fullscreenArtist.textContent = trackArtist;
    
    fullscreenCover.classList.add('active');
    document.body.style.overflow = 'hidden';
}


function closeFullscreenCover() {
    
    fullscreenCover.style.opacity = '0';
    
    
    fullscreenCover.style.pointerEvents = 'none';
    
    
    setTimeout(() => {
        fullscreenCover.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        setTimeout(() => {
            fullscreenCover.style.opacity = '';
            fullscreenCover.style.pointerEvents = '';
        }, 50);
    }, 300);
}


currentCover.addEventListener('click', openFullscreenCover);
closeFullscreen.addEventListener('click', closeFullscreenCover);


closeFullscreen.addEventListener('touchend', function(e) {
    e.preventDefault(); 
    closeFullscreenCover();
});


fullscreenCover.addEventListener('click', function(e) {
    if (e.target === fullscreenCover) {
        closeFullscreenCover();
    }
});


document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && fullscreenCover.classList.contains('active')) {
        closeFullscreenCover();
    }
    
    
    if (fullscreenCover.classList.contains('active')) {
        if (e.key === 'ArrowRight') {
            playNext();
            e.preventDefault(); 
        } else if (e.key === 'ArrowLeft') {
            playPrev();
            e.preventDefault(); 
        }
    }
});


const fullscreenPrevBtn = document.getElementById('fullscreenPrevBtn');
const fullscreenNextBtn = document.getElementById('fullscreenNextBtn');

fullscreenPrevBtn.addEventListener('click', function() {
    playPrev();
});

fullscreenNextBtn.addEventListener('click', function() {
    playNext();
});


document.addEventListener('DOMContentLoaded', () => {
    
    playerControls = document.querySelector('.player-controls');
    
    
    restoreVolumeSettings();
    
    
    initNavigation();
    
    
    initYouTubePlayer();
    
    

    
    initMobileHandlers();
    
    
    const closeFullscreenBtn = document.getElementById('closeFullscreen');
    if (closeFullscreenBtn) {
        
        closeFullscreenBtn.removeEventListener('click', closeFullscreenCover);
        closeFullscreenBtn.removeEventListener('touchend', closeFullscreenCover);
        
        
        ['click', 'touchend'].forEach(eventType => {
                    closeFullscreenBtn.addEventListener(eventType, function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Closing fullscreen mode');
            closeFullscreenCover();
        });
        });
    }

    initSidebar();
    
    setTimeout(() => {
        forceUpdateSidebarBackground();
    }, 1000);
    
    restorePlaylistState();
});

function initSidebar() {
    loadSidebarPlaylists();
    loadSidebarRecentTracks();

    const addPlaylistBtn = document.getElementById('add-playlist-btn');
    if (addPlaylistBtn) {
        addPlaylistBtn.addEventListener('click', () => showModal('createPlaylistModal'));
    }

    const searchInput = document.getElementById('sidebar-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const playlistItems = document.querySelectorAll('#sidebar-playlist-list .sidebar-list-item');
            playlistItems.forEach(item => {
                const title = item.querySelector('.sidebar-item-title').textContent.toLowerCase();
                if (title.includes(searchTerm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
}

async function loadSidebarPlaylists() {
    const listElement = document.getElementById('sidebar-playlist-list');
    if (!listElement) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
        listElement.innerHTML = '<p class="sidebar-notice">Log in to see playlists</p>';
        return;
    }

    try {
        const playlists = await getUserPlaylists();
        if (playlists && playlists.length > 0) {
            listElement.innerHTML = playlists.map(playlist => {
                let coverHtml;
                if (playlist.songs && playlist.songs[0] && playlist.songs[0].thumbnail) {
                    coverHtml = `<img src="${playlist.songs[0].thumbnail}" alt="${playlist.name}" class="sidebar-item-cover">`;
                } else {
                    coverHtml = `<span class="sidebar-item-cover--empty"><i class="fas fa-music"></i></span>`;
                }
                return `
                <li class="sidebar-list-item" data-playlist-id="${playlist._id}">
                    ${coverHtml}
                    <div class="sidebar-item-info">
                        <div class="sidebar-item-title">${playlist.name}</div>
                        <div class="sidebar-item-subtitle">Playlist • ${playlist.owner?.username || 'You'}</div>
                    </div>
                </li>
                `;
            }).join('');
            
            listElement.querySelectorAll('.sidebar-list-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const playlistId = item.dataset.playlistId;
                    const currentId = localStorage.getItem('currentPlaylistId');
                    if (playlistId === currentId) return;
                    const playlist = playlists.find(p => p._id === playlistId);
                    if (playlist) {
                        await showPlaylistDetails(playlist);
                    }
                });
            });
        } else {
            listElement.innerHTML = '<p class="sidebar-notice">No playlists yet.</p>';
        }
    } catch (error) {
        console.error("Error loading playlists in sidebar:", error);
        listElement.innerHTML = '<p class="sidebar-notice">Loading error.</p>';
    }
}

function loadSidebarRecentTracks() {
    const listElement = document.getElementById('sidebar-recent-list');
    if (!listElement) return;

    const recentTracks = JSON.parse(localStorage.getItem('recentTracks')) || [];
    if (recentTracks.length > 0) {
        listElement.innerHTML = recentTracks.slice(0, 10).map(track => `
             <li class="sidebar-list-item" data-video-id="${track.id.videoId}">
                <img src="${track.snippet.thumbnails.medium.url}" alt="${track.snippet.title}" class="sidebar-item-cover">
                <div class="sidebar-item-info">
                    <div class="sidebar-item-title">${track.snippet.title}</div>
                    <div class="sidebar-item-subtitle">${track.snippet.channelTitle}</div>
                </div>
            </li>
        `).join('');

        listElement.querySelectorAll('.sidebar-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const videoId = item.dataset.videoId;
                const track = recentTracks.find(t => t.id.videoId === videoId);
                if (track) {
                    playVideo(track);
                }
            });
        });
    } else {
        listElement.innerHTML = '<p class="sidebar-notice">You haven\'t listened to anything yet.</p>';
    }
}

function setActiveNavItem(section) {
    const navItems = document.querySelectorAll('.main-nav li');
    const desktopNavItems = document.querySelectorAll('.desktop-nav .nav-item');

    
    navItems.forEach(navItem => navItem.classList.remove('active'));
    desktopNavItems.forEach(navItem => navItem.classList.remove('active'));

    if (section) {
        
        navItems.forEach(item => {
            if (item.textContent.trim() === section) {
                item.classList.add('active');
            }
        });
        desktopNavItems.forEach(item => {
            const itemSection = item.dataset.section === 'home' ? 'Home' :
                                item.dataset.section === 'search' ? 'Search' :
                                item.dataset.section === 'playlists' ? 'Playlists' : null;
            if (itemSection === section) {
                item.classList.add('active');
            }
        });
    }
}

function switchSection(section) {
    if(section !== 'Playlist Details') {
        localStorage.setItem('lastActiveTab', section);
    }
    
    
    document.getElementById('searchResults').style.display = 'none';
    const playlistView = document.getElementById('playlistView');
    if (playlistView) playlistView.style.display = 'none';
    
    
    switch(section) {
        case 'Home':
            setActiveNavItem('Home');
            showHomePage();
            break;
        case 'Search':
            setActiveNavItem('Search');
            showSearchPage();
            break;
        case 'Playlists':
            setActiveNavItem('Playlists');
            showPlaylistsPage();
            break;
        case 'Playlist Details':
            setActiveNavItem(null); 
            if (playlistView) playlistView.style.display = 'block';
            break;
    }
}


function initNavigation() {
    
    const navItems = document.querySelectorAll('.main-nav li');
    
    
    const desktopNavItems = document.querySelectorAll('.desktop-nav .nav-item');
    
    
    const lastActiveTab = localStorage.getItem('lastActiveTab') || 'Home';
    
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.textContent.trim();
            switchSection(section);
        });
    });
    
    
    desktopNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionAttr = item.getAttribute('data-section');
            let sectionName;
            
            switch(sectionAttr) {
                case 'home':
                    sectionName = 'Home';
                    break;
                case 'search':
                    sectionName = 'Search';
                    break;
                case 'playlists':
                    sectionName = 'Playlists';
                    break;
            }
            switchSection(sectionName);
        });
    });
    
    
    switchSection(lastActiveTab);
}


async function showHomePage() {
    const searchResults = document.getElementById('searchResults');
    searchResults.style.display = 'block';
    searchResults.innerHTML = '<div class="loading">Loading recommendations...</div>';

    try {
        
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&maxResults=50&regionCode=RU&key=${window.env?.YOUTUBE_API_KEY}`);
        
        if (!response.ok) {
            throw new Error('Error loading recommendations');
        }

        const data = await response.json();
        
        
        const officialChannels = data.items.filter(item => {
            const channelTitle = item.snippet.channelTitle;
            return channelTitle.endsWith(' - Topic');
        });

        if (officialChannels.length === 0) {
            searchResults.innerHTML = `
                <div class="no-official-results">
                    <p>No official releases found in recommendations</p>
                    <p>Try searching for a specific artist</p>
                </div>
            `;
            return;
        }

        
        const limitedResults = officialChannels.slice(0, 20);
        
        searchResultsList = limitedResults.map(item => ({
            ...item,
            id: { videoId: item.id },
            
            contentDetails: item.contentDetails || { duration: 'PT0M0S' }
        }));

        displayResults(searchResultsList);
    } catch (error) {
        console.error('Error loading home page:', error);
        searchResults.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading recommendations</p>
            </div>
        `;
    }
}


function showSearchPage() {
    const searchResults = document.getElementById('searchResults');
    const searchInput = document.getElementById('searchInput');
    
    searchResults.style.display = 'block';
    searchInput.focus();
    
    
    searchResults.innerHTML = `
        <div class="search-section">
            <h2 class="section-title">Search</h2>
            <div class="search-placeholder">
                <i class="fas fa-search"></i>
                <p>Enter a query to search for music</p>
            </div>
        </div>
        <div class="recent-tracks">
            <h2 class="section-title">Recently Played</h2>
            <div id="recentTracks" class="tracks-grid"></div>
        </div>
    `;
    
    
    loadRecentTracks();
    
    
    searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length >= 3) {
            
            saveSearchQueryToHistory(query);
            
            searchResults.innerHTML = `
                <div class="search-section">
                    <h2 class="section-title">Search results for "${query}"</h2>
                    <div id="searchResultsList"></div>
                </div>
            `;
            await searchVideos(query);
        } else {
            
            searchResults.innerHTML = `
                <div class="search-section">
                    <h2 class="section-title">Search</h2>
                    <div class="search-placeholder">
                        <i class="fas fa-search"></i>
                        <p>Enter a query to search for music</p>
                    </div>
                </div>
                <div class="recent-tracks">
                    <h2 class="section-title">Recently Played</h2>
                    <div id="recentTracks" class="tracks-grid"></div>
                </div>
            `;
            loadRecentTracks();
        }
    }, 500));
}


async function showPlaylistsPage() {
    const playlistView = document.getElementById('playlistView');
    const searchResults = document.getElementById('searchResults');
    
    
    searchResults.style.display = 'none';
    playlistView.style.display = 'block';
    
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
        playlistView.innerHTML = `
            <div class="auth-required">
                <i class="fas fa-lock"></i>
                <h2>Authentication Required</h2>
                <p>Please log in to view playlists</p>
                <button class="auth-btn" onclick="showModal('loginModal')">Login</button>
            </div>
        `;
        return;
    }

    try {
        
        const playlists = await getUserPlaylists();
        
        
        
        const currentPlaylistId = localStorage.getItem('currentPlaylistId');
        if (currentPlaylistId) {
            const currentPlaylist = playlists.find(p => p._id === currentPlaylistId);
            if (currentPlaylist) {
                await showPlaylistDetails(currentPlaylist);
                return;
            }
        }
        
        playlistView.innerHTML = `
            <div class="playlists-page">
                <div class="playlists-header">
                    <h2 class="section-title">Your Playlists</h2>
                    <button class="create-playlist-btn" onclick="showModal('createPlaylistModal')">
                        <i class="fas fa-plus"></i>
                        Create Playlist
                    </button>
                </div>
                <div class="playlists-grid">
                    ${playlists && playlists.length > 0 ? 
                        playlists.map(playlist => `
                            <div class="playlist-card" data-playlist-id="${playlist._id}">
                                <div class="playlist-cover">
                                    ${playlist.songs && playlist.songs.length > 0 ? 
                                        `<img src="${playlist.songs[0].thumbnail}" alt="${playlist.name}">` :
                                        `<i class="fas fa-music"></i>`
                                    }
                                </div>
                                <div class="playlist-info">
                                    <h3>${playlist.name}</h3>
                                    <p>${playlist.songs ? playlist.songs.length : 0} tracks</p>
                                </div>
                                <div class="playlist-overlay">
                                    <button class="play-playlist-btn">
                                        <i class="fas fa-play"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') :
                        `<div class="empty-playlists">
                            <i class="fas fa-music"></i>
                            <p>You don't have any playlists yet</p>
                            <button class="create-playlist-btn" onclick="showModal('createPlaylistModal')">
                                <i class="fas fa-plus"></i>
                                Create Playlist
                            </button>
                        </div>`
                    }
                </div>
            </div>
        `;

        
        const playlistCards = playlistView.querySelectorAll('.playlist-card');
        playlistCards.forEach(card => {
            card.addEventListener('click', async () => {
                const playlistId = card.dataset.playlistId;
                
                const playlist = playlists.find(p => p._id === playlistId);
                if (playlist) {
                    await showPlaylistDetails(playlist);
                }
            });

            
            const playButton = card.querySelector('.play-playlist-btn');
            if (playButton) {
                playButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const playlistId = card.dataset.playlistId;
                    const playlist = playlists.find(p => p._id === playlistId);
                    if (playlist && playlist.songs && playlist.songs.length > 0) {
                        
                        const firstTrack = playlist.songs[0];
                        playVideo({
                            id: { videoId: firstTrack.videoId },
                            snippet: {
                                title: firstTrack.title,
                                channelTitle: firstTrack.artist,
                                thumbnails: {
                                    medium: { url: firstTrack.thumbnail }
                                }
                            }
                        });
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error loading playlists:', error);
        playlistView.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading playlists</p>
            </div>
        `;
    }
}


async function showPlaylistDetails(playlist) {
    switchSection('Playlist Details');
    localStorage.setItem('currentPlaylistId', playlist._id);
    localStorage.setItem('currentPlaylistData', JSON.stringify(playlist));
    const playlistView = document.getElementById('playlistView');
    const oldDetails = playlistView.querySelector('.playlist-details');
    if (oldDetails) {
        oldDetails.classList.add('playlist-details--out');
        await new Promise(res => setTimeout(res, 360));
    }
    playlistView.innerHTML = `
        <div class="playlist-details playlist-details--in">
            <div class="playlist-header">
                <div class="playlist-cover-large">
                    ${playlist.songs && playlist.songs.length > 0 ? 
                        `<img src="${playlist.songs[0].thumbnail}" alt="${playlist.name}">` :
                        `<i class="fas fa-music"></i>`
                    }
                </div>
                <div class="playlist-info-large">
                    <h1>${playlist.name}</h1>
                    <p>${playlist.songs ? playlist.songs.length : 0} tracks</p>
                    <div class="playlist-actions">
                        <button class="play-all-btn">
                            <i class="fas fa-play"></i>
                            Play
                        </button>
                        <button class="edit-playlist-btn" onclick="showEditPlaylistModal('${playlist._id}', '${playlist.name}')">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                    </div>
                </div>
            </div>
            <div class="playlist-tracks">
                ${playlist.songs && playlist.songs.length > 0 ? 
                    playlist.songs.map((song, index) => `
                        <div class="track-item" data-track-index="${index}">
                            <div class="track-number">${index + 1}</div>
                            <div class="track-thumbnail">
                                <img src="${song.thumbnail}" alt="${song.title}">
                                <i class="fas play-icon fa-play-circle"></i>
                            </div>
                            <div class="track-info">
                                <h4>${song.title}</h4>
                                <p>${song.artist}</p>
                            </div>
                            <div class="track-actions">
                                <button class="track-action-btn remove-track" title="Remove from playlist">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('') :
                    `<div class="empty-playlist-tracks">
                        <p>No tracks in this playlist yet</p>
                    </div>`
                }
            </div>
        </div>
    `;
    
    setTimeout(() => {
        const newDetails = playlistView.querySelector('.playlist-details');
        if (newDetails) newDetails.classList.remove('playlist-details--in');
    }, 400);

    const trackItems = playlistView.querySelectorAll('.track-item');
    trackItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.track-actions')) {
                const song = playlist.songs[index];
                playVideo({
                    id: { videoId: song.videoId },
                    snippet: {
                        title: song.title,
                        channelTitle: song.artist,
                        thumbnails: {
                            medium: { url: song.thumbnail }
                        }
                    },
                    contentDetails: { duration: song.duration || 'PT0M0S' }
                });
            }
        });
    });
}


async function goBackToPlaylists() {
    
    localStorage.removeItem('currentPlaylistId');
    
    switchSection('Playlists');
}


function showEditPlaylistModal(playlistId, currentName) {
    if (!playlistId) {
        showNotification('Error: Playlist ID not found', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Playlist</h2>
                <button class="close-modal">&times;</button>
            </div>
            <form id="editPlaylistForm">
                <input type="text" id="editPlaylistName" value="${currentName}" required>
                <button type="submit">Save</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    
    const form = modal.querySelector('#editPlaylistForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('editPlaylistName').value;

        try {
            await editPlaylist(playlistId, newName);
            showNotification('Playlist successfully edited', 'success');
            modal.remove();
            
            const playlists = await getUserPlaylists();
            const updatedPlaylist = playlists.find(p => p._id === playlistId);
            if (updatedPlaylist) {
                await showPlaylistDetails(updatedPlaylist);
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


function initYouTubePlayer() {
    
    if (!document.getElementById('player')) {
        const playerDiv = document.createElement('div');
        playerDiv.id = 'player';
        document.body.appendChild(playerDiv);
    }

    
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}


window.onYouTubeIframeAPIReady = function() {
    
    
    player = new YT.Player('player', {
        height: '1',
        width: '1',
        videoId: '',
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'rel': 0,
            'showinfo': 0,
            'modestbranding': 1,
            'enablejsapi': 1,
            'origin': window.location.origin || 'https://chorus.servicebook.website/',
            'host': window.location.host || 'chorus.servicebook.website/'
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
};

function onPlayerReady(event) {
    
    
    isYTApiReady = true;
    if (playerReadyResolver) {
        playerReadyResolver();
    }
    
    
    restoreVolumeSettings();
    
    if (pendingVideoToPlay) {
        
        if (typeof pendingStartTime !== 'undefined') {
            
            player.loadVideoById({
                videoId: pendingVideoToPlay.id.videoId,
                startSeconds: pendingStartTime
            });
            
            
            currentVideo = pendingVideoToPlay;
            
            
            const playerBar = document.querySelector('.player-bar');
            const playerControls = document.querySelector('.player-controls');
            
            if (playerBar) {
                playerBar.classList.add('active');
            }
            
            if (playerControls) {
                playerControls.classList.add('active');
            }
            
            updatePlayerUI(pendingVideoToPlay);
            
            
            const updateProgressBarMultipleTimes = () => {
                const updateTimes = [300, 1000, 2000, 3000, 5000];
                
                updateTimes.forEach(delay => {
                    setTimeout(() => {
                        try {
                            if (!player) return;
                            
                            const duration = player.getDuration();
                            if (duration > 0 && pendingStartTime) {
                                const progress = (pendingStartTime / duration) * 100;
                                const progressBar = document.querySelector('.progress');
                                const totalTimeDisplay = document.getElementById('totalTime');
                                const currentTimeDisplay = document.getElementById('currentTime');
                                
                                if (progressBar) progressBar.style.width = `${progress}%`;
                                if (totalTimeDisplay) totalTimeDisplay.textContent = formatTime(duration);
                                if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(pendingStartTime);
                            }
                        } catch (error) {
                            console.error(`Error updating progress bar (${delay}ms):`, error);
                        }
                    }, delay);
                });
            };
            
            
            updateProgressBarMultipleTimes();
            
            
            if (!pendingIsPlaying) {
                setTimeout(() => {
                    player.pauseVideo();
                }, 1000);
            }
            
            
            pendingVideoToPlay = null;
            pendingStartTime = undefined;
            pendingIsPlaying = false;
        } else {
            
            playVideo(pendingVideoToPlay);
            pendingVideoToPlay = null;
        }
    } else {
        
        restorePlayerState();
    }
}

function onPlayerStateChange(event) {
    
    const playerBar = document.querySelector('.player-bar');
    
    
    
    
    
    
    
    
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        progressInterval = setInterval(updateProgress, 1000);
        if (playerControls) playerControls.classList.add('active');
        if (playerBar) playerBar.classList.add('active');
        savePlayerState(); 
        
        
        if (window.electronAPI && window.electronAPI.sendMusicStateUpdate) {
            window.electronAPI.sendMusicStateUpdate({
                isPlaying: true,
                currentTime: player ? player.getCurrentTime() : 0,
                duration: player ? player.getDuration() : 0
            });
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (progressInterval) clearInterval(progressInterval);
        savePlayerState(); 
        
        
        if (window.electronAPI && window.electronAPI.sendMusicStateUpdate) {
            window.electronAPI.sendMusicStateUpdate({
                isPlaying: false,
                currentTime: player ? player.getCurrentTime() : 0,
                duration: player ? player.getDuration() : 0
            });
        }
    } else if (event.data === YT.PlayerState.ENDED) {
        isPlaying = false;
        if (progressInterval) clearInterval(progressInterval);
        
        
        const currentPlaylistId = localStorage.getItem('currentPlaylistId');
        
        const trackSource = localStorage.getItem('trackSource') || 'searchResults';
        
      
      
        if (isRepeated) {
            
           
            player.playVideo();
        } else if (currentPlaylistId && trackSource === 'playlist') {
            
           
            playNext();
        } else if (trackSource === 'searchResults') {
            
          
            
            
            if (currentIndex === searchResultsList.length - 1 && !isRepeated) {
             
                if (playerControls) playerControls.classList.remove('active');
                if (playerBar) playerBar.classList.remove('active');
            } else {
                playNext();
            }
        } else {
            
          
            playNext();
        }
        
        savePlayerState(); 
        
        
        if (window.electronAPI && window.electronAPI.sendMusicStateUpdate) {
            window.electronAPI.sendMusicStateUpdate({
                isPlaying: false,
                currentTime: 0,
                duration: player ? player.getDuration() : 0
            });
        }
    } else if (event.data === YT.PlayerState.BUFFERING) {
       
        
    } else if (event.data === -1) {
       
        
    }
}

function onPlayerError(event) {
    console.error('Player error:', event.data);
    
    
    const errorMessages = {
        2: 'Invalid video ID',
        5: 'HTML5 player error',
        100: 'Video not found',
        101: 'Playback in iframe forbidden',
        150: 'Playback in iframe forbidden'
    };
    
    const errorMessage = errorMessages[event.data] || 'Unknown error';
 
    
    
    if (currentVideo) {
        const videoId = currentVideo.id?.videoId;
        const videoTitle = currentVideo.snippet?.title;
        const videoArtist = currentVideo.snippet?.channelTitle;
        
       
    }
    
    
    const errorDisplay = document.getElementById('errorDisplay');
    if (errorDisplay) {
        errorDisplay.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <span>${errorMessage}</span>
                <p>Attempting to play next video...</p>
            </div>
        `;
        errorDisplay.style.display = 'block';
        
        
        setTimeout(() => {
            errorDisplay.style.display = 'none';
        }, 3000);
    }
    
    
    
    if (typeof playNext === 'function') {
       
        
        
        
        let nextIndex;
        
        
        const currentPlaylistId = localStorage.getItem('currentPlaylistId');
        
        
        if (currentPlaylistId) {
           
            setTimeout(playNext, 1000);
            return;
        }
        
        
        if (searchResultsList.length === 0) {
           
            return;
        }
        
        const oldIndex = currentIndex;
        
        if (isShuffled) {
            nextIndex = Math.floor(Math.random() * searchResultsList.length);
           
        } else {
            
            
            nextIndex = (currentIndex + 1) % searchResultsList.length;
           
        }
        
        const nextVideo = searchResultsList[nextIndex];
        if (nextVideo) {
           
            currentIndex = nextIndex;
            setTimeout(() => playVideo(nextVideo), 1000);
        } else {
            console.error('❌ Failed to find next track for playback');
        }
    }
}

function playVideo(video, startTime) {
    
    
    
    if (!video || !video.id || !video.id.videoId) {
        console.error('Invalid video data:', video);
        const errorDisplay = document.getElementById('errorDisplay');
        if (errorDisplay) {
            errorDisplay.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Invalid video data</span>
                    <p>Attempting to play next video...</p>
                </div>
            `;
            errorDisplay.style.display = 'block';
            setTimeout(() => {
                errorDisplay.style.display = 'none';
            }, 3000);
        }
        if (typeof playNext === 'function') {
            setTimeout(playNext, 1000);
        }
        return;
    }
    
    
    saveToRecentTracks(video);
    currentVideo = video;
    updatePlayerUI(video);
    
    
    const trackSource = localStorage.getItem('trackSource');
    const currentPlaylistId = localStorage.getItem('currentPlaylistId');
    
    
    if (!trackSource) {
        if (currentPlaylistId) {
            localStorage.setItem('trackSource', 'playlist');
           
        } else {
            localStorage.setItem('trackSource', 'searchResults');
          
        }
    }
    
    
    const trackTitle = video.snippet.title;
    const trackArtist = video.snippet.channelTitle;
    
    
    let trackPosition = -1;
    let totalTracks = 0;
    let sourceType = "search list";
    
    if (currentPlaylistId) {
        
        getUserPlaylists().then(playlists => {
            const currentPlaylist = playlists.find(p => p._id === currentPlaylistId);
            if (currentPlaylist && currentPlaylist.songs && currentPlaylist.songs.length > 0) {
                const currentTrackId = video.id.videoId;
                trackPosition = currentPlaylist.songs.findIndex(song => song.videoId === currentTrackId) + 1;
                totalTracks = currentPlaylist.songs.length;
                sourceType = `playlist "${currentPlaylist.name}"`;
                
            }
        }).catch(err => {
            console.error('Ошибка при получении информации о плейлисте:', err);
        });
    } else if (searchResultsList && searchResultsList.length > 0) {
        
        trackPosition = currentIndex + 1;
        totalTracks = searchResultsList.length;
            
    } else {
        
        
    }
    
    
    const errorDisplay = document.getElementById('errorDisplay');
    if (errorDisplay) {
        errorDisplay.style.display = 'none';
    }

    if (!isYTApiReady || !player || !player.loadVideoById) {
       
        if (errorDisplay) {
            errorDisplay.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Player not ready for playback</span>
                    <p>Please wait...</p>
                </div>
            `;
            errorDisplay.style.display = 'block';
        }
        pendingVideoToPlay = video;
        
        if (typeof startTime !== 'undefined') {
            pendingStartTime = startTime;
        }
        return;
    }

    try {
        
        if (typeof startTime !== 'undefined') {
            player.loadVideoById({
                videoId: video.id.videoId,
                startSeconds: startTime
            });
        } else {
            player.loadVideoById(video.id.videoId);
        }
      
        if (playerControls) playerControls.classList.add('active');
        const playerBar = document.querySelector('.player-bar');
        if (playerBar) playerBar.classList.add('active');
        
        
        savePlayerState();
    } catch (error) {
        console.error('Error loading video:', error);
        if (errorDisplay) {
            errorDisplay.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Error loading video</span>
                    <p>Attempting to play next video...</p>
                </div>
            `;
            errorDisplay.style.display = 'block';
            setTimeout(() => {
                errorDisplay.style.display = 'none';
            }, 3000);
        }
        if (typeof playNext === 'function') {
            setTimeout(playNext, 1000);
        }
    }
}

function updatePlayerUI(video) {
    
    const currentTitle = document.getElementById('currentTitle');
    const currentArtist = document.getElementById('currentArtist');
    const currentCover = document.getElementById('currentCover');
    const playerBar = document.querySelector('.player-bar');
    const playerControls = document.querySelector('.player-controls');
    
    
    if (currentTitle) currentTitle.textContent = video.snippet.title;
    if (currentArtist) currentArtist.textContent = video.snippet.channelTitle;
    if (currentCover) {
        
        const thumbnailUrl = video.snippet.thumbnails?.high?.url || 
                           video.snippet.thumbnails?.medium?.url || 
                           video.snippet.thumbnails?.default?.url ||
                           'placeholder.jpg';
        currentCover.src = thumbnailUrl;
        currentCover.style.display = 'block';
        
        
        applyBlurredCoverToSidebar(thumbnailUrl);
        
        
        const fullscreenCover = document.getElementById('fullscreenCover');
        if (fullscreenCover && fullscreenCover.classList.contains('active')) {
            const fullscreenTitle = document.getElementById('fullscreenTitle');
            const fullscreenArtist = document.getElementById('fullscreenArtist');
            const fullscreenImage = document.getElementById('fullscreenImage');
            const fullscreenBackground = document.getElementById('fullscreenBackground');
            
            if (fullscreenTitle) fullscreenTitle.textContent = video.snippet.title;
            if (fullscreenArtist) fullscreenArtist.textContent = video.snippet.channelTitle;
            
            
            let coverSrc = thumbnailUrl;
            if (coverSrc.includes('ytimg.com')) {
                const matches = coverSrc.match(/\/vi\/([^\/]+)\/[^\.]+\.jpg/);
                if (matches && matches[1]) {
                    const videoId = matches[1];
                    coverSrc = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
                }
            }
            
            
            if (fullscreenImage) fullscreenImage.src = coverSrc;
            if (fullscreenBackground) fullscreenBackground.style.backgroundImage = `url(${coverSrc})`;
        }
    }

    
    if (playerBar) {
        playerBar.classList.add('active');
    }
    
    if (playerControls) {
        playerControls.classList.add('active');
    }

    
    const likeBtn = document.querySelector('.now-playing .like-btn');
    if (likeBtn) {
        likeBtn.classList.remove('active');
    }
    
    
    if (player && player.getDuration && player.getCurrentTime) {
        try {
            const duration = player.getDuration();
            const currentTime = player.getCurrentTime();
            
            if (duration > 0) {
                const progress = (currentTime / duration) * 100;
                const progressBar = document.querySelector('.progress');
                const currentTimeDisplay = document.getElementById('currentTime');
                const totalTimeDisplay = document.getElementById('totalTime');
                
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(currentTime);
                if (totalTimeDisplay) totalTimeDisplay.textContent = formatTime(duration);
            }
        } catch (error) {
            console.error('Ошибка при обновлении прогресс-бара:', error);
        }
    }
    
    
    if (window.electronAPI && window.electronAPI.sendTrackInfoUpdate) {
        const trackInfo = {
            title: video.snippet.title,
            artist: video.snippet.channelTitle,
            cover: video.snippet.thumbnails?.high?.url || 
                   video.snippet.thumbnails?.medium?.url || 
                   video.snippet.thumbnails?.default?.url ||
                   'default-avatar.svg'
        };
        window.electronAPI.sendTrackInfoUpdate(trackInfo);
    }
}

function updateProgress() {
    if (!player) return;
    
    try {
        if (player && player.getCurrentTime && player.getDuration) {
            currentTime = player.getCurrentTime();
            duration = player.getDuration();
            
            if (duration > 0) {
                const progress = (currentTime / duration) * 100;
                const progressBar = document.querySelector('.progress');
                const currentTimeDisplay = document.getElementById('currentTime');
                const totalTimeDisplay = document.getElementById('totalTime');
                
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(currentTime);
                if (totalTimeDisplay) totalTimeDisplay.textContent = formatTime(duration);
                
                
                if (Math.floor(currentTime) % 5 === 0) {
                    savePlayerState();
                }
                
                
                if (Math.floor(currentTime) % 2 === 0) {
                    if (window.electronAPI && window.electronAPI.sendMusicStateUpdate) {
                        window.electronAPI.sendMusicStateUpdate({
                            isPlaying: isPlaying,
                            currentTime: currentTime,
                            duration: duration
                        });
                    }
                }
            } else {
                
                setTimeout(updateProgress, 200);
            }
        }
    } catch (error) {
        console.error('Ошибка при обновлении прогресса:', error);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}


function playNext() {
    
    if (isAnimationInProgress) return;
    
    
    const currentImageContainer = document.querySelector('.fullscreen-image-container');
    const isFullscreenActive = document.getElementById('fullscreenCover').classList.contains('active');
    
    
    if (isFullscreenActive && currentImageContainer) {
        
        isAnimationInProgress = true;
        
        
        currentImageContainer.classList.add('slide-out-left');
        
        
        setTimeout(() => {
            
            _playNextTrack();
            
            
            currentImageContainer.classList.remove('slide-out-left');
            currentImageContainer.classList.add('slide-in-right');
            
            
            setTimeout(() => {
                currentImageContainer.classList.remove('slide-in-right');
                
                isAnimationInProgress = false;
            }, 400);
        }, 400);
    } else {
        
        _playNextTrack();
    }
}


function _playNextTrack() {
    
    const currentPlaylistId = localStorage.getItem('currentPlaylistId');
    
    
    let trackSource = currentPlaylistId ? 'playlist' : 'searchResults';
  
    
    if (currentPlaylistId) {
        getUserPlaylists().then(playlists => {
            const currentPlaylist = playlists.find(p => p._id === currentPlaylistId);
            if (currentPlaylist && currentPlaylist.songs && currentPlaylist.songs.length > 0) {
                
                const currentTrackId = currentVideo?.id?.videoId;
                let nextIndex = 0;
                let currentIndex = -1;
                
                if (currentTrackId) {
                    currentIndex = currentPlaylist.songs.findIndex(song => song.videoId === currentTrackId);
                    if (currentIndex !== -1) {
                        if (isShuffled) {
                            
                            nextIndex = Math.floor(Math.random() * currentPlaylist.songs.length);
                        } else {
                            
                            nextIndex = (currentIndex + 1) % currentPlaylist.songs.length;
                        }
                    }
                }
                
                
                const nextSong = currentPlaylist.songs[nextIndex];
                playVideo({
                    id: { videoId: nextSong.videoId },
                    snippet: {
                        title: nextSong.title,
                        channelTitle: nextSong.artist,
                        thumbnails: {
                            medium: { url: nextSong.thumbnail }
                        }
                    }
                });
                
                
                localStorage.setItem('trackSource', 'playlist');
                return; 
            }
        }).catch(error => {
            console.error('Ошибка при получении плейлистов:', error);
        });
        
        return;
    }
    
    
    if (searchResultsList.length === 0) return;
    
    let nextIndex;
    if (isShuffled) {
        nextIndex = Math.floor(Math.random() * searchResultsList.length);
    } else {
        nextIndex = (currentIndex + 1) % searchResultsList.length;
    }
    
    
    const nextVideo = searchResultsList[nextIndex];
    if (nextVideo) {
        currentIndex = nextIndex; 
        playVideo(nextVideo);
        
        localStorage.setItem('trackSource', 'searchResults');
    }
}

function playPrev() {
    
    if (isAnimationInProgress) return;
    
    
    const currentImageContainer = document.querySelector('.fullscreen-image-container');
    const isFullscreenActive = document.getElementById('fullscreenCover').classList.contains('active');
    
    
    if (isFullscreenActive && currentImageContainer) {
        
        isAnimationInProgress = true;
        
        
        currentImageContainer.classList.add('slide-out-right');
        
        
        setTimeout(() => {
            
            _playPrevTrack();
            
            
            currentImageContainer.classList.remove('slide-out-right');
            currentImageContainer.classList.add('slide-in-left');
            
            
            setTimeout(() => {
                currentImageContainer.classList.remove('slide-in-left');
                
                isAnimationInProgress = false;
            }, 400);
        }, 400);
    } else {
        
        _playPrevTrack();
    }
}


function _playPrevTrack() {
    
    const currentPlaylistId = localStorage.getItem('currentPlaylistId');
    
    
    let trackSource = localStorage.getItem('trackSource') || (currentPlaylistId ? 'playlist' : 'searchResults');
    
    
    if (currentPlaylistId && trackSource === 'playlist') {
        getUserPlaylists().then(playlists => {
            const currentPlaylist = playlists.find(p => p._id === currentPlaylistId);
            if (currentPlaylist && currentPlaylist.songs && currentPlaylist.songs.length > 0) {
                
                const currentTrackId = currentVideo?.id?.videoId;
                let prevIndex = 0;
                let currentIndex = -1;
                
                if (currentTrackId) {
                    currentIndex = currentPlaylist.songs.findIndex(song => song.videoId === currentTrackId);
                    if (currentIndex !== -1) {
                        if (isShuffled) {
                            
                            prevIndex = Math.floor(Math.random() * currentPlaylist.songs.length);
                        } else {
                            
                            prevIndex = (currentIndex - 1 + currentPlaylist.songs.length) % currentPlaylist.songs.length;
                        }
                    }
                }
                
                
                const prevSong = currentPlaylist.songs[prevIndex];
                playVideo({
                    id: { videoId: prevSong.videoId },
                    snippet: {
                        title: prevSong.title,
                        channelTitle: prevSong.artist,
                        thumbnails: {
                            medium: { url: prevSong.thumbnail }
                        }
                    }
                });
                
                
                localStorage.setItem('trackSource', 'playlist');
                return; 
            }
        }).catch(error => {
            console.error('Ошибка при получении плейлистов:', error);
        });
        
        return;
    }
    
    
    if (searchResultsList.length === 0) return;
    
    let prevIndex;
    if (isShuffled) {
        prevIndex = Math.floor(Math.random() * searchResultsList.length);
    } else {
        prevIndex = (currentIndex - 1 + searchResultsList.length) % searchResultsList.length;
    }
    
    
    const prevVideo = searchResultsList[prevIndex];
    if (prevVideo) {
        currentIndex = prevIndex; 
        playVideo(prevVideo);
        
        localStorage.setItem('trackSource', 'searchResults');
    }
}









async function searchVideos(query) {
    const searchResults = document.getElementById('searchResults');
    try {
        searchResults.innerHTML = '<p style="color: #b3b3b3;">Searching for music...</p>';
        const res = await fetch(`${window.env?.PARSER_SERVER_URL || 'http://localhost:3002/api'}/search?q=` + encodeURIComponent(query) + '&maxResults=100&filterOfficial=true&minDuration=40');
        const data = await res.json();
        let results = data.results || [];
        if (!results || results.length === 0) {
            const res2 = await fetch(`${window.env?.PARSER_SERVER_URL || 'http://localhost:3002/api'}/search?q=` + encodeURIComponent(query) + '&maxResults=100&filterOfficial=false&minDuration=40');
            const data2 = await res2.json();
            results = data2.results || [];
        }
        if (!results || results.length === 0) {
            searchResults.innerHTML = `<div class="no-results"><p style=\"color: #b3b3b3;\">No videos found for "${query}"</p><p style=\"color: #888; font-size: 0.9em;\">Try a different query or change search settings</p></div>`;
            return;
        }
        searchResultsList = results;
        displayResults(searchResultsList);
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = `<p style=\"color: #b3b3b3;\">Error searching for music: ${error.message}<br>Please try again later or use a different search query.</p>`;
    }
}

async function getChannelVideos(channelTitle, maxResults = 100) {
    const res = await fetch(`${window.env?.PARSER_SERVER_URL || 'http://localhost:3002/api'}/search?q=` + encodeURIComponent(channelTitle) + '&maxResults=' + maxResults + '&filterOfficial=true&minDuration=40');
    const data = await res.json();
    let results = data.results || [];
    if (!results || results.length === 0) {
        const res2 = await fetch(`${window.env?.PARSER_SERVER_URL || 'http://localhost:3002/api'}/search?q=` + encodeURIComponent(channelTitle) + '&maxResults=' + maxResults + '&filterOfficial=false&minDuration=40');
        const data2 = await res2.json();
        results = data2.results || [];
    }
    
    const channelVideos = results.filter(video => {
        const videoChannelTitle = video.snippet.channelTitle.toLowerCase();
        const searchChannelTitle = channelTitle.toLowerCase();
        return videoChannelTitle === searchChannelTitle ||
               videoChannelTitle.includes(searchChannelTitle) ||
               searchChannelTitle.includes(videoChannelTitle) ||
               videoChannelTitle.split(' ').some(word => searchChannelTitle.split(' ').includes(word) && word.length > 2);
    });
    return channelVideos.length > 0 ? channelVideos : results;
}


async function showArtistChannel(channelTitle) {
    const searchResults = document.getElementById('searchResults');
    searchResults.style.display = 'block';
    searchResults.innerHTML = '<div class="loading">Loading artist channel...</div>';
    
    try {
        const channelVideos = await getChannelVideos(channelTitle);
        
        
        localStorage.setItem('currentChannelTitle', channelTitle);
        localStorage.setItem('currentChannelData', JSON.stringify({
            channelInfo: {
                title: channelTitle,
                description: 'Official artist channel',
                thumbnails: { high: { url: 'default-avatar.svg' } }
            },
            videos: channelVideos
        }));
        
        
        setActiveNavItem(null);
        
        
        searchResults.innerHTML = `
            <div class="channel-header">
                <div class="channel-info">
                    <div class="channel-avatar">
                        <img src="default-avatar.svg" alt="${channelTitle}">
                    </div>
                    <div class="channel-details">
                        <h1>${channelTitle}</h1>
                        <p class="channel-description">Official artist channel</p>
                        <div class="channel-stats">
                            <span class="video-count">${channelVideos.length} tracks</span>
                        </div>
                    </div>
                </div>
                <div class="channel-actions">
                    <button class="play-all-channel-btn" onclick="playAllChannelVideos()">
                        <i class="fas fa-play"></i>
                        Play All
                    </button>
                    <button class="back-to-search-btn" onclick="goBackToSearch()">
                        <i class="fas fa-arrow-left"></i>
                        Back to Search
                    </button>
                </div>
            </div>
            <div class="channel-videos">
                <h2>All Tracks</h2>
                <div class="track-list-header">
                    <span>#</span>
                    <span></span>
                    <span>Title</span>
                    <span>Duration</span>
                    <span></span>
                </div>
                <div class="track-list">
                    ${channelVideos.map((video, index) => `
                        <div class="track-item" data-track-index="${index}">
                            <div class="track-number">${index + 1}</div>
                            <div class="track-thumbnail">
                                <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}">
                                <div class="official-badge" title="Official channel">
                                    <i class="fas fa-check"></i>
                                </div>
                            </div>
                            <div class="track-info">
                                <h4>${video.snippet.title}</h4>
                                <p class="official-channel">${video.snippet.channelTitle}</p>
                            </div>
                            <div class="track-duration">${formatDuration(video.contentDetails?.duration || 'PT0M0S')}</div>
                            <div class="track-actions">
                                <button class="track-action-btn add-to-playlist" title="Add to playlist">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button class="track-action-btn like-song" title="Like">
                                    <i class="far fa-heart"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        
        const trackItems = searchResults.querySelectorAll('.track-item');
        trackItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.track-actions')) {
                    
                    searchResultsList = channelVideos;
                    currentIndex = index;
                    playVideo(channelVideos[index]);
                }
            });

            const addToPlaylistBtn = item.querySelector('.add-to-playlist');
            if (addToPlaylistBtn) {
                addToPlaylistBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showAddToPlaylistModal(channelVideos[index]);
                });
            }
        });
        
    } catch (error) {
        console.error('Error loading channel:', error);
        searchResults.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading channel: ${error.message}</p>
                <button class="back-to-search-btn" onclick="goBackToSearch()">
                    <i class="fas fa-arrow-left"></i>
                    Back to Search
                </button>
            </div>
        `;
    }
}


function playAllChannelVideos() {
    const channelData = JSON.parse(localStorage.getItem('currentChannelData'));
    if (channelData && channelData.videos.length > 0) {
        
        searchResultsList = channelData.videos;
        currentIndex = 0;
        
        
        playVideo(channelData.videos[0]);
        
        showNotification('Playing all channel tracks', 'success');
    }
}


function goBackToSearch() {
    
    localStorage.removeItem('currentChannelTitle');
    localStorage.removeItem('currentChannelData');
    
    
    switchSection('Search');
}


function displayResults(videos) {
    const searchResults = document.getElementById('searchResults');
    
    if (!videos || videos.length === 0) {
        searchResults.innerHTML = `
            <div class="empty-results">
                <p>Nothing found for your query</p>
            </div>
        `;
        return;
    }

    searchResults.innerHTML = `
        <div class="official-channels-notice">
            <i class="fas fa-check-circle"></i>
            <span>Showing only official artist releases</span>
        </div>
        <div class="track-list-header">
            <span>#</span>
            <span></span>
            <span>Title</span>
            <span>Duration</span>
            <span></span>
        </div>
        <div class="track-list">
            ${videos.map((video, index) => `
                <div class="track-item" data-track-index="${index}">
                    <div class="track-number">${index + 1}</div>
                    <div class="track-thumbnail">
                        <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}">
                        <div class="official-badge" title="Official channel">
                            <i class="fas fa-check"></i>
                        </div>
                    </div>
                    <div class="track-info">
                        <h4>${video.snippet.title}</h4>
                        <p class="official-channel clickable-channel" onclick="showArtistChannel('${video.snippet.channelTitle}')" title="Go to artist channel">
                            ${video.snippet.channelTitle}
                            <i class="fas fa-external-link-alt"></i>
                        </p>
                    </div>
                    <div class="track-duration">${formatDuration(video.contentDetails?.duration || 'PT0M0S')}</div>
                    <div class="track-actions">
                        <button class="track-action-btn add-to-playlist" title="Add to playlist">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="track-action-btn like-song" title="Like">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    
    const trackItems = searchResults.querySelectorAll('.track-item');
    trackItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.track-actions') && !e.target.closest('.clickable-channel')) {
                currentIndex = index;
                playVideo(videos[index]);
            }
        });

        const addToPlaylistBtn = item.querySelector('.add-to-playlist');
        if (addToPlaylistBtn) {
            addToPlaylistBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showAddToPlaylistModal(videos[index]);
            });
        }
    });
}


function showAddToPlaylistModal(video) {
    currentTrackToAdd = {
        videoId: video.id.videoId,
        title: video.snippet.title,
        artist: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.medium.url,
        duration: video.contentDetails?.duration || 'PT0M0S'
    };
    
    
    const trackImg = document.querySelector('.selected-track img');
    const trackTitle = document.querySelector('.track-details h4');
    const trackArtist = document.querySelector('.track-details p');
    
    if (trackImg) trackImg.src = currentTrackToAdd.thumbnail;
    if (trackTitle) trackTitle.textContent = currentTrackToAdd.title;
    if (trackArtist) trackArtist.textContent = currentTrackToAdd.artist;
    
    
    loadPlaylistsForSelection();
    
    
    modal.classList.remove('hide');
    modal.style.display = 'block';
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('hide');
    }
}

async function addTrackToPlaylist(playlistId, track) {
    try {
        if (!playlistId) {
            throw new Error('Playlist ID not specified');
        }
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_URL}/playlists/${playlistId}/songs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                videoId: track.videoId,
                title: track.title,
                artist: track.artist,
                thumbnail: track.thumbnail,
                duration: track.duration
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error adding track to playlist');
        }

        const result = await response.json();
        showNotification('Track successfully added to playlist', 'success');
        return result;
    } catch (error) {
        console.error('Error adding track:', error);
        showNotification(error.message || 'Error adding track to playlist', 'error');
        throw error;
    }
}

function loadPlaylistsForSelection() {
    
    playlistSelectionList.innerHTML = '';
    
    
    getUserPlaylists().then(playlists => {
        if (!playlists || playlists.length === 0) {
            playlistSelectionList.innerHTML = '<div class="no-playlists">You don\'t have any playlists yet</div>';
            return;
        }

        playlists.forEach(playlist => {
            const playlistItem = document.createElement('div');
            playlistItem.className = 'playlist-selection-item';
            const cover = (playlist.songs && playlist.songs[0] && playlist.songs[0].thumbnail) ? playlist.songs[0].thumbnail : 'default-avatar.svg';
            playlistItem.innerHTML = `
                <img src="${cover}" alt="${playlist.name}">
                <div class="playlist-info">
                    <h4>${playlist.name}</h4>
                    <p>${playlist.songs ? playlist.songs.length : 0} tracks</p>
                </div>
            `;
            
            playlistItem.addEventListener('click', () => {
                if (playlist._id) {
                    addTrackToPlaylist(playlist._id, currentTrackToAdd)
                        .then(() => closeModal())
                        .catch(error => console.error('Error adding track:', error));
                } else {
                    console.error('Playlist ID missing');
                    showNotification('Error: Playlist ID not found', 'error');
                }
            });
            
            playlistSelectionList.appendChild(playlistItem);
        });
    }).catch(error => {
        console.error('Error loading playlists:', error);
        playlistSelectionList.innerHTML = '<div class="error-message">Error loading playlists</div>';
    });
}

function closeModal() {
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.add('hide');
    }
    modal.classList.add('hide');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('hide');
        if (modalContent) modalContent.classList.remove('hide');
        currentTrackToAdd = null;
    }, 360); 
}


closeModalBtn.addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

function showNotification(message, type = 'info') {
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    
    document.body.appendChild(notification);
    
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}


function formatDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}


function updateVolume(e, volumeSlider) {
    const volumeProgress = document.querySelector('.volume-progress');
    const rect = volumeSlider.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    volume = pos;
    volumeProgress.style.width = `${volume * 100}%`;
    
    if (player) {
        player.setVolume(volume * 100);
    }
    
    updateVolumeIcon();
    
    
    savePlayerState();
    
    
    saveVolumeSettings();
}

function saveVolumeSettings() {
    
    const volumeSettings = {
        volume: volume,
        isMuted: isMuted
    };
    localStorage.setItem('volumeSettings', JSON.stringify(volumeSettings));
}

function restoreVolumeSettings() {
    try {
        const savedSettings = localStorage.getItem('volumeSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            
            volume = settings.volume !== undefined ? settings.volume : 1;
            isMuted = settings.isMuted || false;
            
            
            const volumeProgress = document.querySelector('.volume-progress');
            if (volumeProgress) {
                volumeProgress.style.width = `${volume * 100}%`;
            }
            
            updateVolumeIcon();
            
            
            if (player) {
                player.setVolume(volume * 100);
                if (isMuted) {
                    player.mute();
                } else {
                    player.unMute();
                }
            }
        }
    } catch (error) {
        console.error('Ошибка при восстановлении настроек громкости:', error);
    }
}

function updateVolumeIcon() {
    const muteBtn = document.getElementById('muteBtn');
    if (!muteBtn) return;

    if (isMuted || volume === 0) {
        muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (volume < 0.5) {
        muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
        muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
}

function toggleMute() {
    isMuted = !isMuted;
    if (player) {
        if (isMuted) {
            player.mute();
        } else {
            player.unMute();
        }
    }
    updateVolumeIcon();
    
    
    savePlayerState();
    
    
    saveVolumeSettings();
}


document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.querySelector('.volume-slider');
    const progressContainer = document.querySelector('.progress-bar');

    
    const volumeProgress = document.querySelector('.volume-progress');
    if (volumeProgress) {
        volumeProgress.style.width = `${volume * 100}%`;
    }
    updateVolumeIcon();

    
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                searchVideos(query);
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    searchVideos(query);
                }
            }
        });
    }

    
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (!player || !currentVideo) return;
            
            if (isPlaying) {
                player.pauseVideo();
                isPlaying = false;
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            } else {
                player.playVideo();
                isPlaying = true;
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }
            savePlayerState();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (!player || !currentVideo) return;
            playPrev();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (!player || !currentVideo) return;
            playNext();
        });
    }

    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            if (!player || !currentVideo) return;
            isShuffled = !isShuffled;
            shuffleBtn.classList.toggle('active', isShuffled);
            savePlayerState();
        });
    }

    if (repeatBtn) {
        repeatBtn.addEventListener('click', () => {
            if (!player || !currentVideo) return;
            isRepeated = !isRepeated;
            repeatBtn.classList.toggle('active', isRepeated);
            savePlayerState();
        });
    }

    
    let isDragging = false;

    if (volumeSlider) {
        volumeSlider.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateVolume(e, volumeSlider);
        });

        volumeSlider.addEventListener('click', (e) => {
            updateVolume(e, volumeSlider);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            updateVolume(e, volumeSlider);
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            toggleMute();
        });
    }

    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            if (!player || !currentVideo) return;
            
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const newTime = pos * duration;
            player.seekTo(newTime, true);
            currentTime = newTime;
            
            const progressBar = document.querySelector('.progress');
            const currentTimeDisplay = document.getElementById('currentTime');
            
            if (progressBar) progressBar.style.width = `${pos * 100}%`;
            if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(currentTime);
        });
    }

    
    restorePlayerState();
});


const API_URL = window.env?.API_URL;


async function getUserPlaylists() {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            throw new Error('Authentication required');
        }

       

        const response = await fetch(`${API_URL}/playlists`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        
        if (!response.ok) {
            if (response.status === 404) {
                return []; 
            }
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error getting playlists');
        }
        
        const playlists = await response.json();
        
        return playlists;
    } catch (error) {
        console.error('Error getting playlists:', error);
        if (error instanceof SyntaxError) {
            throw new Error('Server error: invalid response format');
        }
        throw error;
    }
}


async function createPlaylist(name) {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_URL}/playlists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error creating playlist');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating playlist:', error);
        throw error;
    }
}


async function showPlaylist(playlist) {
    const playlistView = document.getElementById('playlistView');
    const searchResults = document.getElementById('searchResults');
    const playlistTitle = document.getElementById('playlistTitle');
    const playlistStats = document.getElementById('playlistStats');
    const playlistTracks = document.getElementById('playlistTracks');

    try {
        
        if (!playlist || !playlist._id) {
            throw new Error('Invalid playlist data');
        }

        
        searchResults.classList.add('hidden');
        playlistView.classList.remove('hidden');

        
        const token = localStorage.getItem('auth_token');
        if (!token) {
            throw new Error('Authentication required');
        }

       
        const response = await fetch(`${API_URL}/playlists/${playlist._id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Playlist not found');
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to load playlist');
        }

        const updatedPlaylist = await response.json();
        
        
        playlistTitle.textContent = updatedPlaylist.name;
        playlistStats.textContent = `${updatedPlaylist.songs ? updatedPlaylist.songs.length : 0} tracks`;

        
        playlistTracks.innerHTML = '';

        
        if (updatedPlaylist.songs && updatedPlaylist.songs.length > 0) {
            updatedPlaylist.songs.forEach((song, index) => {
                const trackElement = document.createElement('div');
                trackElement.className = 'track-item';
                trackElement.innerHTML = `
                    <div class="track-thumbnail">
                        <img src="${song.thumbnail || 'placeholder.jpg'}" alt="${song.title}">
                        <i class="fas fa-play play-icon"></i>
                    </div>
                    <div class="track-info">
                        <h4>${song.title}</h4>
                        <p>${song.artist}</p>
                    </div>
                    <span class="track-duration">${formatDuration(song.duration || 'PT0M0S')}</span>
                    <div class="track-actions">
                        <button class="track-action-btn remove-track" title="Remove from playlist">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;

                
                trackElement.addEventListener('click', (e) => {
                    if (!e.target.closest('.track-actions')) {
                        const videoData = {
                            id: { videoId: song.videoId },
                            snippet: {
                                title: song.title,
                                channelTitle: song.artist,
                                thumbnails: {
                                    default: { url: song.thumbnail },
                                    medium: { url: song.thumbnail },
                                    high: { url: song.thumbnail }
                                }
                            }
                        };
                        playVideo(videoData);
                    }
                });

                
                const deleteBtn = trackElement.querySelector('.remove-track');
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        const response = await fetch(`/api/playlists/${playlist._id}/songs/${song._id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            throw new Error(errorData.error || 'Error removing track');
                        }

                        
                        showPlaylist(playlist);
                        showNotification('Track removed from playlist', 'success');
                    } catch (error) {
                        console.error('Error removing track:', error);
                        showNotification(error.message || 'Error removing track', 'error');
                    }
                });

                playlistTracks.appendChild(trackElement);
            });
        } else {
            playlistTracks.innerHTML = `
                <div class="empty-playlist">
                    <p>No tracks in this playlist yet</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error displaying playlist:', error);
        showNotification(error.message || 'Error loading playlist', 'error');
        
        playlistTracks.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${error.message || 'Error loading playlist'}</p>
            </div>
        `;
    }
}


function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}


async function register(username, email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Registration error');
        }
        
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
        }
        return data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function login(email, password) {
    try {
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Login error');
        }
        
        const data = await response.json();
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
        }
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}


function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    
    const showLoginBtn = document.getElementById('showLogin');
    const showRegisterBtn = document.getElementById('showRegister');
    const closeButtons = document.querySelectorAll('.close');
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', () => {
            showModal('loginModal');
        });
    }
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', () => {
            showModal('registerModal');
        });
    }
    
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const data = await login(email, password);
                
                updateUIAfterLogin(data.user);
                
                hideModal('loginModal');
                
                loginForm.reset();
                showNotification('You have successfully logged in', 'success');
            } catch (error) {
                console.error('Login error:', error);
                showNotification(error.message, 'error');
            }
        });
    }

    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const data = await register(username, email, password);
                
                updateUIAfterLogin(data.user);
                
                hideModal('registerModal');
                
                registerForm.reset();
                showNotification('Registration completed successfully', 'success');
            } catch (error) {
                console.error('Registration error:', error);
                showNotification(error.message, 'error');
            }
        });
    }

    
    const userData = JSON.parse(localStorage.getItem('user_data'));
    if (userData) {
        updateUIAfterLogin(userData);
    }
});


function updateUIAfterLogin(userData) {
    const userMenu = document.getElementById('userMenu');
    const authButtons = document.querySelectorAll('.auth-btn');
    const usernamePlaceholder = document.getElementById('usernamePlaceholder');

    if (userData) {
        
        authButtons.forEach(btn => {
            if (btn.id !== 'logoutBtn') {
                btn.style.display = 'none';
            }
        });
        
        
        if (userMenu) {
            userMenu.classList.remove('hidden');
        }
        
        
        if (usernamePlaceholder) {
            usernamePlaceholder.textContent = userData.username;
        }

        
        loadPlaylists();
        
        
        if (window.updatePlaylistsDropdown) {
            window.updatePlaylistsDropdown();
        }

        loadSidebarPlaylists();
    } else {
        
        authButtons.forEach(btn => {
            if (btn.id !== 'logoutBtn') {
                btn.style.display = 'block';
            }
        });
        
        
        if (userMenu) {
            userMenu.classList.add('hidden');
        }
        
        
        if (usernamePlaceholder) {
            usernamePlaceholder.textContent = '';
        }
        
        
        if (window.updatePlaylistsDropdown) {
            window.updatePlaylistsDropdown();
        }

        loadSidebarPlaylists();
    }
}


const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        updateUIAfterLogin(null);
        showNotification('You have logged out', 'info');
    });
}


async function loadPlaylists() {
    try {
        const playlists = await getUserPlaylists();
        const playlistContainer = document.getElementById('playlistContainer');
        const playlistView = document.getElementById('playlistView');
        
        
        playlistView.classList.add('hidden');
        
        if (playlistContainer) {
            playlistContainer.innerHTML = `
                <h2 class="section-title">Your Playlists</h2>
                <div class="playlists-grid">
                    ${playlists && playlists.length > 0 ? 
                        playlists.map(playlist => `
                            <div class="playlist-card" data-playlist-id="${playlist._id}">
                                <div class="playlist-cover">
                                    ${playlist.songs && playlist.songs.length > 0 ? 
                                        `<img src="${playlist.songs[0].thumbnail}" alt="${playlist.name}">` :
                                        `<i class="fas fa-music"></i>`
                                    }
                                </div>
                                <div class="playlist-info">
                                    <h3>${playlist.name}</h3>
                                    <p>${playlist.songs ? playlist.songs.length : 0} tracks</p>
                                </div>
                                <div class="playlist-overlay">
                                    <button class="play-playlist-btn">
                                        <i class="fas fa-play"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') :
                        `<div class="empty-playlists">
                            <i class="fas fa-music"></i>
                            <p>You don't have any playlists yet</p>
                            <button class="create-playlist-btn" onclick="showModal('createPlaylistModal')">
                                <i class="fas fa-plus"></i>
                                Create Playlist
                            </button>
                        </div>`
                    }
                </div>
            `;

            
            const playlistCards = playlistContainer.querySelectorAll('.playlist-card');
            playlistCards.forEach(card => {
                card.addEventListener('click', async () => {
                    const playlistId = card.dataset.playlistId;
                    const playlist = playlists.find(p => p._id === playlistId);
                    if (playlist) {
                        await showPlaylistDetails(playlist);
                    }
                });

                
                const playButton = card.querySelector('.play-playlist-btn');
                if (playButton) {
                    playButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const playlistId = card.dataset.playlistId;
                        const playlist = playlists.find(p => p._id === playlistId);
                        if (playlist && playlist.songs && playlist.songs.length > 0) {
                            
                            const firstTrack = playlist.songs[0];
                            playVideo({
                                id: { videoId: firstTrack.videoId },
                                snippet: {
                                    title: firstTrack.title,
                                    channelTitle: firstTrack.artist,
                                    thumbnails: {
                                        medium: { url: firstTrack.thumbnail }
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error loading playlists:', error);
        showNotification('Error loading playlists', 'error');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const createPlaylistBtn = document.getElementById('createPlaylist');
    const createPlaylistModal = document.getElementById('createPlaylistModal');
    const createPlaylistForm = document.getElementById('createPlaylistForm');
    
    if (createPlaylistBtn) {
        createPlaylistBtn.addEventListener('click', () => {
            if (!localStorage.getItem('auth_token')) {
                showNotification('Please log in to create a playlist', 'error');
                return;
            }
            showModal('createPlaylistModal');
        });
    }

    if (createPlaylistForm) {
        createPlaylistForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('playlistName').value;

            try {
                await createPlaylist(name);
                hideModal('createPlaylistModal');
                createPlaylistForm.reset();
                await loadPlaylists(); 
                loadSidebarPlaylists(); 
                showNotification('Playlist created successfully', 'success');
            } catch (error) {
                console.error('Error creating playlist:', error);
                showNotification(error.message, 'error');
            }
        });
    }
});


function savePlayerState() {
    
    if (currentVideo) {
        const state = {
            currentVideo,
            currentIndex,
            isPlaying,
            isShuffled,
            isRepeated,
            volume,
            isMuted,
            currentTime: player ? player.getCurrentTime() : 0,
            duration: player ? player.getDuration() : 0, 
            trackSource: localStorage.getItem('trackSource') || 'searchResults'
        };
        localStorage.setItem('playerState', JSON.stringify(state));
    }
}


async function restorePlayerState() {
    try {
        const savedState = localStorage.getItem('playerState');
        if (!savedState) return false;
        
        const state = JSON.parse(savedState);
        if (!state || !state.currentVideo) return false;
        
        
        isShuffled = state.isShuffled || false;
        isRepeated = state.isRepeated || false;
        volume = state.volume !== undefined ? state.volume : 1;
        isMuted = state.isMuted || false;
        currentVideo = state.currentVideo;
        currentIndex = state.currentIndex || 0;
        
        
        if (state.trackSource) {
            localStorage.setItem('trackSource', state.trackSource);
        }
        
        
        if (isShuffled) {
            document.getElementById('shuffleBtn')?.classList.add('active');
        }
        
        if (isRepeated) {
            document.getElementById('repeatBtn')?.classList.add('active');
        }
        
        
        if (player) {
            player.setVolume(volume * 100);
            if (isMuted) {
                player.mute();
            }
        }
        
        const volumeProgress = document.querySelector('.volume-progress');
        if (volumeProgress) {
            volumeProgress.style.width = `${volume * 100}%`;
        }
        
        updateVolumeIcon();
        
        
        const playerBar = document.querySelector('.player-bar');
        const playerControls = document.querySelector('.player-controls');
        
        if (playerBar) {
            playerBar.classList.add('active');
        }
        
        if (playerControls) {
            playerControls.classList.add('active');
        }
        
        
        updatePlayerUI(currentVideo);
        
        
        const currentTimeDisplay = document.getElementById('currentTime');
        const totalTimeDisplay = document.getElementById('totalTime');
        const progressBar = document.querySelector('.progress');
        
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = formatTime(state.currentTime || 0);
        }
        
        
        
        if (progressBar && state.currentTime) {
            
            
            const savedDuration = state.duration || 100; 
            const progress = (state.currentTime / savedDuration) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        
        if (player && isYTApiReady) {
            
            playVideo(currentVideo, state.currentTime || 0);
            
            
            
            const updateProgressBarMultipleTimes = () => {
                
                const updateTimes = [300, 1000, 2000, 3000];
                
                updateTimes.forEach(delay => {
                    setTimeout(() => {
                        try {
                            if (!player) return;
                            
                            const duration = player.getDuration();
                            if (duration > 0 && state.currentTime) {
                                const progress = (state.currentTime / duration) * 100;
                                
                                if (progressBar) {
                                    progressBar.style.width = `${progress}%`;
                                }
                                
                                if (totalTimeDisplay) {
                                    totalTimeDisplay.textContent = formatTime(duration);
                                }
                                
                                if (currentTimeDisplay) {
                                    currentTimeDisplay.textContent = formatTime(state.currentTime);
                                }
                            }
                        } catch (error) {
                            console.error(`Error updating progress bar (${delay}ms):`, error);
                        }
                    }, delay);
                });
            };
            
            
            updateProgressBarMultipleTimes();
            
            
            if (!state.isPlaying) {
                setTimeout(() => {
                    player.pauseVideo();
                }, 1000);
            }
            
            return true;
        } else {
            
            pendingVideoToPlay = currentVideo;
            pendingStartTime = state.currentTime || 0;
            pendingIsPlaying = state.isPlaying || false;
            return false;
        }
    } catch (error) {
        console.error('Ошибка при восстановлении состояния плеера:', error);
        return false;
    }
}


function initMobileHandlers() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileSidebar = document.querySelector('.mobile-sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    function toggleSidebar() {
        mobileSidebar.classList.toggle('visible');
        sidebarOverlay.classList.toggle('visible');
    }

    if (menuToggle && mobileSidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }
}


function setupFullscreenSwipeHandlers() {
    const fullscreenCover = document.getElementById('fullscreenCover');
    if (!fullscreenCover) return;
    
    let startX = 0;
    let startY = 0;
    let distX = 0;
    let distY = 0;
    let startTime = 0;
    let swipeThreshold = 100; 
    let restraint = 100; 
    let allowedTime = 300; 
    let isSwipeActive = false;
    
    fullscreenCover.addEventListener('touchstart', function(e) {
        if (!fullscreenCover.classList.contains('active')) return;
        
        const touchObj = e.changedTouches[0];
        startX = touchObj.pageX;
        startY = touchObj.pageY;
        startTime = new Date().getTime();
        isSwipeActive = true;
        
        
        e.preventDefault();
    }, {passive: false});
    
    fullscreenCover.addEventListener('touchmove', function(e) {
        if (!isSwipeActive) return;
        
        const touchObj = e.changedTouches[0];
        distX = touchObj.pageX - startX;
        distY = touchObj.pageY - startY;
        
        
        if (Math.abs(distX) > Math.abs(distY)) {
            e.preventDefault();
            
            
            const currentImageContainer = document.querySelector('.fullscreen-image-container');
            if (currentImageContainer) {
                
                
                const moveX = Math.sign(distX) * Math.sqrt(Math.abs(distX)) * 3;
                currentImageContainer.style.transition = 'none';
                currentImageContainer.style.transform = `translateX(${moveX}px)`;
                
                
                const opacity = Math.max(0, 1 - Math.abs(distX) / 1000);
                currentImageContainer.style.opacity = opacity;
                
                
                const scale = Math.max(0.9, 1 - Math.abs(distX) / 2000);
                currentImageContainer.style.transform = `translateX(${moveX}px) scale(${scale})`;
                
                
                const direction = distX > 0 ? 'prev' : 'next';
                const swipeIndicator = fullscreenCover.querySelector('.swipe-indicator');
                
                if (!swipeIndicator) {
                    const newIndicator = document.createElement('div');
                    newIndicator.className = 'swipe-indicator ' + direction;
                    newIndicator.innerHTML = distX > 0 
                        ? '<i class="fas fa-arrow-left"></i>' 
                        : '<i class="fas fa-arrow-right"></i>';
                    fullscreenCover.appendChild(newIndicator);
                    
                    
                    setTimeout(() => {
                        newIndicator.style.opacity = '1';
                    }, 50);
                } else {
                    
                    swipeIndicator.className = 'swipe-indicator ' + direction;
                    swipeIndicator.innerHTML = distX > 0 
                        ? '<i class="fas fa-arrow-left"></i>' 
                        : '<i class="fas fa-arrow-right"></i>';
                }
            }
        }
    }, {passive: false});
    
    fullscreenCover.addEventListener('touchend', function(e) {
        if (!isSwipeActive) return;
        
        const touchObj = e.changedTouches[0];
        distX = touchObj.pageX - startX;
        distY = touchObj.pageY - startY;
        const elapsedTime = new Date().getTime() - startTime;
        
        const currentImageContainer = document.querySelector('.fullscreen-image-container');
        const swipeIndicator = fullscreenCover.querySelector('.swipe-indicator');
        
        
        if (swipeIndicator) {
            swipeIndicator.style.opacity = '0';
            setTimeout(() => {
                swipeIndicator.remove();
            }, 300);
        }
        
        
        const isHorizontalSwipe = Math.abs(distX) >= swipeThreshold && Math.abs(distY) <= restraint;
        const isQuickSwipe = elapsedTime <= allowedTime;
        
        if (isHorizontalSwipe && isQuickSwipe) {
            
            if (isAnimationInProgress) {
                isSwipeActive = false;
                return;
            }
            
            
            if (currentImageContainer) {
                isAnimationInProgress = true;
                const direction = distX > 0 ? 1 : -1;
                currentImageContainer.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                currentImageContainer.style.transform = `translateX(${direction * window.innerWidth}px) scale(0.8)`;
                currentImageContainer.style.opacity = '0';
                
                
                setTimeout(() => {
                    currentImageContainer.style.transition = '';
                    currentImageContainer.style.transform = '';
                    currentImageContainer.style.opacity = '';
                    
                    
                    if (distX > 0) {
                        
                        _playPrevTrack(); 
                    } else {
                        
                        _playNextTrack(); 
                    }
                    
                    
                    setTimeout(() => {
                        isAnimationInProgress = false;
                    }, 300);
                }, 300);
            } else {
                
                if (distX > 0) {
                    playPrev();
                } else {
                    playNext();
                }
            }
        } else {
            
            if (currentImageContainer) {
                currentImageContainer.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                currentImageContainer.style.transform = 'translateX(0) scale(1)';
                currentImageContainer.style.opacity = '1';
                
                
                setTimeout(() => {
                    currentImageContainer.style.transition = '';
                }, 300);
            }
        }
        
        isSwipeActive = false;
    }, {passive: false});
    
    
    fullscreenCover.addEventListener('touchcancel', function() {
        isSwipeActive = false;
        const currentImageContainer = document.querySelector('.fullscreen-image-container');
        const swipeIndicator = fullscreenCover.querySelector('.swipe-indicator');
        
        
        if (swipeIndicator) {
            swipeIndicator.style.opacity = '0';
            setTimeout(() => {
                swipeIndicator.remove();
            }, 300);
        }
        
        if (currentImageContainer) {
            currentImageContainer.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            currentImageContainer.style.transform = 'translateX(0) scale(1)';
            currentImageContainer.style.opacity = '1';
            
            
            setTimeout(() => {
                currentImageContainer.style.transition = '';
            }, 300);
        }
    });
}


function loadRecentTracks() {
    const recentTracksContainer = document.getElementById('recentTracks');
    if (!recentTracksContainer) return;

    
    const recentTracks = JSON.parse(localStorage.getItem('recentTracks') || '[]');
    
    if (recentTracks.length === 0) {
        recentTracksContainer.innerHTML = `
            <div class="empty-history">
                <p>Listening history is empty</p>
            </div>
        `;
        return;
    }

    
    recentTracksContainer.innerHTML = recentTracks
        .slice(0, 8)
        .map((track, index) => `
            <div class="track-item recent-track" data-track-index="${index}">
                <div class="track-thumbnail">
                    <img src="${track.snippet.thumbnails.medium.url}" alt="${track.snippet.title}">
                    <i class="fas fa-play play-icon"></i>
                </div>
                <div class="track-info">
                    <h4>${track.snippet.title}</h4>
                    <p>${track.snippet.channelTitle}</p>
                </div>
            </div>
        `)
        .join('');

    
    const trackItems = recentTracksContainer.querySelectorAll('.recent-track');
    trackItems.forEach(item => {
        item.addEventListener('click', () => {
            const index = item.dataset.trackIndex;
            const track = recentTracks[index];
            if (track) {
                playVideo(track);
            }
        });
    });
}


function saveToRecentTracks(video) {
    if (!video) return;

    
    if (!video.contentDetails) {
        video.contentDetails = { duration: 'PT0M0S' };
    }

    
    let recentTracks = JSON.parse(localStorage.getItem('recentTracks') || '[]');
    
    
    recentTracks = recentTracks.filter(track => track.id.videoId !== video.id.videoId);
    
    
    recentTracks.unshift(video);
    
    
    if (recentTracks.length > 20) {
        recentTracks = recentTracks.slice(0, 20);
    }
    
    
    localStorage.setItem('recentTracks', JSON.stringify(recentTracks));
    
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim().length < 3) {
        loadRecentTracks();
    }

    loadSidebarRecentTracks();
}


async function editPlaylist(playlistId, newName) {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            throw new Error('Authentication required');
        }

        if (!playlistId) {
            throw new Error('Playlist ID not specified');
        }

        
        const playlists = await getUserPlaylists();
        const playlist = playlists.find(p => p._id === playlistId);
        
        if (!playlist) {
            throw new Error('Playlist not found in user list');
        }

       

        const response = await fetch(`${API_URL}/playlists/${playlistId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: newName })
        });

        

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Playlist not found');
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error editing playlist');
        }

        const data = await response.json().catch(() => ({}));
        return data;
    } catch (error) {
        console.error('Error editing playlist:', error);
        throw error;
    }
}


function loadPlaylistTracks(playlist) {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) {
       
        return;
    }
    
    
    searchResultsList = playlist.songs.map(song => ({
        id: { videoId: song.videoId },
        snippet: {
            title: song.title,
            channelTitle: song.artist,
            thumbnails: {
                medium: { url: song.thumbnail }
            }
        },
        contentDetails: { duration: song.duration || 'PT0M0S' }
    }));
    
   
}


async function getRecommendations(playlistId, limit = 10) {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.error('Not authenticated');
            return { success: false, error: 'Not authenticated' };
        }

        const response = await fetch(`/api/playlists/${playlistId}/recommendations?limit=${limit}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error getting recommendations');
        }
        
        return { success: true, recommendations: data.recommendations };
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return { success: false, error: error.message };
    }
}


function displayRecommendations(recommendations, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = '<div class="no-results">No recommendations</div>';
        return;
    }
    
    const recommendationsTitle = document.createElement('h3');
    recommendationsTitle.className = 'section-title';
    recommendationsTitle.textContent = 'Recommendations for you';
    container.appendChild(recommendationsTitle);
    
    const recommendationsList = document.createElement('div');
    recommendationsList.className = 'track-list recommendations-list';
    
    recommendations.forEach(song => {
        const trackEl = createTrackElement(song);
        recommendationsList.appendChild(trackEl);
    });
    
    container.appendChild(recommendationsList);
}


async function loadPlaylist(playlistId) {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            showNotification('You need to log in to access playlists', 'error');
            return;
        }

        
        const response = await fetch(`/api/playlists/${playlistId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error loading playlist');
        }
        
        
        document.getElementById('playlistTitle').textContent = data.name;
        
        const tracksCount = data.songs ? data.songs.length : 0;
        const totalDuration = data.songs ? calculateTotalDuration(data.songs) : '0:00';
        document.getElementById('playlistStats').textContent = `${tracksCount} tracks • ${totalDuration}`;
        
        const tracksContainer = document.getElementById('playlistTracks');
        tracksContainer.innerHTML = '';
        
        if (!data.songs || data.songs.length === 0) {
            tracksContainer.innerHTML = '<div class="no-tracks">No tracks in this playlist</div>';
        } else {
            const trackList = document.createElement('div');
            trackList.className = 'track-list';
            
            data.songs.forEach((song, index) => {
                const trackItem = createTrackElement(song, index);
                trackList.appendChild(trackItem);
            });
            
            tracksContainer.appendChild(trackList);
        }
        
        
        document.getElementById('searchResults').classList.add('hidden');
        document.getElementById('playlistView').classList.remove('hidden');
        
        
        const recommendationsResult = await getRecommendations(playlistId);
        if (recommendationsResult.success) {
            
            let recommendationsContainer = document.getElementById('playlistRecommendations');
            if (!recommendationsContainer) {
                recommendationsContainer = document.createElement('div');
                recommendationsContainer.id = 'playlistRecommendations';
                recommendationsContainer.className = 'playlist-recommendations';
                document.getElementById('playlistView').appendChild(recommendationsContainer);
            }
            
            
            displayRecommendations(recommendationsResult.recommendations, 'playlistRecommendations');
        }
    } catch (error) {
        console.error('Error loading playlist:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}


function getToken() {
    return localStorage.getItem('auth_token');
}


async function restorePlaylistState() {
    const currentPlaylistId = localStorage.getItem('currentPlaylistId');
    const currentPlaylistData = localStorage.getItem('currentPlaylistData');
    const currentChannelTitle = localStorage.getItem('currentChannelTitle');
    
    if (currentPlaylistId && currentPlaylistData) {
        try {
            
            const playlist = JSON.parse(currentPlaylistData);
            
            
            const token = localStorage.getItem('auth_token');
            if (token) {
                const response = await fetch(`${API_URL}/playlists/${currentPlaylistId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    
                    const updatedPlaylist = await response.json();
                    await showPlaylistDetails(updatedPlaylist);
                    return;
                }
            }
        } catch (error) {
            console.error('Error restoring playlist:', error);
        }
        
        
        localStorage.removeItem('currentPlaylistId');
        localStorage.removeItem('currentPlaylistData');
    }
    
    
    if (currentChannelTitle) {
        try {
            await showArtistChannel(currentChannelTitle);
        } catch (error) {
            console.error('Error restoring channel:', error);
            localStorage.removeItem('currentChannelTitle');
            localStorage.removeItem('currentChannelData');
        }
    }
}


function applyBlurredCoverToSidebar(imageUrl) {
    const sidebar = document.querySelector('.desktop-sidebar');
    if (sidebar) {
        
        let highResUrl = imageUrl;
        
        
        if (imageUrl.includes('i.ytimg.com')) {
            highResUrl = imageUrl.replace(/\/[^\/]+\.jpg$/, '/maxresdefault.jpg');
        } else {
            
            highResUrl = imageUrl.replace(/w\d+h\d+/, 'w1200h1200').replace(/s\d+/, 's1200');
        }
        
        
        sidebar.style.cssText = `
            background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${highResUrl}') !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: crisp-edges !important;
            image-rendering: high-quality !important;
            image-smoothing: high-quality !important;
            -webkit-image-smoothing: antialiased !important;
            -moz-osx-image-smoothing: grayscale !important;
            transition: background 0.5s ease !important;
            animation: backgroundFloat 20s ease-in-out infinite !important;
        `;
        
        console.log('Applied max resolution cover to sidebar:', highResUrl);
    }
}


function resetSidebarBackground() {
    const sidebar = document.querySelector('.desktop-sidebar');
    if (sidebar) {
        sidebar.style.removeProperty('background');
        sidebar.style.removeProperty('background-size');
        sidebar.style.removeProperty('background-position');
        sidebar.style.removeProperty('background-repeat');
        sidebar.style.removeProperty('animation');
        console.log('Reset sidebar background');
    }
}


function forceUpdateSidebarBackground() {
    const currentCover = document.getElementById('currentCover');
    if (currentCover && currentCover.src && currentCover.src !== 'placeholder.jpg') {
        applyBlurredCoverToSidebar(currentCover.src);
    } else {
        
        resetSidebarBackground();
    }
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.titlebar-btn.minimize')?.addEventListener('click', () => {
    window.electronAPI?.minimize();
  });
  document.querySelector('.titlebar-btn.maximize')?.addEventListener('click', () => {
    window.electronAPI?.maximize();
  });
  document.querySelector('.titlebar-btn.close')?.addEventListener('click', () => {
    window.electronAPI?.close();
  });
});


const SEARCH_HISTORY_KEY = 'yt_search_history';
const SEARCH_HISTORY_LIMIT = 10;

function saveSearchQueryToHistory(query) {
    if (!query || query.length < 3) return;
    let history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    
    history = history.filter(q => q !== query);
    history.unshift(query);
    if (history.length > SEARCH_HISTORY_LIMIT) history = history.slice(0, SEARCH_HISTORY_LIMIT);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

function getSearchHistory() {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
}

function showSearchHistoryDropdown(input) {
    let dropdown = document.getElementById('searchHistoryDropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'searchHistoryDropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.background = '#181818';
        dropdown.style.border = '1px solid #333';
        dropdown.style.borderRadius = '8px';
        dropdown.style.zIndex = 10000;
        dropdown.style.width = input.offsetWidth + 'px';
        dropdown.style.maxHeight = '220px';
        dropdown.style.overflowY = 'auto';
        dropdown.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
        document.body.appendChild(dropdown);
    }
    const rect = input.getBoundingClientRect();
    dropdown.style.left = rect.left + window.scrollX + 'px';
    dropdown.style.top = rect.bottom + window.scrollY + 'px';
    const history = getSearchHistory();
    if (history.length === 0) {
        dropdown.innerHTML = '<div style="padding: 10px; color: #888;">No recent queries</div>';
    } else {
        dropdown.innerHTML = history.slice(0, 3).map(q => `<div class="search-history-item" style="padding: 10px; cursor: pointer; color: #fff;">${q}</div>`).join('');
        dropdown.querySelectorAll('.search-history-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                input.value = item.textContent;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                hideSearchHistoryDropdown();
            });
        });
    }
    dropdown.style.display = 'block';
}

function hideSearchHistoryDropdown() {
    const dropdown = document.getElementById('searchHistoryDropdown');
    if (dropdown) dropdown.style.display = 'none';
}


document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('focus', () => {
            showSearchHistoryDropdown(searchInput);
        });
        searchInput.addEventListener('blur', () => {
            setTimeout(hideSearchHistoryDropdown, 150);
        });
        searchInput.addEventListener('input', () => {
            hideSearchHistoryDropdown();
        });
    }
});








function ensureTitlebarOnTop() {
    const titlebar = document.querySelector('.custom-titlebar');
    if (!titlebar) return;
    
    if (titlebar.parentNode !== document.body || document.body.lastElementChild !== titlebar) {
        document.body.appendChild(titlebar);
    }
    
    titlebar.style.zIndex = '2147483647';
    titlebar.style.pointerEvents = 'auto';
    titlebar.style.position = 'fixed';
    titlebar.style.top = '0';
    titlebar.style.left = '0';
    titlebar.style.right = '0';
    titlebar.style.width = '100vw';
    titlebar.style.height = '36px';
    titlebar.style['-webkit-app-region'] = 'drag';
}


function setupTitlebarFix() {
    ensureTitlebarOnTop();
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.addEventListener('scroll', ensureTitlebarOnTop, { passive: true });
    }
    
    const observer = new MutationObserver(ensureTitlebarOnTop);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', ensureTitlebarOnTop);
}

document.addEventListener('DOMContentLoaded', setupTitlebarFix);
