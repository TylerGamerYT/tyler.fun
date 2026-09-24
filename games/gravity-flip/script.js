const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width  = Math.min(window.innerWidth - 32, 520);
    canvas.height = Math.min(window.innerHeight - 200, 340);
}
resize();
window.addEventListener('resize', resize);

const W = () => canvas.width;
const H = () => canvas.height;

// Game state
let player, obstacles, score, best = 0, running = false, animId;
let cameraX, speed, gravDir, frameCount;

const PLAYER_X = 80;
const PLAYER_SIZE = 22;
const OBS_W = 28;
const GAP = 150;

function startGame() {
    document.getElementById('startOverlay').classList.remove('show');
    document.getElementById('deadOverlay').classList.remove('show');

    player = { y: H() / 2, vy: 0, grounded: false };
    obstacles = [];
    score = 0; 
    cameraX = 0; 
    speed = 3; 
    gravDir = 1; 
    frameCount = 0;
    running = true;

    // Pre-generate initial obstacles
    generateObs(W() + 100);
    generateObs(W() + 100 + GAP + OBS_W + 180);

    if (animId) cancelAnimationFrame(animId);
    loop();
}

function generateObs(x) {
    // Random gap positioning
    const gapY = 60 + Math.random() * (H() - 140);
    const gapH = 90 + Math.random() * 40;
    obstacles.push({ x, gapY, gapH });
}

function flipGravity() {
    if (!running) return;
    gravDir *= -1;
    player.vy = 0;
}

function loop() {
    if (!running) return;
    update();
    draw();
    animId = requestAnimationFrame(loop);
}

function update() {
    frameCount++;
    
    // Increase game speed over time
    speed = 3 + frameCount * 0.001;

    // Apply gravity
    const GRAV = 0.45;
    player.vy += GRAV * gravDir;
    player.vy = Math.max(-10, Math.min(10, player.vy));
    player.y += player.vy;

    // Boundary collisions
    if (player.y - PLAYER_SIZE / 2 < 0) { 
        player.y = PLAYER_SIZE / 2; 
        player.vy = Math.abs(player.vy) * 0.5; 
        die(); 
        return; 
    }
    if (player.y + PLAYER_SIZE / 2 > H()) { 
        player.y = H() - PLAYER_SIZE / 2; 
        player.vy = -Math.abs(player.vy) * 0.5; 
        die(); 
        return; 
    }

    // Move obstacles
    obstacles.forEach(o => o.x -= speed);

    // Recycle off-screen obstacles & spawn new ones
    if (obstacles[0] && obstacles[0].x + OBS_W < -20) {
        obstacles.shift();
        const lastX = obstacles[obstacles.length - 1]?.x ?? W();
        generateObs(lastX + GAP + OBS_W + 100 + Math.random() * 80);
    }

    // Check obstacle collisions
    for (const o of obstacles) {
        const px = PLAYER_X, py = player.y;
        const pr = PLAYER_SIZE / 2 - 3;
        
        if (px + pr > o.x && px - pr < o.x + OBS_W) {
            if (py - pr < o.gapY || py + pr > o.gapY + o.gapH) { 
                die(); 
                return; 
            }
        }
    }

    score = Math.floor(frameCount * speed / 10);
    if (score > best) best = score;
    document.getElementById('scoreHud').textContent = score + 'm';
    document.getElementById('bestHud').textContent  = best + 'm';
}

function die() {
    running = false;
    const title = score < 20 ? 'Ouch.' : score < 60 ? 'Getting there.' : score < 150 ? 'Not bad!' : 'Gravity wizard!';
    document.getElementById('deadTitle').textContent = title;
    document.getElementById('deadScore').textContent = score + 'm';
    document.getElementById('deadBest').textContent  = best + 'm';
    setTimeout(() => document.getElementById('deadOverlay').classList.add('show'), 500);
}

function draw() {
    ctx.clearRect(0, 0, W(), H());

    // Background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W(); x += 40) { 
        ctx.beginPath(); 
        ctx.moveTo(x, 0); 
        ctx.lineTo(x, H()); 
        ctx.stroke(); 
    }
    for (let y = 0; y < H(); y += 40) { 
        ctx.beginPath(); 
        ctx.moveTo(0, y); 
        ctx.lineTo(W(), y); 
        ctx.stroke(); 
    }

    // Draw obstacles
    obstacles.forEach(o => {
        ctx.fillStyle = '#ef4444';
        
        // Top bar
        ctx.beginPath(); 
        ctx.roundRect(o.x, 0, OBS_W, o.gapY, [0, 0, 6, 6]); 
        ctx.fill();
        
        // Bottom bar
        ctx.beginPath(); 
        ctx.roundRect(o.x, o.gapY + o.gapH, OBS_W, H() - o.gapY - o.gapH, [6, 6, 0, 0]); 
        ctx.fill();
        
        // Edge Spikes
        ctx.fillStyle = '#fca5a5';
        drawSpike(o.x + OBS_W / 2, o.gapY, false);
        drawSpike(o.x + OBS_W / 2, o.gapY + o.gapH, true);
    });

    // Draw player
    const px = PLAYER_X, py = player.y;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(gravDir === -1 ? Math.PI : 0);
    
    // Body
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.roundRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE, 6);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath(); 
    ctx.arc(4, -4, 4, 0, Math.PI * 2); 
    ctx.fill();
    
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath(); 
    ctx.arc(5, -4, 2, 0, Math.PI * 2); 
    ctx.fill();
    
    ctx.restore();

    // Gravity state indicator
    ctx.font = '16px serif';
    ctx.textAlign = 'right'; 
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(gravDir === 1 ? '↓ gravity' : '↑ gravity', W() - 10, 10);
}

function drawSpike(x, y, pointUp) {
    ctx.beginPath();
    if (pointUp) { 
        ctx.moveTo(x - 8, y); 
        ctx.lineTo(x + 8, y); 
        ctx.lineTo(x, y - 12); 
    } else { 
        ctx.moveTo(x - 8, y); 
        ctx.lineTo(x + 8, y); 
        ctx.lineTo(x, y + 12); 
    }
    ctx.closePath(); 
    ctx.fill();
}

// Controls
document.addEventListener('keydown', e => { 
    if (e.code === 'Space') { 
        e.preventDefault(); 
        flipGravity(); 
    } 
});

canvas.addEventListener('click', flipGravity);

canvas.addEventListener('touchstart', e => { 
    e.preventDefault(); 
    flipGravity(); 
}, { passive: false });
