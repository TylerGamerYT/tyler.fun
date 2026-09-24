const ROASTS = [
    "Seriously?", "Too slow!", "lmaooo", "You missed me!", "Try harder.",
    "I'm literally right here.", "skill issue.", "My grandma's faster.",
    "Are you even trying?", "I saw that coming.", "Pathetic.",
    "You blinked didn't you.", "Touch grass first, then try again.",
    "I'll be here all day.", "Miss me miss me now you gotta kiss me.",
    "I'm not even moving fast.", "Your reaction time is criminal.",
    "Bro clicked the wrong hole again.", "I felt the wind from that.",
];

const GRID = 9;
const GAME_TIME = 30;
let score = 0, misses = 0, timeLeft = GAME_TIME;
let activeMoles = new Set();
let moleTimeouts = {}, moleIntervals = {};
let gameInterval = null, moleSpawnInterval = null;
let running = false;

function buildGrid() {
    const grid = document.getElementById('moleGrid');
    grid.innerHTML = '';
    for (let i = 0; i < GRID; i++) {
        const hole = document.createElement('div');
        hole.className = 'hole';
        hole.dataset.idx = i;
        hole.innerHTML = `<div class="mole">🐭</div><div class="hit-flash"></div>`;
        hole.onclick = () => whack(i);
        grid.appendChild(hole);
    }
}

function startGame() {
    score = 0; misses = 0; timeLeft = GAME_TIME; running = true;
    activeMoles.clear();
    Object.values(moleTimeouts).forEach(clearTimeout);
    Object.values(moleIntervals).forEach(clearInterval);
    clearInterval(gameInterval); clearInterval(moleSpawnInterval);
    document.getElementById('gameover').classList.remove('show');
    document.getElementById('startOverlay').style.display = 'none';
    document.getElementById('roastDisplay').textContent = '';
    updateHud();
    buildGrid();

    // game timer
    gameInterval = setInterval(() => {
        timeLeft = Math.max(0, timeLeft - 0.1);
        updateHud();
        if (timeLeft <= 0) endGame();
    }, 100);

    // mole spawner — gets faster over time
    spawnMoles();
    moleSpawnInterval = setInterval(spawnMoles, 1200);
    setTimeout(() => { clearInterval(moleSpawnInterval); moleSpawnInterval = setInterval(spawnMoles, 800); }, 10000);
    setTimeout(() => { clearInterval(moleSpawnInterval); moleSpawnInterval = setInterval(spawnMoles, 550); }, 20000);
}

function spawnMoles() {
    if (!running) return;
    // pick a random inactive hole
    const inactive = [];
    for (let i = 0; i < GRID; i++) { if (!activeMoles.has(i)) inactive.push(i); }
    if (!inactive.length) return;
    const idx = inactive[Math.floor(Math.random() * inactive.length)];
    showMole(idx);
}

function showMole(idx) {
    if (activeMoles.has(idx) || !running) return;
    activeMoles.add(idx);
    const hole = document.querySelector(`.hole[data-idx="${idx}"]`);
    if (!hole) return;
    hole.classList.add('active');

    const stayTime = Math.max(600, 1400 - (GAME_TIME - timeLeft) * 20);
    moleTimeouts[idx] = setTimeout(() => {
        if (activeMoles.has(idx)) {
            hideMole(idx, true); // missed
        }
    }, stayTime);
}

function hideMole(idx, missed) {
    activeMoles.delete(idx);
    const hole = document.querySelector(`.hole[data-idx="${idx}"]`);
    if (!hole) return;
    hole.classList.remove('active');
    if (missed) {
        misses++;
        updateHud();
        showRoast();
    }
}

function whack(idx) {
    if (!running || !activeMoles.has(idx)) return;
    clearTimeout(moleTimeouts[idx]);
    score += 10;
    updateHud();

    const hole = document.querySelector(`.hole[data-idx="${idx}"]`);
    hole.classList.add('whacked', 'hit');
    setTimeout(() => { hole.classList.remove('whacked', 'hit', 'active'); }, 300);

    // score pop
    const rect = hole.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'score-pop';
    pop.textContent = '+10';
    pop.style.left = (rect.left + rect.width/2 - 20) + 'px';
    pop.style.top  = (rect.top - 10) + 'px';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 700);

    activeMoles.delete(idx);
}

function showRoast() {
    const el = document.getElementById('roastDisplay');
    el.style.opacity = '0';
    setTimeout(() => {
        el.textContent = ROASTS[Math.floor(Math.random()*ROASTS.length)];
        el.style.opacity = '1';
    }, 150);
    setTimeout(() => { el.style.opacity = '0'; }, 1500);
}

function updateHud() {
    document.getElementById('scoreVal').textContent = score;
    document.getElementById('missVal').textContent = misses;
    document.getElementById('timeVal').textContent = Math.ceil(timeLeft);
    const pct = (timeLeft / GAME_TIME) * 100;
    const bar = document.getElementById('timerBar');
    bar.style.width = pct + '%';
    bar.className = 'timer-bar' + (pct < 25 ? ' danger' : pct < 50 ? ' warn' : '');
}

function endGame() {
    running = false;
    clearInterval(gameInterval); clearInterval(moleSpawnInterval);
    Object.values(moleTimeouts).forEach(clearTimeout);
    const title = score < 50 ? 'The moles won.' : score < 150 ? 'Not bad!' : score < 300 ? 'Solid!' : 'Mole destroyer.';
    document.getElementById('goTitle').textContent = title;
    document.getElementById('goScore').textContent = score;
    document.getElementById('goMissed').textContent = misses;
    setTimeout(() => document.getElementById('gameover').classList.add('show'), 400);
}

/* Background Particle System */
const canvas = document.getElementById('particles'), ctx = canvas.getContext('2d');
let W, H, stars = [];
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
function initStars() { 
    stars = []; 
    for(let i=0;i<Math.floor((W*H)/8000);i++) 
        stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.1+0.3,speed:Math.random()*0.14+0.03,opacity:Math.random()*0.45+0.1,ts:Math.random()*0.01+0.003,to:Math.random()*Math.PI*2}); 
}
let t=0;
function draw() { 
    ctx.clearRect(0,0,W,H); t+=0.016; 
    for(const s of stars){
        ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(148,197,255,${Math.max(0,s.opacity+Math.sin(t*s.ts*60+s.to)*0.14)})`;
        ctx.fill();s.y-=s.speed;if(s.y<-2){s.y=H+2;s.x=Math.random()*W;}
    } 
    requestAnimationFrame(draw); 
}
resize(); initStars(); draw();
window.addEventListener('resize',()=>{resize();initStars();});
