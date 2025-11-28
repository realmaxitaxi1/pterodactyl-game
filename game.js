// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameOver', 'nameInput'
let score = 0;
let gameSpeed = 2;
let frameCount = 0;
let currentWave = 1;
let meteorsInWave = 0;
let meteorsSpawnedThisWave = 0;
const METEORS_PER_WAVE = 25;
let playerName = '';
let playerInitial = '';

// Player (Pterodactyl)
const player = {
    x: 100,
    y: canvas.height / 2,
    width: 180,
    height: 120,
    speed: 5,
    color: '#8B4513'
};

// Meteors array
let meteors = [];

// Player image
const playerImage = new Image();
playerImage.src = 'pterodactyl.png';
let imageLoaded = false;

playerImage.onload = function() {
    imageLoaded = true;
};

playerImage.onerror = function() {
    console.warn('Player image not found. Using drawn sprite instead.');
    imageLoaded = false;
};

// Audio files
const backgroundMusic = new Audio('Action soundtrack.wav');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // Set volume to 50%

const hitSound = new Audio('Hit sound.wav');
hitSound.volume = 0.7; // Set volume to 70%

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (gameState === 'start' || gameState === 'gameOver') {
            // Check if player name is already stored
            const storedName = getStoredPlayerName();
            if (storedName) {
                // Use stored name and start game directly
                playerName = storedName.firstName;
                playerInitial = storedName.lastInitial;
                startGame();
            } else {
                // First time playing - prompt for name
                promptPlayerName();
            }
        } else if (gameState === 'nameInput') {
            // Name input handled separately
        }
    }
    
    if (e.key === 'Enter' && gameState === 'nameInput') {
        submitPlayerName();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Player name storage functions
function getStoredPlayerName() {
    const stored = localStorage.getItem('meteorGamePlayerName');
    return stored ? JSON.parse(stored) : null;
}

function savePlayerName(firstName, lastInitial) {
    localStorage.setItem('meteorGamePlayerName', JSON.stringify({
        firstName: firstName,
        lastInitial: lastInitial
    }));
}

// Leaderboard functions
function getLeaderboard() {
    const stored = localStorage.getItem('meteorGameLeaderboard');
    return stored ? JSON.parse(stored) : [];
}

function saveLeaderboard(leaderboard) {
    localStorage.setItem('meteorGameLeaderboard', JSON.stringify(leaderboard));
}

function updateLeaderboard(name, initial, wave) {
    let leaderboard = getLeaderboard();
    const playerKey = `${name.toLowerCase()}_${initial.toLowerCase()}`;
    
    // Find existing entry
    const existingIndex = leaderboard.findIndex(
        entry => entry.key === playerKey
    );
    
    if (existingIndex >= 0) {
        // Update if new wave is higher
        if (wave > leaderboard[existingIndex].wave) {
            leaderboard[existingIndex].wave = wave;
        }
    } else {
        // Add new entry
        leaderboard.push({
            key: playerKey,
            firstName: name,
            lastInitial: initial.toUpperCase(),
            wave: wave
        });
    }
    
    // Sort by wave (highest first)
    leaderboard.sort((a, b) => b.wave - a.wave);
    
    // Keep top 10
    if (leaderboard.length > 10) {
        leaderboard = leaderboard.slice(0, 10);
    }
    
    saveLeaderboard(leaderboard);
    displayLeaderboard();
}

function displayLeaderboard() {
    const leaderboard = getLeaderboard();
    const leaderboardStart = document.getElementById('leaderboardStart');
    const leaderboardGameOver = document.getElementById('leaderboardGameOver');
    
    if (leaderboard.length === 0) {
        const emptyHtml = '<p>No scores yet!</p>';
        if (leaderboardStart) leaderboardStart.innerHTML = emptyHtml;
        if (leaderboardGameOver) leaderboardGameOver.innerHTML = emptyHtml;
        return;
    }
    
    let html = '<h3>Leaderboard</h3><ol>';
    leaderboard.forEach(entry => {
        html += `<li>${entry.firstName} ${entry.lastInitial}. - Wave ${entry.wave}</li>`;
    });
    html += '</ol>';
    
    if (leaderboardStart) leaderboardStart.innerHTML = html;
    if (leaderboardGameOver) leaderboardGameOver.innerHTML = html;
}

function promptPlayerName() {
    gameState = 'nameInput';
    // Hide all other screens
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    // Show name input screen
    document.getElementById('nameInputScreen').classList.remove('hidden');
    document.getElementById('firstNameInput').focus();
    // Clear inputs
    document.getElementById('firstNameInput').value = '';
    document.getElementById('lastInitialInput').value = '';
}

function submitPlayerName() {
    const firstName = document.getElementById('firstNameInput').value.trim();
    const lastInitial = document.getElementById('lastInitialInput').value.trim();
    
    if (firstName && lastInitial && lastInitial.length === 1) {
        playerName = firstName;
        playerInitial = lastInitial;
        // Save name to localStorage for future sessions
        savePlayerName(firstName, lastInitial);
        document.getElementById('nameInputScreen').classList.add('hidden');
        startGame();
    } else {
        alert('Please enter your first name and a single last initial.');
    }
}

function startGame() {
    gameState = 'playing';
    score = 0;
    frameCount = 0;
    gameSpeed = 2;
    currentWave = 1;
    meteorsInWave = 0;
    meteorsSpawnedThisWave = 0;
    player.y = canvas.height / 2;
    meteors = [];
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('nameInputScreen').classList.add('hidden');
    
    // Start background music
    backgroundMusic.currentTime = 0; // Reset to beginning
    backgroundMusic.play().catch(e => {
        console.warn('Could not play background music:', e);
    });
}

function gameOver() {
    gameState = 'gameOver';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalWave').textContent = currentWave;
    
    // Hide all other screens
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('nameInputScreen').classList.add('hidden');
    // Show game over screen
    document.getElementById('gameOverScreen').classList.remove('hidden');
    
    // Update leaderboard
    if (playerName && playerInitial) {
        updateLeaderboard(playerName, playerInitial, currentWave);
    }
    
    // Stop background music
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

// Draw pterodactyl
function drawPterodactyl(x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);
    
    // Wing membrane color
    const wingColor = '#4A4A4A';
    const wingEdgeColor = '#2A2A2A';
    const bodyColor = '#6B4423';
    const headColor = '#5A3A1A';
    const beakColor = '#FF8C00';
    
    // Left wing (back wing)
    ctx.fillStyle = wingColor;
    ctx.beginPath();
    ctx.moveTo(-width * 0.15, height * 0.1);
    ctx.quadraticCurveTo(-width * 0.6, -height * 0.3, -width * 0.4, -height * 0.5);
    ctx.quadraticCurveTo(-width * 0.2, -height * 0.4, -width * 0.1, -height * 0.2);
    ctx.quadraticCurveTo(-width * 0.05, 0, -width * 0.15, height * 0.1);
    ctx.closePath();
    ctx.fill();
    
    // Left wing edge
    ctx.strokeStyle = wingEdgeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Right wing (front wing)
    ctx.fillStyle = wingColor;
    ctx.beginPath();
    ctx.moveTo(width * 0.05, height * 0.15);
    ctx.quadraticCurveTo(width * 0.5, -height * 0.2, width * 0.35, -height * 0.6);
    ctx.quadraticCurveTo(width * 0.2, -height * 0.5, width * 0.1, -height * 0.25);
    ctx.quadraticCurveTo(width * 0.05, 0, width * 0.05, height * 0.15);
    ctx.closePath();
    ctx.fill();
    
    // Right wing edge
    ctx.strokeStyle = wingEdgeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Wing finger bones
    ctx.strokeStyle = '#3A3A3A';
    ctx.lineWidth = 1.5;
    // Left wing bone
    ctx.beginPath();
    ctx.moveTo(-width * 0.15, height * 0.1);
    ctx.lineTo(-width * 0.4, -height * 0.5);
    ctx.stroke();
    // Right wing bone
    ctx.beginPath();
    ctx.moveTo(width * 0.05, height * 0.15);
    ctx.lineTo(width * 0.35, -height * 0.6);
    ctx.stroke();
    
    // Body (torpedo shape)
    const bodyGradient = ctx.createLinearGradient(-width * 0.2, 0, width * 0.2, 0);
    bodyGradient.addColorStop(0, '#7B5433');
    bodyGradient.addColorStop(0.5, bodyColor);
    bodyGradient.addColorStop(1, '#5A3A1A');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.25, height * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body outline
    ctx.strokeStyle = '#4A2A1A';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Neck
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.ellipse(width * 0.2, -height * 0.05, width * 0.12, height * 0.2, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.ellipse(width * 0.35, -height * 0.1, width * 0.18, height * 0.25, -0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Head crest (small)
    ctx.fillStyle = '#4A2A1A';
    ctx.beginPath();
    ctx.moveTo(width * 0.4, -height * 0.25);
    ctx.lineTo(width * 0.45, -height * 0.35);
    ctx.lineTo(width * 0.5, -height * 0.3);
    ctx.lineTo(width * 0.45, -height * 0.2);
    ctx.closePath();
    ctx.fill();
    
    // Beak (long and pointed)
    ctx.fillStyle = beakColor;
    ctx.beginPath();
    ctx.moveTo(width * 0.48, -height * 0.08);
    ctx.lineTo(width * 0.7, -height * 0.15);
    ctx.lineTo(width * 0.65, -height * 0.05);
    ctx.lineTo(width * 0.5, -height * 0.02);
    ctx.closePath();
    ctx.fill();
    
    // Beak outline
    ctx.strokeStyle = '#CC6600';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Eye
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(width * 0.38, -height * 0.15, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(width * 0.39, -height * 0.14, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-width * 0.25, height * 0.05);
    ctx.lineTo(-width * 0.4, height * 0.2);
    ctx.lineTo(-width * 0.35, height * 0.15);
    ctx.lineTo(-width * 0.25, height * 0.1);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// Draw meteor
function drawMeteor(x, y, size, angles, radii) {
    ctx.save();
    ctx.translate(x, y);
    
    // Fire trail/flame (behind the meteor) - does NOT count for collision
    const trailGradient = ctx.createLinearGradient(size * 1.5, 0, -size * 0.5, 0);
    trailGradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
    trailGradient.addColorStop(0.2, 'rgba(255, 150, 0, 0.5)');
    trailGradient.addColorStop(0.4, 'rgba(255, 200, 0, 0.7)');
    trailGradient.addColorStop(0.6, 'rgba(255, 255, 100, 0.8)');
    trailGradient.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
    
    ctx.fillStyle = trailGradient;
    ctx.beginPath();
    ctx.ellipse(size * 0.5, 0, size * 1.5, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Additional flame particles for effect
    for (let i = 0; i < 3; i++) {
        const flameX = size * (0.3 + i * 0.2);
        const flameY = (Math.random() - 0.5) * size * 0.3;
        const flameSize = size * (0.2 + Math.random() * 0.2);
        const flameGradient = ctx.createRadialGradient(flameX, flameY, 0, flameX, flameY, flameSize);
        flameGradient.addColorStop(0, `rgba(255, ${200 + Math.random() * 55}, 0, 0.8)`);
        flameGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Main meteor body (dark gray/black with texture) - ONLY THIS COUNTS FOR COLLISION
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.moveTo(
        Math.cos(angles[0]) * radii[0],
        Math.sin(angles[0]) * radii[0]
    );
    for (let i = 1; i < angles.length; i++) {
        ctx.lineTo(
            Math.cos(angles[i]) * radii[i],
            Math.sin(angles[i]) * radii[i]
        );
    }
    ctx.closePath();
    ctx.fill();
    
    // Add darker patches for texture (using fixed positions based on shape)
    ctx.fillStyle = '#0A0A0A';
    // Patch positions based on meteor shape
    const patchPositions = [
        { x: -size * 0.2, y: size * 0.15, s: size * 0.25 },
        { x: size * 0.1, y: -size * 0.2, s: size * 0.3 },
        { x: -size * 0.15, y: -size * 0.1, s: size * 0.2 }
    ];
    patchPositions.forEach(patch => {
        ctx.beginPath();
        ctx.arc(patch.x, patch.y, patch.s, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Add lighter highlights (fixed positions)
    ctx.fillStyle = '#3A3A3A';
    const highlightPositions = [
        { x: -size * 0.25, y: -size * 0.25, s: size * 0.2 },
        { x: size * 0.15, y: size * 0.2, s: size * 0.18 }
    ];
    highlightPositions.forEach(highlight => {
        ctx.beginPath();
        ctx.arc(highlight.x, highlight.y, highlight.s, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Hot spots (white/yellow from friction)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(-size * 0.2, -size * 0.2, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(-size * 0.15, size * 0.1, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Outline for definition
    ctx.strokeStyle = '#2A2A2A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(
        Math.cos(angles[0]) * radii[0],
        Math.sin(angles[0]) * radii[0]
    );
    for (let i = 1; i < angles.length; i++) {
        ctx.lineTo(
            Math.cos(angles[i]) * radii[i],
            Math.sin(angles[i]) * radii[i]
        );
    }
    ctx.closePath();
    ctx.stroke();
    
    ctx.restore();
}

// Create new meteor
function createMeteor() {
    const size = Math.random() * 30 + 20;
    const points = 8;
    const angles = [];
    const radii = [];
    for (let i = 0; i < points; i++) {
        angles.push((Math.PI * 2 / points) * i);
        radii.push(size * (0.7 + Math.random() * 0.3));
    }
    
    // Calculate meteor vertices for collision detection
    const vertices = [];
    for (let i = 0; i < angles.length; i++) {
        vertices.push({
            x: Math.cos(angles[i]) * radii[i],
            y: Math.sin(angles[i]) * radii[i]
        });
    }
    
    meteors.push({
        x: canvas.width + size,
        y: Math.random() * (canvas.height - size * 2) + size,
        size: size,
        speed: gameSpeed + Math.random() * 2,
        angles: angles,
        radii: radii,
        vertices: vertices // Store vertices for polygon collision
    });
    meteorsSpawnedThisWave++;
}

// Update game
function update() {
    if (gameState !== 'playing') return;
    
    frameCount++;
    
    // Update player position
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        player.y -= player.speed;
        if (player.y < player.height / 2) {
            player.y = player.height / 2;
        }
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        player.y += player.speed;
        if (player.y > canvas.height - player.height / 2) {
            player.y = canvas.height - player.height / 2;
        }
    }
    
    // Wave system: spawn 25 meteors per wave
    if (meteorsSpawnedThisWave < METEORS_PER_WAVE) {
        // Spawn meteors more frequently to get 25 per wave
        const spawnInterval = Math.max(10, 60 - (currentWave * 2)); // Faster spawning as waves increase
        if (frameCount % spawnInterval === 0) {
            createMeteor();
        }
    } else if (meteorsSpawnedThisWave >= METEORS_PER_WAVE && meteors.length === 0) {
        // All meteors cleared, move to next wave
        currentWave++;
        meteorsSpawnedThisWave = 0;
        meteorsInWave = 0;
        gameSpeed += 0.5; // Increase speed each wave
    }
    
    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
        meteors[i].x -= meteors[i].speed;
        
        // Remove meteors that are off screen
        if (meteors[i].x + meteors[i].size < 0) {
            meteors.splice(i, 1);
            meteorsInWave++;
            score += 10;
            continue;
        }
        
        // Improved collision detection: polygon vs rectangle
        if (checkCollision(player, meteors[i])) {
            // Play hit sound effect
            hitSound.currentTime = 0; // Reset to beginning
            hitSound.play().catch(e => {
                console.warn('Could not play hit sound:', e);
            });
            gameOver();
            return;
        }
    }
    
    // Update score and wave display
    document.getElementById('scoreDisplay').textContent = `Score: ${score} | Wave: ${currentWave}`;
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds (background decoration) - moving right to left
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 5; i++) {
        const cloudX = (canvas.width + 50 - (frameCount * 0.3) + i * 200) % (canvas.width + 100) - 50;
        const cloudY = 50 + i * 100;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 30, 0, Math.PI * 2);
        ctx.arc(cloudX + 25, cloudY, 35, 0, Math.PI * 2);
        ctx.arc(cloudX + 50, cloudY, 30, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (gameState === 'playing') {
        // Draw meteors
        meteors.forEach(meteor => {
            drawMeteor(meteor.x, meteor.y, meteor.size, meteor.angles, meteor.radii);
        });
        
        // Draw player
        if (imageLoaded) {
            // Draw image sprite
            ctx.drawImage(
                playerImage,
                player.x - player.width / 2,
                player.y - player.height / 2,
                player.width,
                player.height
            );
        } else {
            // Fallback to drawn sprite if image not loaded
            drawPterodactyl(player.x, player.y, player.width, player.height);
        }
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Collision detection: Only check if meteor edge lines intersect player rectangle
function checkCollision(player, meteor) {
    // Use a smaller collision box for player (accounting for transparent wing areas)
    // The pterodactyl has large wings but the body is much smaller
    const collisionWidth = player.width * 0.2;  // 20% of width (body area only)
    const collisionHeight = player.height * 0.2; // 20% of height (body area only)
    
    // Get player bounding box edges (centered on player)
    const playerLeft = player.x - collisionWidth / 2;
    const playerRight = player.x + collisionWidth / 2;
    const playerTop = player.y - collisionHeight / 2;
    const playerBottom = player.y + collisionHeight / 2;
    
    // Get meteor vertices in world coordinates (these define the rock's edge lines)
    const meteorVertices = meteor.vertices.map(v => ({
        x: meteor.x + v.x,
        y: meteor.y + v.y
    }));
    
    // Player rectangle edges
    const playerEdges = [
        [{ x: playerLeft, y: playerTop }, { x: playerRight, y: playerTop }],      // Top
        [{ x: playerRight, y: playerTop }, { x: playerRight, y: playerBottom }],  // Right
        [{ x: playerRight, y: playerBottom }, { x: playerLeft, y: playerBottom }], // Bottom
        [{ x: playerLeft, y: playerBottom }, { x: playerLeft, y: playerTop }]     // Left
    ];
    
    // Check if any meteor edge line intersects with any player edge line
    for (let i = 0; i < meteorVertices.length; i++) {
        const v1 = meteorVertices[i];
        const v2 = meteorVertices[(i + 1) % meteorVertices.length];
        
        // Check this meteor edge against all player edges
        for (let playerEdge of playerEdges) {
            if (linesIntersect(v1, v2, playerEdge[0], playerEdge[1])) {
                return true;
            }
        }
    }
    
    return false;
}

// Check if two line segments intersect (precise line-to-line collision)
function linesIntersect(p1, p2, p3, p4) {
    const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
    if (d === 0) return false;
    
    const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
    const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
    
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// Handle name input Enter key
document.addEventListener('DOMContentLoaded', () => {
    const firstNameInput = document.getElementById('firstNameInput');
    const lastInitialInput = document.getElementById('lastInitialInput');
    
    if (firstNameInput) {
        firstNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                lastInitialInput.focus();
            }
        });
    }
    
    if (lastInitialInput) {
        lastInitialInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitPlayerName();
            }
        });
    }
});

// Initialize leaderboard display and load stored player name on page load
window.addEventListener('load', () => {
    displayLeaderboard();
    // Load stored player name if it exists
    const storedName = getStoredPlayerName();
    if (storedName) {
        playerName = storedName.firstName;
        playerInitial = storedName.lastInitial;
    }
});

// Start game loop
gameLoop();

