const GAME_TIME = 30;
let hits = 0, misses = 0, running = false, timeLeft = GAME_TIME;
let targetEl = null, targetTimer = null, gameInterval = null;
let hitTimes = [], lastSpawn = 0;
const MIN_R = 20, MAX_R = 45;

function startGame() {
    hits = 0; misses = 0; timeLeft = GAME_TIME; hitTimes = [];
    document.getElementById('startOverlay').classList.remove('show');
    document.getElementById('endOverlay').classList.remove('show');
    updateHud();
    running = true;
    spawnTarget();
    gameInterval = setInterval(() => {
        timeLeft = Math.max(0, timeLeft - 0.1);
        document.getElementById('timeHud').textContent = Math.ceil(timeLeft);
        const pct = (timeLeft / GAME_TIME) * 100;
        const bar = document.getElementById('timerBar');
        bar.style.width = pct + '%';
        bar.style.background = pct < 25 ? '#ef4444' : pct < 50 ? '#fbbf24' : '#3b82f6';
        if (timeLeft <= 0) endGame();
    }, 100);
}

function spawnTarget() {
    if (targetEl) targetEl.remove();
    const r = MIN_R + Math.random() * (MAX_R - MIN_R);
    const x = r + Math.random() * (window.innerWidth - r * 2);
    const y = r + 60 + Math.random() * (window.innerHeight - r * 2 - 80);
    targetEl = document.createElement('div');
    targetEl.className = 'target';
    targetEl.style.cssText = `width:${r*2}px;height:${r*2}px;left:${x-r}px;top:${y-r}px;`;
    targetEl.onclick = (e) => { e.stopPropagation(); hitTarget(); };
    document.body.appendChild(targetEl);
    lastSpawn = Date.now();
    // auto miss after 2.5s
    targetTimer = setTimeout(() => { if (running) { misses++; updateHud(); spawnTarget(); } }, 2500);
}

function hitTarget() {
    if (!running) return;
    hits++;
    const t = Date.now() - lastSpawn;
    hitTimes.push(t);
    clearTimeout(targetTimer);
    flashHit();
    updateHud();
    spawnTarget();
}

function flashHit() {
    const f = document.getElementById('hitFlash');
    f.classList.add('show');
    setTimeout(() => f.classList.remove('show'), 100);
}

document.addEventListener('click', (e) => {
    if (!running || e.target.classList.contains('target')) return;
    misses++;
    updateHud();
    const dot = document.createElement('div');
    dot.className = 'miss-dot';
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 500);
});

function updateHud() {
    document.getElementById('scoreHud').textContent = hits;
    document.getElementById('missHud').textContent = misses;
    const total = hits + misses;
    document.getElementById('accHud').textContent = total ? Math.round((hits/total)*100)+'%' : '—';
}

function endGame() {
    running = false;
    clearInterval(gameInterval);
    clearTimeout(targetTimer);
    if (targetEl) { targetEl.remove(); targetEl = null; }
    const total = hits + misses;
    const acc = total ? Math.round((hits/total)*100) : 0;
    const avg = hitTimes.length ? Math.round(hitTimes.reduce((a,b)=>a+b,0)/hitTimes.length) : 0;
    const title = hits < 10 ? 'Keep practicing.' : hits < 25 ? 'Not bad!' : hits < 40 ? 'Nice aim!' : 'Cracked.';
    document.getElementById('endTitle').textContent = title;
    document.getElementById('endHits').textContent = hits;
    document.getElementById('endMisses').textContent = misses;
    document.getElementById('endAcc').textContent = acc + '%';
    document.getElementById('endAvg').textContent = avg + 'ms';
    document.getElementById('endOverlay').classList.add('show');
}
