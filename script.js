// --- 1. Quote Rotator ---
const quotes = [
    "Victory comes from discipline.",
    "Eat Sleep Game Repeat.",
    "One More Match.",
    "GG Well Played.",
    "Skill Beats Luck."
];

let index = 0;

setInterval(() => {
    index = (index + 1) % quotes.length;
    const quoteElement = document.getElementById("quote");
    if (quoteElement) {
        quoteElement.textContent = quotes[index];
    }
}, 3000);


// --- 2. Theme Toggle ---
function toggleTheme() {
    document.body.classList.toggle("light");
}


// --- 3. Custom Cursor ---
const cursor = document.querySelector(".cursor");

document.addEventListener("mousemove", (e) => {
    if (cursor) {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
    }
});


// --- Helper function to format milliseconds into H:MM:SS or MM:SS ---
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}


// --- Smart Time Ago Formatter ---
function formatTimeAgo(ms) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 5) return "just now";

    const intervals = {
        mo: 30 * 24 * 60 * 60,
        w: 7 * 24 * 60 * 60,
        d: 24 * 60 * 60,
        h: 60 * 60,
        m: 60,
        s: 1
    };

    let result = [];
    let remainingSeconds = seconds;

    for (let [unit, secondsInUnit] of Object.entries(intervals)) {
        let value = Math.floor(remainingSeconds / secondsInUnit);
        if (value > 0) {
            result.push(`${value}${unit}`);
            remainingSeconds %= secondsInUnit;
            if (result.length >= 2) break; 
        }
    }

    return result.join(" ") + " ago";
}


// --- Load Last Played Game from localStorage ---
let lastPlayedGame = JSON.parse(localStorage.getItem("kakashi_last_game")) || null;


// --- 4. Spotify & Gaming Status Logic ---
const DISCORD_USER_ID = "784841461027831818"; // Apni Discord User ID

