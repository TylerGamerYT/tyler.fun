let started = false, dead = false;
let startTime = null, survivalTime = 0, best = 0;
let lavaHeight = 80;
let timerInterval = null;
let mouseY = -999, mouseX = -999;

const cursor = document.getElementById('cursor');
const lavaEl = document.getElementById('lava');
const timerEl = document.getElementById('timerBig');
const risingWarn = document.getElementById('risingWarn');

// Track mouse movement
document.addEventListener('mousemove', e => {
    mouseX = e.clientX; 
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
    if (!started && !dead) startGame();
    if (!dead) checkLava();
});

// Track mobile touch interaction
document.addEventListener('touchmove', e => {
    e.preventDefault();
    mouseX = e.touches[0].clientX; 
    mouseY = e.touches[0].clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
    if (!started && !dead) startGame();
    if (!dead) checkLava();
}, { passive: false });

function startGame() {
    started = true; 
    dead = false;
    lavaHeight = 80;
    lavaEl.style.height = lavaHeight + 'px';
    startTime = Date.now();
    survivalTime = 0;
    
    document.getElementById('startHint').style.opacity = '0';
    document.getElementById('gameover').classList.remove('show');
    risingWarn.classList.remove('show');

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (dead) return;
        
        survivalTime = (Date.now() - startTime) / 1000;
        timerEl.textContent = survivalTime.toFixed(1);
        timerEl.className = 'timer-big' + (survivalTime > 10 ? ' danger' : '');

        // Lava height increases every 3 seconds
        lavaHeight = 80 + Math.floor(survivalTime / 3) * 18;
        lavaHeight = Math.min(lavaHeight, window.innerHeight - 100);
        lavaEl.style.height = lavaHeight + 'px';
        document.getElementById('lavaHeight').textContent = Math.round(lavaHeight) + 'px';

        // Trigger warning UI when lava reaches high threshold
        if (lavaHeight > 200) risingWarn.classList.add('show');

        // Apply proximity danger state to cursor
        const distFromLava = window.innerHeight - lavaHeight - mouseY;
        cursor.className = 'cursor' + (distFromLava < 80 ? ' danger' : '');

        checkLava();
    }, 50);
}

function checkLava() {
    if (dead) return;
    const lavaTop = window.innerHeight - lavaHeight;
    if (mouseY >= lavaTop - 14) { // 14px represents the cursor radius
        die();
    }
}

function die() {
    dead = true; 
    started = false;
    clearInterval(timerInterval);
    
    if (survivalTime > best) best = survivalTime;
    
    document.getElementById('bestTime').textContent = best.toFixed(1) + 's';
    document.getElementById('goTime').textContent = survivalTime.toFixed(1);
    document.getElementById('gameover').classList.add('show');
    risingWarn.classList.remove('show');
    document.getElementById('startHint').style.opacity = '1';
}

/* Background Particle FX */
const c = document.createElement('canvas');
c.id = 'particles'; 
c.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;';
document.body.prepend(c);

const ctx = c.getContext('2d');
let W, H, stars = [];

function resize() { 
    W = c.width = window.innerWidth; 
    H = c.height = window.innerHeight; 
}

function initStars() { 
    stars = []; 
    const count = Math.floor((W * H) / 8000);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.1 + 0.3,
            speed: Math.random() * 0.14 + 0.03,
            opacity: Math.random() * 0.45 + 0.1,
            ts: Math.random() * 0.01 + 0.003,
            to: Math.random() * Math.PI * 2
        });
    }
}

let tt = 0;
function draw() { 
    ctx.clearRect(0, 0, W, H); 
    tt += 0.016; 
    
    for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        const currentOpacity = Math.max(0, s.opacity + Math.sin(tt * s.ts * 60 + s.to) * 0.14);
        ctx.fillStyle = `rgba(148, 197, 255, ${currentOpacity})`;
        ctx.fill();
        
        s.y -= s.speed;
        if (s.y < -2) {
            s.y = H + 2;
            s.x = Math.random() * W;
        }
    } 
    requestAnimationFrame(draw); 
}

resize(); 
initStars(); 
draw();

window.addEventListener('resize', () => {
    resize();
    initStars();
});
