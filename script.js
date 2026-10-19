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


// --- 4. Spotify & Gaming Status Logic ---
const DISCORD_USER_ID = "784841461027831818"; // Apni Discord User ID

async function updateDiscordStatus() {
    const songElement = document.getElementById("spotify-song");
    const gameElement = document.getElementById("discord-game");
    const progressBar = document.getElementById("music-progress-bar");
    
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
        const data = await response.json();

        if (data.success) {
            let musicFound = false;

            // 1. Official Spotify check
            if (data.data.spotify) {
                const track = data.data.spotify.song;
                const artist = data.data.spotify.artist;
                const timestamps = data.data.spotify.timestamps;
                
                let timeString = "";
                if (timestamps && timestamps.start && timestamps.end) {
                    const totalDurationMs = timestamps.end - timestamps.start;
                    let elapsedMs = Date.now() - timestamps.start;
                    
                    if (elapsedMs > totalDurationMs) {
                        elapsedMs = totalDurationMs;
                    }

                    const progressPercent = (elapsedMs / totalDurationMs) * 100;
                    if (progressBar) {
                        progressBar.style.width = `${progressPercent}%`;
                    }

                    const elapsed = formatTime(elapsedMs);
                    const total = formatTime(totalDurationMs);
                    timeString = ` <span style="font-size: 13px; color: #aaa;">(${elapsed} / ${total})</span>`;
                }

                if (songElement) {
                    songElement.innerHTML = `🎵 <b>${track}</b> by ${artist}${timeString}`;
                }
                musicFound = true;
            } 
            // 2. Other music apps (Echo Music / Activities check)
            else if (data.data.activities) {
                const musicActivity = data.data.activities.find(act => 
                    act.name.toLowerCase().includes("music") || 
                    act.name.toLowerCase().includes("echo") || 
                    act.type === 2 
                );

                if (musicActivity && songElement) {
                    const title = musicActivity.details || musicActivity.name;
                    const details = musicActivity.state ? ` - ${musicActivity.state}` : "";
                    
                    let timeString = "";
                    if (musicActivity.timestamps && musicActivity.timestamps.start) {
                        const start = musicActivity.timestamps.start;
                        const end = musicActivity.timestamps.end;
                        let elapsedMs = Date.now() - start;

                        if (end) {
                            const totalDurationMs = end - start;
                            if (elapsedMs > totalDurationMs) {
                                elapsedMs = totalDurationMs;
                            }
                            
                            const progressPercent = (elapsedMs / totalDurationMs) * 100;
                            if (progressBar) {
                                progressBar.style.width = `${progressPercent}%`;
                            }

                            const elapsed = formatTime(elapsedMs);
                            const total = formatTime(totalDurationMs);
                            timeString = ` <span style="font-size: 13px; color: #aaa;">(${elapsed} / ${total})</span>`;
                        } else {
                            if (progressBar) progressBar.style.width = `0%`;
                            const elapsed = formatTime(elapsedMs);
                            timeString = ` <span style="font-size: 13px; color: #aaa;">(${elapsed} elapsed)</span>`;
                        }
                    }

                    songElement.innerHTML = `🎵 <b>${title}</b>${details}${timeString}`;
                    musicFound = true;
                }
            }

            if (!musicFound && songElement) {
                songElement.innerHTML = "💤 Not listening to music";
                if (progressBar) progressBar.style.width = `0%`;
            }

            // --- Gaming Status ---
            if (gameElement) {
                const activities = data.data.activities;
                const playingGame = activities.find(act => act.type === 0);

                if (playingGame) {
                    const gameName = playingGame.name;
                    const gameDetails = playingGame.details ? ` (${playingGame.details})` : "";
                    
                    let timeString = "";
                    if (playingGame.timestamps && playingGame.timestamps.start) {
                        const elapsedMs = Date.now() - playingGame.timestamps.start;
                        const elapsed = formatTime(elapsedMs);
                        timeString = ` <span style="font-size: 13px; color: #aaa;">(${elapsed} elapsed)</span>`;
                    }

                    gameElement.innerHTML = `🎮 <b>${gameName}</b>${gameDetails}${timeString}`;
                } else {
                    gameElement.innerHTML = "💤 Not playing any game right now";
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