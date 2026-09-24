const COLOURS = [
    { name: 'Red',    hex: '#ef4444' },
    { name: 'Blue',   hex: '#3b82f6' },
    { name: 'Green',  hex: '#22c55e' },
    { name: 'Yellow', hex: '#fbbf24' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Pink',   hex: '#ec4899' },
    { name: 'Teal',   hex: '#14b8a6' },
];

const TIME = 30;
let score = 0, streak = 0, bestStreak = 0, timeLeft = TIME, timerInterval = null, started = false, answered = false;
let correctColour = null;

function startGame() {
    score = 0; streak = 0; bestStreak = 0; timeLeft = TIME; started = false; answered = false;
    clearInterval(timerInterval);
    document.getElementById('gameover').classList.remove('show');
    document.getElementById('timerBar').style.width = '100%';
    document.getElementById('timerBar').className = 'timer-bar';
    updateStats();
    nextRound();
    document.getElementById('feedback').textContent = 'Click the colour named above';
    document.getElementById('feedback').className = 'feedback';
}

function nextRound() {
    answered = false;
    // Pick correct colour
    correctColour = COLOURS[Math.floor(Math.random() * COLOURS.length)];
    // Pick 3 wrong colours
    const others = COLOURS.filter(c => c.name !== correctColour.name).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...others, correctColour].sort(() => Math.random() - 0.5);
    // Pick a distractor colour for the text (different from correct)
    const distractor = COLOURS.filter(c => c.name !== correctColour.name)[Math.floor(Math.random() * 7)];

    const prompt = document.getElementById('prompt');
    prompt.textContent = correctColour.name.toUpperCase();
    prompt.style.color = distractor.hex;

    const grid = document.getElementById('colourGrid');
    grid.innerHTML = '';
    options.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'colour-btn';
        btn.style.background = c.hex;
        btn.onclick = () => answer(c, btn);
        grid.appendChild(btn);
    });
}

function answer(c, btn) {
    if (answered) return;
    answered = true;
    if (!started) { started = true; startTimer(); }

    if (c.name === correctColour.name) {
        score += streak > 4 ? 3 : 1; 
        streak++;
        if (streak > bestStreak) bestStreak = streak;
        btn.classList.add('correct');
        setFeedback('✓ Correct!', 'good');
    } else {
        streak = 0;
        btn.classList.add('wrong');
        // Show correct option
        document.querySelectorAll('.colour-btn').forEach((b) => {
            if (b.style.background === hexToRgb(correctColour.hex) || b.style.backgroundColor === correctColour.hex) {
                b.classList.add('correct');
            }
        });
        setFeedback(`✗ That was ${c.name.toLowerCase()}. You needed ${correctColour.name.toLowerCase()}.`, 'bad');
    }
    updateStats();
    setTimeout(nextRound, 600);
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

function setFeedback(msg, cls) { 
    const el = document.getElementById('feedback'); 
    el.textContent = msg; 
    el.className = 'feedback ' + cls; 
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft = Math.max(0, timeLeft - 0.1);
        updateStats();
        const pct = (timeLeft / TIME) * 100;
        const bar = document.getElementById('timerBar');
        bar.style.width = pct + '%';
        bar.className = 'timer-bar' + (pct < 25 ? ' danger' : pct < 50 ? ' warn' : '');
        if (timeLeft <= 0) endGame();
    }, 100);
}

function updateStats() {
    document.getElementById('scoreVal').textContent = score;
    document.getElementById('streakVal').textContent = streak;
    document.getElementById('timeVal').textContent = Math.ceil(timeLeft);
}

function endGame() {
    clearInterval(timerInterval);
    const title = score < 5 ? 'Colour blind?' : score < 15 ? 'Not bad!' : score < 30 ? 'Sharp eyes!' : 'Colour wizard.';
    document.getElementById('goTitle').textContent = title;
    document.getElementById('goScore').textContent = score;
    document.getElementById('goStreak').textContent = bestStreak;
    document.getElementById('gameover').classList.add('show');
}

startGame();

// Background Canvas Animation
const canvas = document.getElementById('particles'), ctx = canvas.getContext('2d');
let W, H, stars = [];

function resize() { 
    W = canvas.width = window.innerWidth; 
    H = canvas.height = window.innerHeight; 
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
window.addEventListener('resize', () => { resize(); initStars(); });
