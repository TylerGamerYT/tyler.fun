// ---- DOM & Canvas Setup ----
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreHud = document.getElementById('scoreHud');
const bestHud = document.getElementById('bestHud');
const startOverlay = document.getElementById('startOverlay');
const deadOverlay = document.getElementById('deadOverlay');
const deadTitle = document.getElementById('deadTitle');
const deadSub = document.getElementById('deadSub');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');

function resize() { 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
}
resize();
window.addEventListener('resize', resize);

// ---- Game Constants & Data ----
const W = () => canvas.width;
const H = () => canvas.height;
const PIPE_W = 60;
const GAP = 180;
const PIPE_SPEED = 2.8;
const BIRD_X = 120;
const BIRD_R = 16;

const OPINIONS_GOOD = ['Nice!', 'Clean!', 'Smooth!', 'Elegant.', 'Acceptable.', '10/10', 'Not bad.', 'Wow ok.', 'You tried.'];
const OPINIONS_BAD  = ['Too low.', 'Too high.', 'Barely.', 'Really??', 'Ugh.', 'That was ugly.', 'Lucky.', 'My gap is NOT for crashing.', 'I have feelings.', 'Rude.', 'Watch it!'];

// ---- Game State Variables ----
let bird;
let pipes;
let score;
let best = 0;
let running = false;
let animId;
let frameCount;

// ---- Event Listeners ----
startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => { 
    if (e.code === 'Space') { 
        e.preventDefault(); 
        flap(); 
    } 
});

canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    flap(); 
}, { passive: false });

// ---- Game Flow & Control ----
function startGame() {
    startOverlay.classList.remove('show');
    deadOverlay.classList.remove('show');
    bird = { y: H() / 2, vy: 0 };
    pipes = [];
    score = 0;
    frameCount = 0;
    running = true;
    
    updateHud();
    if (animId) cancelAnimationFrame(animId);
    loop();
}

function flap() { 
    if (running) bird.vy = -8; 
}

function spawnPipe() {
    const minY = 80;
    const maxY = H() - 80 - GAP;
    const gapY = minY + Math.random() * (maxY - minY);
    const opinion = Math.random() < 0.5 
        ? OPINIONS_GOOD[Math.floor(Math.random() * OPINIONS_GOOD.length)] 
        : OPINIONS_BAD[Math.floor(Math.random() * OPINIONS_BAD.length)];

    pipes.push({ 
        x: W() + PIPE_W, 
        gapY, 
        opinion, 
        showOpinion: false, 
        opinionTimer: 0, 
        passed: false, 
        color: `hsl(${Math.random() * 60 + 160},60%,40%)` 
    });
}

function loop() {
    if (!running) return;
    update();
    draw();
    animId = requestAnimationFrame(loop);
}

// ---- Game Logic Update ----
function update() {
    frameCount++;
    bird.vy += 0.4;
    bird.y += bird.vy;

    // Spawn pipes
    if (frameCount % 90 === 0) spawnPipe();

    pipes.forEach((p) => {
        p.x -= PIPE_SPEED;
        if (p.opinionTimer > 0) p.opinionTimer--;

        // Score + trigger opinion speech bubble
        if (!p.passed && p.x + PIPE_W < BIRD_X) {
            p.passed = true; 
            p.showOpinion = true; 
            p.opinionTimer = 80;
            score++; 
            updateHud();
        }
    });

    // Remove off-screen pipes
    pipes = pipes.filter((p) => p.x > -PIPE_W - 10);

    // Collisions
    if (bird.y - BIRD_R < 0 || bird.y + BIRD_R > H()) { 
        die(); 
        return; 
    }

    for (const p of pipes) {
        if (BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W) {
            if (bird.y - BIRD_R < p.gapY || bird.y + BIRD_R > p.gapY + GAP) { 
                die(); 
                return; 
            }
        }
    }
}

// ---- Rendering ----
function draw() {
    // Background gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, H());
    grad.addColorStop(0, '#020617'); 
    grad.addColorStop(1, '#0f2040');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W(), H());

    // Pipes
    pipes.forEach((p) => {
        ctx.fillStyle = p.color;
        
        // Top pipe
        ctx.beginPath(); 
        ctx.roundRect(p.x, 0, PIPE_W, p.gapY, [0, 0, 10, 10]); 
        ctx.fill();

        // Bottom pipe
        ctx.beginPath(); 
        ctx.roundRect(p.x, p.gapY + GAP, PIPE_W, H() - p.gapY - GAP, [10, 10, 0, 0]); 
        ctx.fill();

        // Pipe rims
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); 
        ctx.roundRect(p.x - 4, p.gapY - 16, PIPE_W + 8, 16, 6); 
        ctx.fill();

        ctx.beginPath(); 
        ctx.roundRect(p.x - 4, p.gapY + GAP, PIPE_W + 8, 16, 6); 
        ctx.fill();

        // Opinion speech bubble
        if (p.showOpinion && p.opinionTimer > 0) {
            const alpha = Math.min(1, p.opinionTimer / 20);
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.textAlign = 'center';

            const tx = p.x + PIPE_W / 2;
            const ty = p.gapY + GAP / 2;
            const tw = ctx.measureText(p.opinion).width + 16;

            ctx.fillStyle = 'rgba(15,23,42,0.95)';
            ctx.beginPath(); 
            ctx.roundRect(tx - tw / 2, ty - 14, tw, 26, 8); 
            ctx.fill();

            ctx.fillStyle = '#f8fafc';
            ctx.fillText(p.opinion, tx, ty + 5);
            ctx.globalAlpha = 1;
        }
    });

    // Bird
    ctx.save();
    ctx.translate(BIRD_X, bird.y);
    ctx.rotate(Math.min(Math.max(bird.vy * 0.05, -0.5), 0.8));
    ctx.font = `${BIRD_R * 2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐦', 0, 0);
    ctx.restore();
}

function die() {
    running = false;
    if (score > best) best = score;

    const title = score === 0 ? 'Immediately.' 
        : score < 5 ? 'Not great.' 
        : score < 15 ? 'Decent!' 
        : score < 30 ? 'Nice run!' 
        : 'Are you a bird?';

    deadTitle.textContent = title;
    deadSub.textContent = `Score: ${score} · Best: ${best}`;
    updateHud();

    setTimeout(() => deadOverlay.classList.add('show'), 500);
}

function updateHud() {
    scoreHud.textContent = score;
    bestHud.textContent = best;
}
