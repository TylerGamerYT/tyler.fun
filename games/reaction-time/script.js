// ---- Game Configuration and State ----
const ROUNDS = 5;
let state = 'idle'; // idle | waiting | ready | done
let flashTimeout = null;
let startTime = null;
let times = [];
let round = 0;

// ---- DOM Elements ----
const bigTimeEl = document.getElementById('bigTime');
const clickZone = document.getElementById('clickZone');
const zoneLabel = document.getElementById('zoneLabel');
const statusEl = document.getElementById('status');
const resultRowsEl = document.getElementById('resultRows');

// ---- Event Handling ----
clickZone.addEventListener('click', handleClick);

function handleClick() {
    if (state === 'idle' || state === 'done') {
        startRound();
        return;
    }
    
    if (state === 'waiting') {
        // Clicked too early
        clearTimeout(flashTimeout);
        setStatus('Too early! Wait for green.', 'bad');
        setState('idle');
        bigTimeEl.textContent = '—';
        setTimeout(startRound, 1200);
        return;
    }
    
    if (state === 'ready') {
        const ms = Date.now() - startTime;
        times.push(ms);
        round++;
        bigTimeEl.textContent = ms;
        setStatus(getRating(ms), 'good');
        setState('idle');
        renderResults();
        
        if (round >= ROUNDS) {
            finishGame();
            return;
        }
        setTimeout(startRound, 1000);
    }
}

// ---- Game Logic Functions ----
function startRound() {
    setState('waiting');
    bigTimeEl.textContent = '—';
    setStatus('Wait for green...', '');
    
    const delay = 1500 + Math.random() * 3000;
    flashTimeout = setTimeout(() => {
        setState('ready');
        startTime = Date.now();
        setStatus('CLICK NOW!', 'good');
    }, delay);
}

function setState(s) {
    state = s;
    clickZone.className = 'click-zone' + (s === 'waiting' ? ' waiting' : s === 'ready' ? ' go' : '');
    
    if (s === 'idle') {
        zoneLabel.textContent = round === 0 ? 'Click to start' : 'Click to continue';
    } else if (s === 'waiting') {
        zoneLabel.textContent = 'Wait...';
    } else if (s === 'ready') {
        zoneLabel.textContent = 'CLICK!';
    } else if (s === 'done') {
        zoneLabel.textContent = 'Play again';
    }
}

function finishGame() {
    setState('done');
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    setStatus(`Average: ${avg}ms — ${getRating(avg)}`, 'good');
    renderResults();
}

function getRating(ms) {
    if (ms < 150) return '⚡ Superhuman!';
    if (ms < 200) return '🔥 Incredible!';
    if (ms < 250) return '👏 Great reflexes!';
    if (ms < 300) return '😎 Above average';
    if (ms < 400) return '🙂 Not bad';
    if (ms < 500) return '😐 A little slow';
    return '🐢 Were you asleep?';
}

function renderResults() {
    if (!times.length) { 
        resultRowsEl.innerHTML = '<div class="result-empty">No results yet</div>'; 
        return; 
    }
    
    const best = Math.min(...times);
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    
    let html = times.map((t, i) => `
        <div class="result-row">
            <span class="result-label">Round ${i + 1}</span>
            <span class="result-val ${t === best && times.length > 1 ? 'gold' : ''}">${t}ms${t === best && times.length > 1 ? ' 🏆' : ''}</span>
        </div>
    `).join('');

    if (times.length > 1) {
        html += `
            <div class="result-row">
                <span class="result-label">Average</span>
                <span class="result-val">${avg}ms</span>
            </div>
        `;
    }
    
    resultRowsEl.innerHTML = html;
}

function setStatus(msg, cls) {
    statusEl.textContent = msg; 
    statusEl.className = 'status' + (cls ? ' ' + cls : '');
}

// ---- Background Star Particles ----
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let W, H, stars = [];

function resizeParticles() { 
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
function drawParticles() {
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
    requestAnimationFrame(drawParticles);
}

// ---- Initialization ----
resizeParticles(); 
initStars(); 
drawParticles();

window.addEventListener('resize', () => { 
    resizeParticles(); 
    initStars(); 
});
