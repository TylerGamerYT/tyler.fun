const COLS = 14, ROWS = 14, MAX_MOVES = 25;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#fbbf24', '#a855f7', '#f97316'];
let grid = [], moves = 0, won = false;

const canvas = document.getElementById('floodCanvas');
const ctx = canvas.getContext('2d');
let cell;

function newGame() {
    const maxW = Math.min(window.innerWidth - 48, 400);
    cell = Math.floor(maxW / COLS);
    canvas.width = cell * COLS; 
    canvas.height = cell * ROWS;
    
    grid = Array.from({ length: ROWS }, () => 
        Array.from({ length: COLS }, () => COLORS[Math.floor(Math.random() * COLORS.length)])
    );
    
    moves = 0; 
    won = false;
    document.getElementById('resultMsg').textContent = '';
    document.getElementById('resultMsg').className = 'result-msg';
    
    updateHud(); 
    drawGrid(); 
    buildColorBtns();
}

function drawGrid() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            ctx.fillStyle = grid[r][c];
            ctx.fillRect(c * cell, r * cell, cell, cell);
        }
    }
}

function buildColorBtns() {
    const btns = document.getElementById('colorBtns');
    btns.innerHTML = '';
    COLORS.forEach(col => {
        const btn = document.createElement('div');
        btn.className = 'color-btn' + (col === grid[0][0] ? ' selected' : '');
        btn.style.background = col;
        btn.onclick = () => { if (!won) flood(col); };
        btns.appendChild(btn);
    });
}

function flood(newColor) {
    const current = grid[0][0];
    if (newColor === current) return;
    moves++;
    fill(0, 0, current, newColor);
    drawGrid(); 
    updateHud(); 
    buildColorBtns();
    
    const flooded = grid.flat().filter(c => c === grid[0][0]).length;
    if (flooded === COLS * ROWS) {
        won = true;
        document.getElementById('resultMsg').textContent = `🎉 You won in ${moves} moves!`;
        document.getElementById('resultMsg').className = 'result-msg win';
    } else if (moves >= MAX_MOVES) {
        document.getElementById('resultMsg').textContent = `💀 Out of moves! ${Math.round((flooded / (COLS * ROWS)) * 100)}% flooded.`;
        document.getElementById('resultMsg').className = 'result-msg lose';
    }
}

function fill(r, c, target, replacement) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || grid[r][c] !== target) return;
    grid[r][c] = replacement;
    fill(r + 1, c, target, replacement); 
    fill(r - 1, c, target, replacement);
    fill(r, c + 1, target, replacement); 
    fill(r, c - 1, target, replacement);
}

function updateHud() {
    document.getElementById('movesVal').textContent = moves;
    document.getElementById('maxVal').textContent = MAX_MOVES;
    const flooded = grid.flat().filter(c => c === grid[0][0]).length;
    document.getElementById('pctVal').textContent = Math.round((flooded / (COLS * ROWS)) * 100) + '%';
}

newGame();

// Background Canvas Animation
const pCanvas = document.getElementById('particles'), pCtx = pCanvas.getContext('2d');
let W, H, stars = [];

function resize() { 
    W = pCanvas.width = window.innerWidth; 
    H = pCanvas.height = window.innerHeight; 
}

function initStars() { 
    stars = []; 
    for(let i = 0; i < Math.floor((W * H) / 8000); i++) {
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

let t = 0;
function draw() { 
    pCtx.clearRect(0, 0, W, H); 
    t += 0.016; 
    for (const s of stars) {
        pCtx.beginPath();
        pCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        pCtx.fillStyle = `rgba(148,197,255,${Math.max(0, s.opacity + Math.sin(t * s.ts * 60 + s.to) * 0.14)})`;
        pCtx.fill();
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
    newGame();
});
