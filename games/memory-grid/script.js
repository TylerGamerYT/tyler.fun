// ---- Game State Variables ----
let level = 1, score = 0, phase = 'show'; // 'show' | 'recall' | 'result'
let gridSize = 3, litCount = 3;
let pattern = [], playerClicks = [], gridTiles = [];
let showTimeout = null;

// ---- Event Listeners ----
document.getElementById('tryAgainBtn').addEventListener('click', startGame);
document.getElementById('nextBtn').addEventListener('click', nextRound);

// ---- Game Loop Controls ----
function startGame() {
    level = 1; 
    score = 0;
    document.getElementById('gameover').classList.remove('show');
    document.getElementById('nextBtn').classList.remove('show');
    startRound();
}

function startRound() {
    gridSize = level < 3 ? 3 : level < 6 ? 4 : 5;
    litCount = 2 + level;
    if (litCount > gridSize * gridSize) litCount = Math.floor(gridSize * gridSize * 0.6);
    phase = 'show';
    playerClicks = [];
    pattern = [];

    updateHud();
    setBadge('memorise', 'Memorise');
    setStatus('Watch the pattern...');
    document.getElementById('nextBtn').classList.remove('show');

    buildGrid();

    // Pick random tiles to light up
    const all = Array.from({ length: gridSize * gridSize }, (_, i) => i);
    while (pattern.length < litCount) {
        const idx = all.splice(Math.floor(Math.random() * all.length), 1)[0];
        pattern.push(idx);
    }

    // Display pattern briefly
    setTimeout(() => {
        pattern.forEach(i => gridTiles[i].classList.add('lit'));
        const showTime = Math.max(800, 2000 - level * 80);
        showTimeout = setTimeout(() => {
            pattern.forEach(i => gridTiles[i].classList.remove('lit'));
            phase = 'recall';
            setBadge('recall', 'Recall');
            setStatus(`Click the ${litCount} tiles you saw`);
        }, showTime);
    }, 300);
}

function buildGrid() {
    const grid = document.getElementById('grid');
    const size = Math.min(360, window.innerWidth - 60);
    const tileSize = Math.floor((size - (gridSize - 1) * 8) / gridSize);
    grid.style.gridTemplateColumns = `repeat(${gridSize}, ${tileSize}px)`;
    grid.innerHTML = '';
    gridTiles = [];
    
    for (let i = 0; i < gridSize * gridSize; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.width = tileSize + 'px';
        tile.style.height = tileSize + 'px';
        tile.dataset.idx = i;
        tile.onclick = () => tileClick(i);
        grid.appendChild(tile);
        gridTiles.push(tile);
    }
}

function tileClick(idx) {
    if (phase !== 'recall') return;
    if (playerClicks.includes(idx)) return;
    playerClicks.push(idx);

    if (pattern.includes(idx)) {
        gridTiles[idx].classList.add('correct');
    } else {
        gridTiles[idx].classList.add('wrong');
        revealMissed();
        endRound(false);
        return;
    }

    if (playerClicks.length === pattern.length) {
        endRound(true);
    }
}

function revealMissed() {
    pattern.forEach(i => {
        if (!playerClicks.includes(i)) gridTiles[i].classList.add('missed');
    });
}

function endRound(success) {
    phase = 'result';
    if (success) {
        score += level * litCount * 10;
        level++;
        setBadge('result-good', '✓ Correct!');
        setStatus(`Nice! +${(level - 1) * (litCount) * 10} points`, 'good');
        updateHud();
        setTimeout(() => {
            document.getElementById('nextBtn').classList.add('show');
        }, 400);
    } else {
        setBadge('result-bad', '✗ Wrong');
        setStatus('You missed one. Game over.', 'bad');
        setTimeout(() => {
            document.getElementById('goLevel').textContent = level;
            document.getElementById('goScore').textContent = score;
            document.getElementById('goTitle').textContent = level < 3 ? 'Brain empty.' : level < 6 ? 'Not bad!' : level < 10 ? 'Solid memory!' : 'Absolutely massive brain.';
            document.getElementById('gameover').classList.add('show');
        }, 1200);
    }
}

function nextRound() {
    document.getElementById('nextBtn').classList.remove('show');
    startRound();
}

function updateHud() {
    document.getElementById('levelVal').textContent = level;
    document.getElementById('scoreVal').textContent = score;
    document.getElementById('tilesVal').textContent = Math.min(litCount, Math.pow(level < 3 ? 3 : level < 6 ? 4 : 5, 2));
}

function setBadge(cls, text) {
    const b = document.getElementById('phaseBadge');
    b.className = 'phase-badge ' + cls;
    b.textContent = text;
}

function setStatus(msg, cls = '') {
    const el = document.getElementById('status');
    el.textContent = msg; 
    el.className = 'status' + (cls ? ' ' + cls : '');
}

// Initial start
startGame();

// ---- Starfield Particle System ----
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let W, H, stars = [];

function resize() { 
    W = canvas.width = window.innerWidth; 
    H = canvas.height = window.innerHeight; 
}

function initStars() { 
    stars = []; 
    for (let i = 0; i < Math.floor((W * H) / 8000); i++) {
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
    ctx.clearRect(0, 0, W, H); 
    t += 0.016; 
    for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,197,255,${Math.max(0, s.opacity + Math.sin(t * s.ts * 60 + s.to) * 0.14)})`;
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
