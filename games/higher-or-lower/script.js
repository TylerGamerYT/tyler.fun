let current, next, streak = 0, best = 0, history = [];
let guessing = false;

const feedbacks = {
    correct: ["Nice!", "Correct!", "Yep!", "Easy.", "Got it.", "Nailed it.", "Obviously.", "Too easy?"],
    wrong:   ["Nope.", "Ouch.", "Wrong!", "Really?", "lol", "Yikes.", "So close.", "Not quite."]
};

function randFrom(arr) { 
    return arr[Math.floor(Math.random() * arr.length)]; 
}

function getRange() {
    // Range expands as streak grows — makes it harder
    return Math.min(100 + streak * 20, 1000);
}

function randInt(max) { 
    return Math.floor(Math.random() * max) + 1; 
}

function startGame() {
    streak = 0; 
    history = []; 
    guessing = false;
    document.getElementById('gameover').classList.remove('show');
    document.getElementById('history').innerHTML = '';
    document.getElementById('feedback').textContent = 'Make your first guess!';
    updateStats();
    
    current = randInt(getRange());
    next = randInt(getRange());
    while (next === current) next = randInt(getRange());
    
    document.getElementById('bigNumber').textContent = current;
    document.getElementById('bigNumber').className = 'big-number';
    document.getElementById('rangeMax').textContent = getRange();
}

function guess(dir) {
    if (guessing) return;
    guessing = true;

    const isHigher = next > current;
    const correct = (dir === 'higher' && isHigher) || (dir === 'lower' && !isHigher);

    const el = document.getElementById('bigNumber');
    el.textContent = next;
    el.className = 'big-number ' + (correct ? 'correct' : 'wrong');

    if (correct) {
        streak++;
        if (streak > best) best = streak;
        history.push({ val: next, correct: true });
        document.getElementById('feedback').textContent = randFrom(feedbacks.correct);
        updateStats();
        addHistoryChip(next, true);
        
        setTimeout(() => {
            current = next;
            const range = getRange();
            next = randInt(range);
            while (next === current) next = randInt(range);
            
            el.textContent = current;
            el.className = 'big-number';
            document.getElementById('rangeMax').textContent = range;
            guessing = false;
        }, 700);
    } else {
        history.push({ val: next, correct: false });
        addHistoryChip(next, false);
        document.getElementById('feedback').textContent = randFrom(feedbacks.wrong);
        setTimeout(() => showGameOver(), 800);
    }
}

function addHistoryChip(val, correct) {
    const hist = document.getElementById('history');
    const chip = document.createElement('span');
    chip.className = 'hist-chip ' + (correct ? 'correct' : 'wrong');
    chip.textContent = val;
    hist.appendChild(chip);
    
    // Keep last 10 chips
    while (hist.children.length > 10) hist.removeChild(hist.firstChild);
}

function showGameOver() {
    const msgs = streak === 0
        ? ["That was quick.", "Rough start.", "First try!"]
        : streak < 5 ? ["Not bad.", "Keep practicing.", "Almost had it."]
        : streak < 10 ? ["Solid run!", "Getting good!", "Impressive!"]
        : ["Legendary.", "Are you cheating?", "Absolutely cracked."];
        
    document.getElementById('goEmoji').textContent = streak >= 10 ? '🏆' : streak >= 5 ? '😎' : '💀';
    document.getElementById('goTitle').textContent = randFrom(msgs);
    document.getElementById('goScore').textContent = streak;
    document.getElementById('gameover').classList.add('show');
}

function updateStats() {
    document.getElementById('scoreVal').textContent = streak;
    document.getElementById('bestVal').textContent = best;
}

startGame();

// Background Star Particle Field
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
        const opacity = Math.max(0, s.opacity + Math.sin(t * s.ts * 60 + s.to) * 0.14);
        ctx.fillStyle = `rgba(148, 197, 255, ${opacity})`;
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
