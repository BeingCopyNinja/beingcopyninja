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


// --- 4. Spotify, Music Apps & Gaming Status (Lanyard API) ---
const DISCORD_USER_ID = "784841461027831818"; // Apni Discord User ID

async function updateDiscordStatus() {
    const songElement = document.getElementById("spotify-song");
    const gameElement = document.getElementById("discord-game");
    
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
        const data = await response.json();

        if (data.success) {
            let musicFound = false;

            // 1. Pehle official Spotify check karo
            if (data.data.spotify) {
                const track = data.data.spotify.song;
                const artist = data.data.spotify.artist;
                if (songElement) {
                    songElement.innerHTML = `🎵 <b>${track}</b> by ${artist}`;
                }
                musicFound = true;
            } 
            // 2. Agar Spotify nahi hai, toh activities mein dekho (jaise Echo Music ya other players)
            else if (data.data.activities) {
                const musicActivity = data.data.activities.find(act => 
                    act.name.toLowerCase().includes("music") || 
                    act.name.toLowerCase().includes("echo") || 
                    act.type === 2 // Type 2 is usually Listening activity in Discord
                );

                if (musicActivity && songElement) {
                    const title = musicActivity.details || musicActivity.name;
                    const details = musicActivity.state ? ` - ${musicActivity.state}` : "";
                    songElement.innerHTML = `🎵 <b>${title}</b>${details}`;
                    musicFound = true;
                }
            }

            // Agar koi music nahi chal raha
            if (!musicFound && songElement) {
                songElement.innerHTML = "💤 Not listening to music";
            }

            // --- Gaming / Activity Status Check ---
            if (gameElement) {
                const activities = data.data.activities;
                // Type 0 is Playing a game
                const playingGame = activities.find(act => act.type === 0);

                if (playingGame) {
                    const gameName = playingGame.name;
                    const gameDetails = playingGame.details ? ` (${playingGame.details})` : "";
                    gameElement.innerHTML = `🎮 <b>${gameName}</b>${gameDetails}`;
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

// Run status updater
updateDiscordStatus();
setInterval(updateDiscordStatus, 10000); // Har 10 seconds mein update hoga