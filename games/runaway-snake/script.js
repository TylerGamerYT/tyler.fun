const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const CELL = 20;
let COLS, ROWS, W, H;

const startOverlay = document.getElementById('startOverlay');
const gameOverlay = document.getElementById('gameOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const scoreHud = document.getElementById('scoreHud');
const lenHud = document.getElementById('lenHud');
const bestHud = document.getElementById('bestHud');

const ovTitle = document.getElementById('ovTitle');
const ovScore = document.getElementById('ovScore');
const ovLen = document.getElementById('ovLen');

let snake, dir, nextDir, food, foodDir, score, running, animId, best = 0;
let stepInterval = null;

// Controls map
const DIRS = { 
    ArrowUp: { x: 0, y: -1 }, 
    ArrowDown: { x: 0, y: 1 }, 
    ArrowLeft: { x: -1, y: 0 }, 
    ArrowRight: { x: 1, y: 0 }, 
    w: { x: 0, y: -1 }, 
    s: { x: 0, y: 1 }, 
    a: { x: -1, y: 0 }, 
    d: { x: 1, y: 0 } 
};

function resize() {
    const maxW = Math.min(window.innerWidth - 32, 480);
    const maxH = Math.min(window.innerHeight - 200, 420);
    COLS = Math.floor(maxW / CELL);
    ROWS = Math.floor(maxH / CELL);
    W = canvas.width = COLS * CELL;
    H = canvas.height = ROWS * CELL;
}

function startGame() {
    startOverlay.classList.remove('show');
    gameOverlay.classList.remove('show');

    snake = [{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }];
    dir = { x: 1, y: 0 }; 
    nextDir = { x: 1, y: 0 };
    score = 0; 
    running = true;

    spawnFood();
    updateHud();

    clearInterval(stepInterval);
    stepInterval = setInterval(step, 120);
    if (animId) cancelAnimationFrame(animId);
    drawLoop();
}

function spawnFood() {
    do {
        food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
    
    foodDir = { x: Math.random() < 0.5 ? 1 : -1, y: 0 };
}

function step() {
    if (!running) return;
    dir = { ...nextDir };

    // Move snake
    const head = { 
        x: (snake[0].x + dir.x + COLS) % COLS, 
        y: (snake[0].y + dir.y + ROWS) % ROWS 
    };

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) { 
        die(); 
        return; 
    }

    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        if (score > best) best = score;
        updateHud();
        spawnFood();
    } else {
        snake.pop();
    }

    // Move food away from snake
    moveFood();
}

function moveFood() {
    const dx = food.x - snake[0].x;
    const dy = food.y - snake[0].y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
        // Flee logic
        const mx = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : 0;
        const my = Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? 1 : -1) : 0;
        let nx = (food.x + mx + COLS) % COLS;
        let ny = (food.y + my + ROWS) % ROWS;

        if (!snake.some(s => s.x === nx && s.y === ny)) { 
            food.x = nx; 
            food.y = ny; 
        } else {
            // Try alternative escape directions
            for (const [fx, fy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                nx = (food.x + fx + COLS) % COLS; 
                ny = (food.y + fy + ROWS) % ROWS;
                if (!snake.some(s => s.x === nx && s.y === ny)) { 
                    food.x = nx; 
                    food.y = ny; 
                    break; 
                }
            }
        }
    } else if (Math.random() < 0.3) {
        // Random wander
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const [fx, fy] = dirs[Math.floor(Math.random() * 4)];
        const nx = (food.x + fx + COLS) % COLS;
        const ny = (food.y + fy + ROWS) % ROWS;
        if (!snake.some(s => s.x === nx && s.y === ny)) { 
            food.x = nx; 
            food.y = ny; 
        }
    }
}

function die() {
    running = false;
    clearInterval(stepInterval);

    const titles = score < 30 ? 'You died.' : score < 80 ? 'Not bad!' : score < 150 ? 'Snake master!' : 'Legendary.';
    ovTitle.textContent = titles;
    ovScore.textContent = score;
    ovLen.textContent = snake.length;

    setTimeout(() => gameOverlay.classList.add('show'), 400);
}

function drawLoop() {
    draw();
    if (running) animId = requestAnimationFrame(drawLoop);
}

function drawIdle() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(30,58,138,0.05)';
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) { 
            ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1); 
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, W, H);

    // Grid background
    ctx.fillStyle = 'rgba(255,255,255,0.015)';
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        }
    }

    // Snake rendering
    snake.forEach((seg, i) => {
        const alpha = 1 - (i / snake.length) * 0.6;
        ctx.fillStyle = i === 0 ? '#60a5fa' : `rgba(59,130,246,${alpha})`;
        ctx.beginPath();
        ctx.roundRect(seg.x * CELL + 2, seg.y * CELL + 2, CELL - 4, CELL - 4, i === 0 ? 6 : 4);
        ctx.fill();
    });

    // Food rendering
    ctx.font = `${CELL - 2}px serif`;
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.fillText('🍎', food.x * CELL + CELL / 2, food.y * CELL + CELL / 2 + 1);
}

function updateHud() {
    scoreHud.textContent = score;
    lenHud.textContent = snake.length;
    bestHud.textContent = best;
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

window.addEventListener('resize', () => { 
    resize(); 
    if (!running) drawIdle(); 
});

document.addEventListener('keydown', e => {
    const d = DIRS[e.key];
    if (!d) return;
    e.preventDefault();
    if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
});

// Touch controls
let touchStart = null;

canvas.addEventListener('touchstart', e => { 
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; 
}, { passive: true });

canvas.addEventListener('touchend', e => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if ((dx > 0 ? 1 : -1) !== -dir.x) nextDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
        if ((dy > 0 ? 1 : -1) !== -dir.y) nextDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }
    touchStart = null;
}, { passive: true });

// Initialization
resize();
drawIdle();