async function updateDiscordStatus() {
    const songElement = document.getElementById("spotify-song");
    const progressBar = document.getElementById("music-progress-bar");
    
    const gameElement = document.getElementById("discord-game");
    const gameHeaderTitle = document.getElementById("game-header-title");
    const gameLiveDot = document.getElementById("game-live-dot");
    const gameImgIcon = document.getElementById("game-img-icon");
    const gameEmoji = document.getElementById("game-emoji");
    
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
        const data = await response.json();

        if (data.success) {
            // --- Music Status ---
            let musicFound = false;

            if (data.data.spotify) {
                const track = data.data.spotify.song;
                const artist = data.data.spotify.artist;
                const timestamps = data.data.spotify.timestamps;
                
                let timeString = "";
                if (timestamps && timestamps.start && timestamps.end) {
                    const totalDurationMs = timestamps.end - timestamps.start;
                    let elapsedMs = Date.now() - timestamps.start;
                    
                    if (elapsedMs > totalDurationMs) elapsedMs = totalDurationMs;

                    const progressPercent = (elapsedMs / totalDurationMs) * 100;
                    if (progressBar) progressBar.style.width = `${progressPercent}%`;

                    const elapsed = formatTime(elapsedMs);
                    const total = formatTime(totalDurationMs);
                    timeString = ` <span style="font-size: 13px; color: #aaa;">(${elapsed} / ${total})</span>`;
                }

                if (songElement) {
                    songElement.innerHTML = `🎵 <b>${track}</b> by ${artist}${timeString}`;
                }
                musicFound = true;
            } 
            else if (data.data.activities) {
                const musicActivity = data.data.activities.find(act => 
                    act.name.toLowerCase().includes("music") || 
                    act.name.toLowerCase().includes("echo") || 
                    act.type === 2 
                );

                if (musicActivity && songElement) {
                    const title = musicActivity.details || musicActivity.name;
                    const artist = musicActivity.state ? ` - ${musicActivity.state}` : "";
                    
                    let timeString = "";
                    if (musicActivity.timestamps && musicActivity.timestamps.start) {
                        const start = musicActivity.timestamps.start;
                        const end = musicActivity.timestamps.end;
                        let elapsedMs = Date.now() - start;

                        if (end) {
                            const totalDurationMs = end - start;
                            if (elapsedMs > totalDurationMs) elapsedMs = totalDurationMs;
                            
                            const progressPercent = (elapsedMs / totalDurationMs) * 100;
                            if (progressBar) progressBar.style.width = `${progressPercent}%`;

                            const elapsed = formatTime(elapsedMs);
                            const total = formatTime(totalDurationMs);
                            timeString = ` <span style="font-size: 13px; color: #aaa;">(${elapsed} / ${total})</span>`;
                        } else {
                            if (progressBar) progressBar.style.width = `0%`;
                            const elapsed = formatTime(elapsedMs);
                            timeString = ` <span style="font-size: 13px; color: #aaa;">(${elapsed} elapsed)</span>`;
                        }
                    }

                    songElement.innerHTML = `🎵 <b>${title}</b>${artist}${timeString}`;
                    musicFound = true;
                }
            }

            if (!musicFound && songElement) {
                songElement.innerHTML = "💤 Not listening to music";
                if (progressBar) progressBar.style.width = `0%`;
            }

            // --- Gaming Status with Dynamic Game Icon Extraction ---
            if (gameElement) {
                const activities = data.data.activities || [];
                const playingGame = activities.find(act => act.type === 0 || act.type === 5);

                if (playingGame) {
                    const gameName = playingGame.name;
                    const gameDetails = playingGame.details ? ` (${playingGame.details})` : "";
                    const startTime = playingGame.timestamps && playingGame.timestamps.start ? playingGame.timestamps.start : Date.now();
                    
                    // Extract game icon asset from Discord Rich Presence
                    let iconUrl = "";
                    if (playingGame.assets && playingGame.assets.large_image) {
                        let imgAsset = playingGame.assets.large_image;
                        if (imgAsset.startsWith("http://") || imgAsset.startsWith("https://")) {
                            iconUrl = imgAsset;
                        } else if (imgAsset.startsWith("mp:")) {
                            iconUrl = "https://media.discordapp.net/" + imgAsset.replace("mp:", "");
                        } else if (playingGame.application_id) {
                            iconUrl = `https://cdn.discordapp.com/app-assets/${playingGame.application_id}/${imgAsset}.png`;
                        }
                    }

                    let sessionDurationMs = Date.now() - startTime;
                    
                    lastPlayedGame = {
                        name: gameName,
                        details: gameDetails,
                        durationMs: sessionDurationMs,
                        stoppedAt: Date.now(),
                        startTime: startTime,
                        iconUrl: iconUrl
                    };
                    localStorage.setItem("kakashi_last_game", JSON.stringify(lastPlayedGame));

                    // Update Icon UI
                    if (iconUrl && gameImgIcon && gameEmoji) {
                        gameImgIcon.src = iconUrl;
                        gameImgIcon.style.display = "block";
                        gameEmoji.style.display = "none";
                    } else if (gameImgIcon && gameEmoji) {
                        gameImgIcon.style.display = "none";
                        gameEmoji.style.display = "block";
                    }

                    let timeString = "";
                    if (startTime) {
                        const elapsedMs = Date.now() - startTime;
                        const elapsed = formatTime(elapsedMs);
                        timeString = ` <span style="font-size: 13px; color: #aaa;">(${elapsed} elapsed)</span>`;
                    }

                    if (gameHeaderTitle) gameHeaderTitle.textContent = "Currently Playing";
                    if (gameLiveDot) gameLiveDot.style.display = "block";
                    gameElement.innerHTML = `🎮 <b>${gameName}</b>${gameDetails}${timeString}`;
                } else {
                    // When not playing, show Last Played info and icon if available
                    if (lastPlayedGame) {
                        const timeAgoMs = Date.now() - lastPlayedGame.stoppedAt;
                        const agoString = formatTimeAgo(timeAgoMs);
                        
                        let totalPlayedMs = lastPlayedGame.startTime ? (lastPlayedGame.stoppedAt - lastPlayedGame.startTime) : lastPlayedGame.durationMs;
                        const playedDurationStr = totalPlayedMs > 0 ? formatTime(totalPlayedMs) : "N/A";

                        // Update Icon UI for last played game
                        if (lastPlayedGame.iconUrl && gameImgIcon && gameEmoji) {
                            gameImgIcon.src = lastPlayedGame.iconUrl;
                            gameImgIcon.style.display = "block";
                            gameEmoji.style.display = "none";
                        } else if (gameImgIcon && gameEmoji) {
                            gameImgIcon.style.display = "none";
                            gameEmoji.style.display = "block";
                        }

                        if (gameHeaderTitle) gameHeaderTitle.textContent = "Last Played Game";
                        if (gameLiveDot) gameLiveDot.style.display = "none";
                        gameElement.innerHTML = `🎮 <b>${lastPlayedGame.name}</b>${lastPlayedGame.details}<br><span style="font-size: 13px; color: #aaa;">Played for ${playedDurationStr} • Ended ${agoString}</span>`;
                    } else {
                        if (gameImgIcon && gameEmoji) {
                            gameImgIcon.style.display = "none";
                            gameEmoji.style.display = "block";
                        }
                        if (gameHeaderTitle) gameHeaderTitle.textContent = "Gaming Status";
                        if (gameLiveDot) gameLiveDot.style.display = "none";
                        gameElement.innerHTML = "💤 Not playing any game right now";
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error fetching Discord status:", error);
        if (songElement) songElement.innerHTML = "Could not load status";
        if (gameElement) gameElement.innerHTML = "Could not load status";
    }
}

updateDiscordStatus();
setInterval(updateDiscordStatus, 1000);