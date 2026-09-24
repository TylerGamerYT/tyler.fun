// ---- Game State ----
let level = 1;
let currentNumber = '';
let phase = 'show';
let countdownInterval = null;
let best = parseInt(localStorage.getItem('nummem_best') || '0');

// ---- DOM Elements ----
const bestDisplay = document.getElementById('bestDisplay');
const numInput = document.getElementById('numInput');
const submitBtn = document.getElementById('submitBtn');
const retryBtn = document.getElementById('retryBtn');
const levelBadge = document.getElementById('levelBadge');
const numDisplay = document.getElementById('numDisplay');
const countdownEl = document.getElementById('countdown');
const feedbackEl = document.getElementById('feedback');
const gameoverEl = document.getElementById('gameover');
const goTitle = document.getElementById('goTitle');
const goSub = document.getElementById('goSub');
const goAnswer = document.getElementById('goAnswer');

// ---- Setup & Event Listeners ----
bestDisplay.textContent = best || '—';

numInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitAnswer();
});

submitBtn.addEventListener('click', submitAnswer);
retryBtn.addEventListener('click', startGame);

// ---- Game Logic ----
function startGame() {
    level = 1;
    gameoverEl.classList.remove('show');
    nextRound();
}

function nextRound() {
    const digits = 2 + level;
    levelBadge.textContent = `Level ${level} · ${digits} digits`;
    numInput.value = '';
    numInput.disabled = true;
    numInput.className = 'num-input';
    submitBtn.disabled = true;
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';

    // Generate number
    currentNumber = '';
    for (let i = 0; i < digits; i++) {
        currentNumber += Math.floor(Math.random() * 10);
    }

    // Show number
    numDisplay.classList.remove('hidden');
    numDisplay.textContent = currentNumber;
    phase = 'show';

    // Countdown to hide
    const showTime = Math.max(1500, 4000 - level * 200);
    let remaining = showTime;
    clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        remaining -= 100;
        const secs = (remaining / 1000).toFixed(1);
        countdownEl.textContent = `Hiding in ${secs}s`;
        countdownEl.className = 'countdown' + (remaining < 1500 ? ' urgent' : '');
        
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            hideNumber();
        }
    }, 100);
}

function hideNumber() {
    numDisplay.classList.add('hidden');
    countdownEl.textContent = 'What was the number?';
    countdownEl.className = 'countdown';

    setTimeout(() => {
        numDisplay.textContent = '?';
        numDisplay.classList.remove('hidden');
        numInput.disabled = false;
        numInput.focus();
        submitBtn.disabled = false;
        phase = 'recall';
    }, 300);
}

function submitAnswer() {
    if (phase !== 'recall') return;
    const guess = numInput.value.trim();

    if (guess === currentNumber) {
        numInput.className = 'num-input correct';
        feedbackEl.textContent = `✓ Correct! +${level * 10} points`;
        feedbackEl.className = 'feedback good';
        level++;
        
        const digits = 2 + level - 1;
        if (digits > best) {
            best = digits;
            localStorage.setItem('nummem_best', best);
            bestDisplay.textContent = best;
        }

        phase = 'waiting';
        clearInterval(countdownInterval);
        countdownEl.textContent = 'Next round in 1s...';
        setTimeout(nextRound, 1000);
    } else {
        numInput.className = 'num-input wrong';
        feedbackEl.textContent = '✗ Wrong!';
        feedbackEl.className = 'feedback bad';
        phase = 'done';
        clearInterval(countdownInterval);

        setTimeout(() => {
            goTitle.textContent = level < 3 ? 'Brain empty.' : level < 6 ? 'Not bad!' : level < 10 ? 'Impressive!' : 'Absolute legend.';
            goSub.textContent = `You got to level ${level} (${1 + level} digits). The number was:`;
            goAnswer.textContent = currentNumber;
            gameoverEl.classList.add('show');
        }, 800);
    }
}

// Start game on load
startGame();

// ---- Background Star Particles ----
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
