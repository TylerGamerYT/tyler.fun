const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W, H;

function resize() { 
    W = canvas.width = window.innerWidth; 
    H = canvas.height = window.innerHeight; 
}
resize();
window.addEventListener('resize', resize);

let mx = -999, my = -999;
let dots = [], running = false, startTime, animId, best = 0, elapsed = 0;
const PLAYER_R = 10;

document.addEventListener('mousemove', e => { 
    mx = e.clientX; 
    my = e.clientY; 
    if (!running) startGame(); 
});

document.addEventListener('touchmove', e => { 
    e.preventDefault(); 
    mx = e.touches[0].clientX; 
    my = e.touches[0].clientY; 
    if (!running) startGame(); 
}, { passive: false });

document.addEventListener('touchstart', e => { 
    mx = e.touches[0].clientX; 
    my = e.touches[0].clientY; 
}, { passive: true });

function spawnDot() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 2 + elapsed * 0.3;
    const r = 18 + Math.random() * 22;

    if (side === 0) { 
        x = Math.random() * W; y = -r; vx = (Math.random() - 0.5) * speed; vy = speed; 
    } else if (side === 1) { 
        x = W + r; y = Math.random() * H; vx = -speed; vy = (Math.random() - 0.5) * speed; 
    } else if (side === 2) { 
        x = Math.random() * W; y = H + r; vx = (Math.random() - 0.5) * speed; vy = -speed; 
    } else { 
        x = -r; y = Math.random() * H; vx = speed; vy = (Math.random() - 0.5) * speed; 
    }

    // Aim slightly toward player
    const dx = mx - x, dy = my - y, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0 && Math.random() < 0.4) { 
        vx += (dx / dist) * speed * 0.5; 
        vy += (dy / dist) * speed * 0.5; 
    }

    dots.push({ x, y, vx, vy, r, opacity: 0 });
}

let spawnTimer = 0, spawnRate = 1.2;

function startGame() {
    document.getElementById('startOverlay').classList.remove('show');
    document.getElementById('deadOverlay').classList.remove('show');
    dots = []; 
    running = true; 
    startTime = Date.now(); 
    elapsed = 0;
    spawnTimer = 0; 
    spawnRate = 1.2;

    if (animId) cancelAnimationFrame(animId);
    loop();
}

function loop() {
    if (!running) return;
    elapsed = (Date.now() - startTime) / 1000;
    spawnTimer += 1 / 60;
    spawnRate = Math.max(0.3, 1.2 - elapsed * 0.04);
    if (spawnTimer >= spawnRate) { 
        spawnDot(); 
        spawnTimer = 0; 
    }

    update();
    draw();
    document.getElementById('timeHud').textContent = elapsed.toFixed(1);
    animId = requestAnimationFrame(loop);
}

function update() {
    dots.forEach(d => {
        d.x += d.vx; 
        d.y += d.vy;
        if (d.opacity < 1) d.opacity = Math.min(1, d.opacity + 0.05);

        // Check collision with player
        const dx = mx - d.x, dy = my - d.y;
        if (Math.sqrt(dx * dx + dy * dy) < PLAYER_R + d.r - 4) { 
            die(); 
        }
    });

    // Remove off-screen dots
    dots = dots.filter(d => d.x > -100 && d.x < W + 100 && d.y > -100 && d.y < H + 100);
}

function draw() {
    ctx.clearRect(0, 0, W, H);

    // BG Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Dots
    dots.forEach(d => {
        ctx.globalAlpha = d.opacity;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; ctx.fill();
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 2; ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Player
    if (mx > 0) {
        ctx.beginPath(); ctx.arc(mx, my, PLAYER_R, 0, Math.PI * 2);
        ctx.fillStyle = '#60a5fa'; ctx.fill();
        ctx.beginPath(); ctx.arc(mx, my, PLAYER_R + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(96,165,250,0.3)'; ctx.lineWidth = 3; ctx.stroke();
    }
}

function die() {
    running = false;
    if (elapsed > best) best = elapsed;
    document.getElementById('bestHud').textContent = best.toFixed(1);
    
    const title = elapsed < 3 ? 'Brutal.' : elapsed < 8 ? 'Not bad!' : elapsed < 20 ? 'Impressive!' : 'Are you a wizard?';
    document.getElementById('deadTitle').textContent = title;
    document.getElementById('deadTime').textContent = elapsed.toFixed(1);
    document.getElementById('deadBest').textContent = best.toFixed(1);
    
    setTimeout(() => document.getElementById('deadOverlay').classList.add('show'), 400);
}