const COLORS = ['red', 'blue', 'green', 'yellow'];
let sequence = [], playerSeq = [], round = 1, best = 0;
let showing = false, canClick = false;

// Evil tricks applied at certain rounds
const tricks = {
    3:  { msg: '😈 The buttons have swapped positions!', fn: swapButtons },
    6:  { msg: '😈 One wrong button is in the sequence!', fn: addFakeStep },
    9:  { msg: '😈 The colours have switched names!', fn: swapColors },
    12: { msg: '😈 The sequence plays backwards!', fn: () => {} }, // handled in show
    15: { msg: '😈 Lights flash twice as fast!', fn: () => {} },   // handled in show
};

let colorsSwapped = false, buttonsSwapped = false, hasFakeStep = false, fakeIdx = -1;

function startGame() {
    sequence = []; 
    round = 1;
    colorsSwapped = false; 
    buttonsSwapped = false; 
    hasFakeStep = false; 
    fakeIdx = -1;
    
    resetButtonPositions();
    document.getElementById('gameover').classList.remove('show');
    setButtons(false);
    nextRound();
}

function nextRound() {
    document.getElementById('roundVal').textContent = round;
    setStatus('Watch the sequence...', '');
    
    const trick = tricks[round];
    if (trick) {
        showTrick(trick.msg, trick.fn);
        setTimeout(() => addAndShow(), 1800);
    } else {
        addAndShow();
    }
}

function addAndShow() {
    sequence.push(COLORS[Math.floor(Math.random() * 4)]);
    
    // Fake step condition for round 6+
    if (round >= 6 && Math.random() < 0.3) {
        hasFakeStep = true;
        fakeIdx = Math.floor(Math.random() * sequence.length);
    } else { 
        hasFakeStep = false; 
        fakeIdx = -1; 
    }

    playerSeq = [];
    showSequence();
}

function showSequence() {
    showing = true; 
    canClick = false;
    setButtons(true);

    let displaySeq = [...sequence];
    if (round >= 12) displaySeq = [...sequence].reverse();

    const speed = round >= 15 ? 300 : 600;
    let i = 0;

    function showNext() {
        if (i >= displaySeq.length) {
            showing = false;
            setTimeout(() => { 
                canClick = true; 
                setButtons(false); 
                setStatus('Your turn!', 'good'); 
            }, 300);
            return;
        }
        const color = displaySeq[i];
        lightUp(color, () => { 
            i++; 
            setTimeout(showNext, speed * 0.4); 
        }, speed * 0.5);
    }
    setTimeout(showNext, 400);
}

function lightUp(color, cb, duration) {
    let displayColor = color;
    if (colorsSwapped) {
        const swapMap = { red: 'blue', blue: 'red', green: 'yellow', yellow: 'green' };
        displayColor = swapMap[color];
    }
    const btn = document.querySelector(`.simon-btn[data-color="${displayColor}"]`);
    if (btn) {
        btn.classList.add('lit');
        setTimeout(() => { 
            btn.classList.remove('lit'); 
            if (cb) cb(); 
        }, duration);
    } else if (cb) {
        cb();
    }
}

function playerClick(color) {
    if (!canClick || showing) return;
    
    const btn = document.querySelector(`.simon-btn[data-color="${color}"]`);
    btn.classList.add('clicked');
    setTimeout(() => btn.classList.remove('clicked'), 150);

    let actualColor = color;
    if (colorsSwapped) {
        const swapMap = { red: 'blue', blue: 'red', green: 'yellow', yellow: 'green' };
        actualColor = swapMap[color];
    }

    playerSeq.push(actualColor);
    const idx = playerSeq.length - 1;

    // Check fake step collision
    if (hasFakeStep && idx === fakeIdx) {
        setStatus('You repeated the fake!', 'bad');
        gameover(); 
        return;
    }

    const expected = sequence[hasFakeStep && idx >= fakeIdx ? idx - 1 : idx];
    if (actualColor !== expected) {
        setStatus('Wrong!', 'bad');
        gameover(); 
        return;
    }

    if (playerSeq.length >= sequence.length) {
        round++;
        if (round - 1 > best) best = round - 1;
        document.getElementById('bestVal').textContent = best;
        setStatus('✓ Correct!', 'good');
        canClick = false;
        setTimeout(nextRound, 800);
    }
}

function gameover() {
    canClick = false; 
    setButtons(false);
    document.getElementById('goTitle').textContent = round < 4 ? 'Got you.' : round < 8 ? 'Almost!' : round < 12 ? 'Impressive!' : 'Unkillable??';
    document.getElementById('goRound').textContent = round;
    setTimeout(() => document.getElementById('gameover').classList.add('show'), 800);
}

function setButtons(disabled) {
    document.querySelectorAll('.simon-btn').forEach(b => b.disabled = disabled);
}

function setStatus(msg, cls) { 
    const el = document.getElementById('status'); 
    el.textContent = msg; 
    el.className = 'status' + (cls ? ' ' + cls : ''); 
}

function showTrick(msg, fn) {
    const el = document.getElementById('trickLabel');
    el.textContent = msg; 
    el.classList.add('show');
    fn();
    setTimeout(() => el.classList.remove('show'), 1600);
}

function swapButtons() {
    buttonsSwapped = true;
    const grid = document.querySelector('.simon-grid');
    const btns = [...grid.children];
    // Visually swap DOM nodes
    grid.appendChild(btns[3]); 
    grid.appendChild(btns[2]);
    grid.appendChild(btns[1]); 
    grid.appendChild(btns[0]);
}

function resetButtonPositions() {
    if (!buttonsSwapped) return;
    const grid = document.querySelector('.simon-grid');
    const ordered = ['red', 'blue', 'green', 'yellow'].map(c => document.querySelector(`.simon-btn[data-color="${c}"]`));
    ordered.forEach(b => grid.appendChild(b));
    buttonsSwapped = false;
}

function addFakeStep() { /* Logic handled dynamically inside showSequence */ }
function swapColors() { colorsSwapped = !colorsSwapped; }

startGame();

/* Background Particles Engine */
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let W, H, stars = [];

function resize() { 
    W = canvas.width = window.innerWidth; 
    H = canvas.height = window.innerHeight; 
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

let t = 0;
function draw() { 
    ctx.clearRect(0, 0, W, H); 
    t += 0.016; 
    for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        const currentOpacity = Math.max(0, s.opacity + Math.sin(t * s.ts * 60 + s.to) * 0.14);
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
