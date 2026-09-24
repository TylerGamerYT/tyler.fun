const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Sizing
function resize() {
    const maxW = Math.min(window.innerWidth - 32, 520);
    const maxH = Math.min(window.innerHeight - 200, 480);
    canvas.width  = maxW;
    canvas.height = maxH;
}
resize();
window.addEventListener('resize', () => { resize(); initBricks(); });

// Game state
let score = 0, lives = 3, level = 1;
let running = false, animId = null;

// Paddle
let paddle = { w: 80, h: 10, x: 0, y: 0, speed: 0, target: 0 };

// Ball
let ball = { x: 0, y: 0, vx: 0, vy: 0, r: 7, speed: 3.5 };

// Bricks
const ROWS = 5, COLS = 8;
const BRICK_PAD = 5;
let bricks = [];

// Curse types weighted toward none
const CURSES = ['dodge', 'split', 'grow', 'shield', 'none', 'none', 'none'];

function initBricks() {
    bricks = [];
    const bw = (canvas.width - BRICK_PAD * (COLS + 1)) / COLS;
    const bh = 18;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const curse = CURSES[Math.floor(Math.random() * CURSES.length)];
            bricks.push({
                x: BRICK_PAD + c * (bw + BRICK_PAD),
                y: 40 + r * (bh + BRICK_PAD),
                w: bw, h: bh,
                hp: curse === 'shield' ? 2 : 1,
                curse,
                alive: true,
                vx: 0, vy: 0, // for dodge
                color: getCurseColor(curse),
            });
        }
    }
}

function getCurseColor(curse) {
    return { dodge:'#8b5cf6', split:'#f97316', grow:'#ef4444', shield:'#fbbf24', none:'#3b82f6' }[curse] || '#3b82f6';
}

function initBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 80;
    const angle = (Math.random() * 60 + 60) * Math.PI / 180;
    const sp = ball.speed + level * 0.3;
    ball.vx = sp * Math.cos(angle) * (Math.random() < 0.5 ? 1 : -1);
    ball.vy = -sp * Math.sin(angle);
}

function initPaddle() {
    paddle.w = Math.max(60, 90 - level * 4);
    paddle.x = canvas.width / 2 - paddle.w / 2;
    paddle.y = canvas.height - 20;
    paddle.target = paddle.x;
}

function startGame() {
    score = 0; lives = 3; level = 1;
    document.getElementById('message').classList.remove('show');
    updateHud();
    initBricks();
    initPaddle();
    initBall();
    running = true;
    if (animId) cancelAnimationFrame(animId);
    loop();
}

function nextLevel() {
    level++;
    updateHud();
    initBricks();
    initBall();
}

function loseLife() {
    lives--;
    updateHud();
    if (lives <= 0) { gameOver(); return; }
    initBall();
}

function gameOver() {
    running = false;
    document.getElementById('msgEmoji').textContent = '💀';
    document.getElementById('msgTitle').textContent = 'Game Over';
    document.getElementById('msgSub').innerHTML = `Score: <span>${score}</span> · Level: <span>${level}</span>`;
    document.getElementById('message').classList.add('show');
}

function updateHud() {
    document.getElementById('scoreHud').textContent = score;
    document.getElementById('livesHud').textContent = lives;
    document.getElementById('levelHud').textContent = level;
}

// Input listeners
document.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    paddle.target = e.clientX - rect.left - paddle.w / 2;
});

document.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    paddle.target = e.touches[0].clientX - rect.left - paddle.w / 2;
}, { passive: false });

// Main loop
function loop() {
    if (!running) return;
    update();
    draw();
    animId = requestAnimationFrame(loop);
}

function update() {
    // Paddle movement
    paddle.x += (paddle.target - paddle.x) * 0.2;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));

    // Dodge bricks move away from the ball
    bricks.filter(b => b.alive && b.curse === 'dodge').forEach(b => {
        const dx = ball.x - (b.x + b.w / 2);
        const dy = ball.y - (b.y + b.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
            b.x -= (dx / dist) * 1.2;
            b.y -= (dy / dist) * 0.6;
            b.x = Math.max(0, Math.min(canvas.width - b.w, b.x));
            b.y = Math.max(30, Math.min(canvas.height / 2, b.y));
        }
    });

    // Ball movement
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Boundary bounces
    if (ball.x - ball.r < 0)               { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
    if (ball.x + ball.r > canvas.width)   { ball.x = canvas.width - ball.r; ball.vx = -Math.abs(ball.vx); }
    if (ball.y - ball.r < 0)              { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }

    // Bottom loss
    if (ball.y + ball.r > canvas.height) { loseLife(); return; }

    // Paddle collision
    if (ball.vy > 0 &&
        ball.y + ball.r >= paddle.y &&
        ball.y + ball.r <= paddle.y + paddle.h + Math.abs(ball.vy) &&
        ball.x >= paddle.x - ball.r &&
        ball.x <= paddle.x + paddle.w + ball.r) {
        ball.vy = -Math.abs(ball.vy);
        const rel = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        ball.vx = rel * (ball.speed + level * 0.3) * 1.5;
    }

    // Brick collisions
    let allDead = true;
    bricks.forEach(b => {
        if (!b.alive) return;
        allDead = false;
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
            ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
            b.hp--;
            if (b.hp <= 0) {
                b.alive = false;
                applyCurse(b);
                score += 10 * level;
                updateHud();
            }
            // Collision bounce calculation
            const overlapL = ball.x + ball.r - b.x;
            const overlapR = b.x + b.w - (ball.x - ball.r);
            const overlapT = ball.y + ball.r - b.y;
            const overlapB = b.y + b.h - (ball.y - ball.r);
            const minH = Math.min(overlapL, overlapR);
            const minV = Math.min(overlapT, overlapB);
            if (minH < minV) ball.vx = -ball.vx;
            else             ball.vy = -ball.vy;
        }
    });

    if (allDead) nextLevel();
}

function applyCurse(b) {
    if (b.curse === 'split') {
        for (let i = 0; i < 2; i++) {
            bricks.push({
                x: b.x + (Math.random() - 0.5) * 40,
                y: b.y + (Math.random() - 0.5) * 20,
                w: b.w * 0.7, h: b.h,
                hp: 1, curse: 'none', alive: true,
                color: '#fb923c',
            });
        }
    }
    if (b.curse === 'grow') {
        const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        ball.vx = (ball.vx / spd) * (spd + 0.5);
        ball.vy = (ball.vy / spd) * (spd + 0.5);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render Bricks
    bricks.filter(b => b.alive).forEach(b => {
        ctx.fillStyle = b.curse === 'shield' && b.hp === 2 ? '#fbbf24' : b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();

        if (b.curse !== 'none') {
            ctx.font = '9px Inter';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.textAlign = 'center';
            const label = { dodge:'dodge', split:'split', grow:'faster', shield:'shield' }[b.curse];
            ctx.fillText(label, b.x + b.w / 2, b.y + b.h - 4);
        }
    });

    // Render Paddle
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 5);
    ctx.fill();

    // Render Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();

    // Render Ball glow
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(248,250,252,0.1)';
    ctx.fill();
}

document.getElementById('message').classList.add('show');
