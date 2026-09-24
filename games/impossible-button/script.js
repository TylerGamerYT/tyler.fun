// ---- Elements & Variables ----
const btn = document.getElementById('impossibleBtn');
const missCountEl = document.getElementById('missCount');

let misses = 0;
let btnW = 0;
let btnH = 0;

const taunts = [
    "Nope.", "Too slow!", "Haha.", "Nice try.", "Not today.",
    "Lol.", "Almost!", "Nuh uh.", "Try harder.", "lmaooo",
    "You'll never catch me.", "Bro really tried.", "Imagine clicking me.",
    "Keep dreaming.", "Get rekt.", "Speedrun any%?", "skill issue",
    "I'm literally running away.", "Your cursor is embarrassing.",
    "Maybe next time.", "I felt that. Just kidding I didn't.",
    "You're not even close.", "Sir this is a button.", "Not a chance.",
    "I have all day.", "Do you?", "I'll be here forever.", "Womp womp."
];

// ---- Dimensions & Positioning ----
function getSize() {
    const rect = btn.getBoundingClientRect();
    btnW = rect.width;
    btnH = rect.height;
}

function randomPos() {
    const margin = 40;
    const x = margin + Math.random() * (window.innerWidth - btnW - margin * 2);
    const y = margin + Math.random() * (window.innerHeight - btnH - margin * 2);
    return { x, y };
}

function setPos(x, y) {
    btn.style.left = x + 'px';
    btn.style.top = y + 'px';
}

function initPosition() {
    getSize();
    setPos((window.innerWidth - btnW) / 2, (window.innerHeight - btnH) / 2);
}

// ---- Flee Behavior ----
let lastEscape = 0;

document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastEscape < 60) return; // throttle checks to 60ms
    lastEscape = now;

    getSize();
    const rect = btn.getBoundingClientRect();
    const bx = rect.left + btnW / 2;
    const by = rect.top + btnH / 2;

    const dx = e.clientX - bx;
    const dy = e.clientY - by;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Sensitivity scales up as missed attempts accumulate
    const threshold = 160 + misses * 2;

    if (dist < threshold) {
        const angle = Math.atan2(dy, dx);
        const flee = 180 + misses * 3;
        let nx = rect.left - Math.cos(angle) * flee;
        let ny = rect.top - Math.sin(angle) * flee;

        // Keep button safely inside visible window boundaries
        nx = Math.max(10, Math.min(window.innerWidth - btnW - 10, nx));
        ny = Math.max(10, Math.min(window.innerHeight - btnH - 10, ny));

        setPos(nx, ny);
    }
});

// ---- Click & Miss Handlers ----
document.addEventListener('click', (e) => {
    if (e.target === btn) return;
    misses++;
    missCountEl.textContent = misses;
    showTaunt(e.clientX, e.clientY);
});

btn.addEventListener('click', () => {
    misses++;
    missCountEl.textContent = misses;
    showTaunt(
        btn.getBoundingClientRect().left + btnW / 2,
        btn.getBoundingClientRect().top,
        "HOW?!"
    );
    const pos = randomPos();
    setPos(pos.x, pos.y);
});

function showTaunt(x, y, override) {
    const t = document.createElement('div');
    t.className = 'taunt';
    t.textContent = override || taunts[Math.floor(Math.random() * taunts.length)];
    t.style.left = (x - 40) + 'px';
    t.style.top = (y - 20) + 'px';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1400);
}

// ---- Background Star Particles ----
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let W, H, stars = [];

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initPosition();
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
            twinkleSpeed: Math.random() * 0.01 + 0.003,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }
}

let t = 0;
function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.016;
    for (const s of stars) {
        const alpha = s.opacity + Math.sin(t * s.twinkleSpeed * 60 + s.twinkleOffset) * 0.14;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 197, 255, ${Math.max(0, alpha)})`;
        ctx.fill();
        s.y -= s.speed;
        if (s.y < -2) {
            s.y = H + 2;
            s.x = Math.random() * W;
        }
    }
    requestAnimationFrame(draw);
}

window.addEventListener('resize', () => {
    resize();
    initStars();
});

// Initial boot
resize();
initStars();
draw();
