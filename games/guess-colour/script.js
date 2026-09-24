// Named colours for easy mode
const NAMED_COLORS = [
    { hex: '#ef4444', name: 'Red' },
    { hex: '#f97316', name: 'Orange' },
    { hex: '#fbbf24', name: 'Amber' },
    { hex: '#10b981', name: 'Emerald' },
    { hex: '#3b82f6', name: 'Blue' },
    { hex: '#8b5cf6', name: 'Violet' },
    { hex: '#ec4899', name: 'Pink' },
    { hex: '#14b8a6', name: 'Teal' },
    { hex: '#f43f5e', name: 'Rose' },
    { hex: '#84cc16', name: 'Lime' },
    { hex: '#06b6d4', name: 'Cyan' },
    { hex: '#a855f7', name: 'Purple' },
    { hex: '#eab308', name: 'Yellow' },
    { hex: '#22c55e', name: 'Green' },
    { hex: '#6366f1', name: 'Indigo' },
    { hex: '#f59e0b', name: 'Gold' },
    { hex: '#64748b', name: 'Slate' },
    { hex: '#dc2626', name: 'Dark Red' }
];

let score = 0, streak = 0, best = 0, mode = 'easy';
let correctHex = '', answered = false;

function setMode(m) {
    mode = m;
    document.getElementById('modeEasy').className = 'mode-btn' + (m === 'easy' ? ' active' : '');
    document.getElementById('modeHard').className = 'mode-btn' + (m === 'hard' ? ' active' : '');
    score = 0; 
    streak = 0; 
    updateStats();
    nextRound();
}

function randHex() {
    return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

function similarHex(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const vary = () => Math.max(0, Math.min(255, Math.floor(Math.random() * 80) - 40));
    const toHex = n => n.toString(16).padStart(2, '0');
    
    return '#' + toHex(r + vary()) + toHex(g + vary()) + toHex(b + vary());
}

function nextRound() {
    answered = false;
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('nextBtn').classList.remove('show');

    let options;
    if (mode === 'easy') {
        const shuffled = [...NAMED_COLORS].sort(() => Math.random() - 0.5);
        const picks = shuffled.slice(0, 3);
        const correct = picks[Math.floor(Math.random() * 3)];
        correctHex = correct.hex;
        options = picks;
    } else {
        correctHex = randHex();
        const wrong1 = similarHex(correctHex);
        const wrong2 = similarHex(correctHex);
        options = [{ hex: correctHex }, { hex: wrong1 }, { hex: wrong2 }].sort(() => Math.random() - 0.5);
    }

    document.getElementById('swatch').style.background = correctHex;
    document.getElementById('hexDisplay').textContent = mode === 'hard' ? '???' : correctHex.toUpperCase();

    const grid = document.getElementById('optionsGrid');
    grid.innerHTML = '';
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `
            <div class="opt-swatch" style="background:${opt.hex}"></div>
            <div>
                <div class="opt-hex">${opt.hex.toUpperCase()}</div>
                ${opt.name ? `<div class="opt-name">${opt.name}</div>` : ''}
            </div>
        `;
        btn.onclick = () => answer(opt.hex, btn);
        grid.appendChild(btn);
    });
}

function answer(hex, btn) {
    if (answered) return;
    answered = true;
    const correct = hex === correctHex;

    document.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = true;
        const bHex = b.querySelector('.opt-hex').textContent.toLowerCase();
        if (bHex === correctHex) b.classList.add('correct');
    });

    if (correct) {
        btn.classList.add('correct');
        score += mode === 'hard' ? 20 : 10;
        streak++;
        if (streak > best) best = streak;
        document.getElementById('feedback').textContent = streak > 3 ? `✓ Correct! ${streak} in a row 🔥` : '✓ Correct!';
        document.getElementById('feedback').className = 'feedback good';
        document.getElementById('hexDisplay').textContent = correctHex.toUpperCase();
    } else {
        btn.classList.add('wrong');
        streak = 0;
        document.getElementById('feedback').textContent = `✗ That was ${correctHex.toUpperCase()}`;
        document.getElementById('feedback').className = 'feedback bad';
        document.getElementById('hexDisplay').textContent = correctHex.toUpperCase();
    }

    updateStats();
    setTimeout(() => document.getElementById('nextBtn').classList.add('show'), 300);
}

function updateStats() {
    document.getElementById('scoreVal').textContent = score;
    document.getElementById('streakVal').textContent = streak;
    document.getElementById('bestVal').textContent = best;
}

nextRound();

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
