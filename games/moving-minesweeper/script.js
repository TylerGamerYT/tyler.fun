// ---- Game Configuration and State ----
const COLS = 10, ROWS = 10, MINES = 10, MOVE_EVERY = 3;
let cells, revealed, flagged, mines, clicks, flagMode, dead, won;

// ---- Event Listeners ----
document.getElementById('flagBtn').addEventListener('click', toggleFlag);
document.getElementById('newGameBtn').addEventListener('click', newGame);
document.getElementById('retryBtn').addEventListener('click', newGame);

// ---- Game Logic ----
function newGame() {
    cells = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    revealed = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    flagged = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    mines = new Set(); 
    clicks = 0; 
    flagMode = false; 
    dead = false; 
    won = false;

    document.getElementById('overlay').classList.remove('show');
    document.getElementById('msg').textContent = '';
    document.getElementById('flagBtn').classList.remove('active');

    placeMines();
    calcNumbers();
    renderGrid();
    updateHud();
}

function placeMines(avoidR = -1, avoidC = -1) {
    mines.clear();
    while (mines.size < MINES) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);
        if (Math.abs(r - avoidR) <= 1 && Math.abs(c - avoidC) <= 1) continue;
        mines.add(r * COLS + c);
    }
}

function calcNumbers() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (mines.has(r * COLS + c)) { 
                cells[r][c] = -1; 
                continue; 
            }
            let n = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && mines.has(nr * COLS + nc)) {
                        n++;
                    }
                }
            }
            cells[r][c] = n;
        }
    }
}

function moveMines() {
    const newMines = new Set();
    mines.forEach(idx => {
        const r = Math.floor(idx / COLS), c = idx % COLS;
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        const valid = dirs.filter(([dr, dc]) => { 
            const nr = r + dr, nc = c + dc; 
            return nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !revealed[nr][nc]; 
        });

        if (valid.length) { 
            const [dr, dc] = valid[Math.floor(Math.random() * valid.length)]; 
            newMines.add((r + dr) * COLS + (c + dc)); 
        } else {
            newMines.add(idx);
        }
    });

    mines = newMines;
    calcNumbers();

    // Check if any revealed cell is now a mine
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (revealed[r][c] && mines.has(r * COLS + c)) { 
                triggerDeath(r, c); 
                return; 
            }
        }
    }
}

function toggleFlag() {
    flagMode = !flagMode;
    document.getElementById('flagBtn').classList.toggle('active', flagMode);
}

function clickCell(r, c) {
    if (dead || won || revealed[r][c]) return;
    if (flagMode) { 
        flagged[r][c] = !flagged[r][c]; 
        renderGrid(); 
        return; 
    }
    if (flagged[r][c]) return;

    // Ensure first click is always safe
    if (clicks === 0) { 
        placeMines(r, c); 
        calcNumbers(); 
    }

    clicks++;
    if (mines.has(r * COLS + c)) { 
        triggerDeath(r, c); 
        return; 
    }

    reveal(r, c);
    if (clicks % MOVE_EVERY === 0) moveMines();
    checkWin();
    renderGrid(); 
    updateHud();
}

function reveal(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || revealed[r][c] || flagged[r][c]) return;
    revealed[r][c] = true;
    if (cells[r][c] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                reveal(r + dr, c + dc);
            }
        }
    }
}

function triggerDeath(r, c) {
    dead = true; 
    revealed[r][c] = true;
    renderGrid();
    document.getElementById('ovEmoji').textContent = '💣';
    document.getElementById('ovTitle').textContent = 'Boom.';
    document.getElementById('ovSub').textContent = 'A mine got you. Mines moved ' + (Math.floor(clicks / MOVE_EVERY)) + ' time(s).';
    document.getElementById('overlay').classList.add('show');
}

function checkWin() {
    let safe = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!mines.has(r * COLS + c) && !revealed[r][c]) safe++;
        }
    }
    if (safe === 0) {
        won = true;
        document.getElementById('ovEmoji').textContent = '🏆';
        document.getElementById('ovTitle').textContent = 'You won!';
        document.getElementById('ovSub').textContent = `Cleared in ${clicks} clicks with ${Math.floor(clicks / MOVE_EVERY)} mine movements.`;
        document.getElementById('overlay').classList.add('show');
    }
}

function renderGrid() {
    const g = document.getElementById('grid');
    g.style.gridTemplateColumns = `repeat(${COLS}, 32px)`;
    g.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const div = document.createElement('div');
            div.className = 'cell';
            
            if (revealed[r][c]) {
                div.classList.add('revealed');
                if (mines.has(r * COLS + c)) { 
                    div.classList.add('mine'); 
                    div.textContent = '💣'; 
                } else if (cells[r][c] > 0) { 
                    div.classList.add('n' + cells[r][c]); 
                    div.textContent = cells[r][c]; 
                }
            } else if (flagged[r][c]) {
                div.classList.add('flagged'); 
                div.textContent = '🚩';
            }

            div.onclick = () => clickCell(r, c);
            div.oncontextmenu = (e) => { 
                e.preventDefault(); 
                flagged[r][c] = !flagged[r][c]; 
                renderGrid(); 
            };

            g.appendChild(div);
        }
    }
}

function updateHud() {
    const flagCount = [...Array(ROWS * COLS).keys()].filter(i => flagged[Math.floor(i / COLS)][i % COLS]).length;
    document.getElementById('minesLeft').textContent = MINES - flagCount;
    document.getElementById('clicksVal').textContent = clicks;
    
    let safe = 0; 
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!mines.has(r * COLS + c) && !revealed[r][c]) safe++;
        }
    }
    document.getElementById('safeLeft').textContent = safe;
}

// Initial Game Setup
newGame();

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
