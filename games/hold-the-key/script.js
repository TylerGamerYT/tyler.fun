// ---- State ----
let holding = false, startTime = null, interval = null, elapsed = 0;
let personalBest = parseFloat(localStorage.getItem('holdkey_pb') || '0');

// ---- Timer ----
function fmt(s) { 
    return s.toFixed(2); 
}

function startHold() {
    if (holding) return;
    holding = true;
    startTime = Date.now();
    elapsed = 0;
    document.getElementById('timerDisplay').className = 'timer-display holding';
    document.getElementById('keyVisual').classList.add('pressed');
    document.getElementById('keyLabel').textContent = 'HOLDING...';
    document.getElementById('status').textContent = '';
    document.getElementById('status').className = 'status';
    
    interval = setInterval(() => {
        elapsed = (Date.now() - startTime) / 1000;
        document.getElementById('timerDisplay').textContent = fmt(elapsed);
    }, 16);
}

function stopHold() {
    if (!holding) return;
    holding = false;
    clearInterval(interval);
    elapsed = (Date.now() - startTime) / 1000;
    document.getElementById('timerDisplay').textContent = fmt(elapsed);
    document.getElementById('keyVisual').classList.remove('pressed');
    document.getElementById('keyLabel').textContent = 'HOLD SPACEBAR';

    const isBest = elapsed > personalBest;
    if (isBest) {
        personalBest = elapsed;
        localStorage.setItem('holdkey_pb', personalBest);
        document.getElementById('timerDisplay').className = 'timer-display new-best';
        document.getElementById('status').textContent = '🎉 New personal best!';
        document.getElementById('status').className = 'status good';
        showModal(elapsed);
    } else {
        document.getElementById('timerDisplay').className = 'timer-display';
        document.getElementById('status').textContent = `Held for ${fmt(elapsed)}s. Personal best: ${fmt(personalBest)}s`;
        document.getElementById('status').className = 'status';
    }
}

// ---- Keyboard Controls ----
document.addEventListener('keydown', e => { 
    if (e.code === 'Space' && !e.repeat) { 
        e.preventDefault(); 
        startHold(); 
    } 
});

document.addEventListener('keyup', e => { 
    if (e.code === 'Space') {
        stopHold(); 
    }
});

// ---- Touch Controls (Mobile) ----
document.addEventListener('touchstart', e => { 
    e.preventDefault(); 
    startHold(); 
}, { passive: false });

document.addEventListener('touchend', e => { 
    e.preventDefault(); 
    stopHold();  
}, { passive: false });

// ---- Leaderboard ----
async function loadLeaderboard() {
    try {
        const result = await window.storage.get('holdkey_scores', true);
        const scores = result ? JSON.parse(result.value) : [];
        renderLeaderboard(scores);
    } catch { 
        renderLeaderboard([]); 
    }
}

async function saveScore(name, time) {
    let scores = [];
    try {
        const result = await window.storage.get('holdkey_scores', true);
        scores = result ? JSON.parse(result.value) : [];
    } catch {}
    
    scores.push({ name: name.trim().slice(0, 20) || 'Anonymous', time });
    scores.sort((a, b) => b.time - a.time);
    scores = scores.slice(0, 10);
    
    try { 
        await window.storage.set('holdkey_scores', JSON.stringify(scores), true); 
    } catch {}
    
    renderLeaderboard(scores);
}

function renderLeaderboard(scores) {
    const el = document.getElementById('lbRows');
    if (!scores.length) { 
        el.innerHTML = '<div class="lb-empty">No scores yet. Be the first!</div>'; 
        return; 
    }
    const medals = ['gold', 'silver', 'bronze'];
    el.innerHTML = scores.map((s, i) => `
        <div class="lb-row">
            <span class="lb-rank ${medals[i] || ''}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
            <span class="lb-name">${s.name}</span>
            <span class="lb-time">${fmt(s.time)}s</span>
        </div>
    `).join('');
}

// ---- Modal ----
function showModal(time) {
    document.getElementById('modalTitle').textContent = `${fmt(time)}s — nice!`;
    document.getElementById('modalSub').textContent = 'Enter your name for the leaderboard';
    document.getElementById('nameInput').value = localStorage.getItem('holdkey_lastname') || '';
    document.getElementById('modalBg').classList.add('show');
    setTimeout(() => document.getElementById('nameInput').focus(), 100);
}

document.getElementById('modalSubmit').addEventListener('click', submitScore);
document.getElementById('nameInput').addEventListener('keydown', e => { 
    if (e.key === 'Enter') submitScore(); 
});

function submitScore() {
    const name = document.getElementById('nameInput').value.trim() || 'Anonymous';
    localStorage.setItem('holdkey_lastname', name);
    document.getElementById('modalBg').classList.remove('show');
    saveScore(name, personalBest);
}

loadLeaderboard();

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
