let clicks = 0, phase = 'normal', holdProgress = 0, holdInterval = null;
let doubleClickFirst = false, doubleClickTimer = null;
let moveTarget = null, moveInterval = null;
let waitUntil = 0;

const challenges = [
    { at: 0,  text: 'Just click. Easy.',             type: 'normal' },
    { at: 5,  text: 'Click it 3 times fast!',         type: 'rapid', count: 3 },
    { at: 10, text: 'Hold the button for 2 seconds.', type: 'hold',  duration: 2000 },
    { at: 15, text: 'Wait 3 seconds before clicking.',type: 'wait',  duration: 3000 },
    { at: 20, text: 'Double-click only!',             type: 'double' },
    { at: 25, text: 'Hold for 3 seconds.',            type: 'hold',  duration: 3000 },
    { at: 30, text: 'The button runs away. Catch it!',type: 'move' },
    { at: 35, text: 'Click 5 times fast!',            type: 'rapid', count: 5 },
    { at: 40, text: 'Wait 5 seconds. Don\'t you dare click early.', type: 'wait', duration: 5000 },
    { at: 45, text: 'Hold for 4 seconds. And it\'s blurry.', type: 'hold', duration: 4000, blur: true },
    { at: 50, text: 'The button is tiny now. Good luck.', type: 'tiny' },
    { at: 60, text: 'ALL CHALLENGES AT ONCE. Chaos mode.', type: 'chaos' },
];

let rapidCount = 0, rapidNeeded = 0;
let currentChallenge = null;

function startGame() {
    clicks = 0; phase = 'normal'; doubleClickFirst = false;
    clearInterval(holdInterval); clearInterval(moveInterval);
    clearTimeout(doubleClickTimer);
    const btn = document.getElementById('theBtn');
    btn.style = '';
    btn.textContent = 'CLICK ME';
    document.getElementById('gameover').classList.remove('show');
    document.getElementById('holdBarWrap').style.display = 'none';
    document.getElementById('holdBar').style.width = '0%';
    updateDisplay();
    applyChallenge();
}

function applyChallenge() {
    const ch = [...challenges].reverse().find(c => clicks >= c.at) || challenges[0];
    currentChallenge = ch;
    document.getElementById('challengeText').textContent = ch.text;
    document.getElementById('challengeText').className = 'challenge-text' + (clicks >= 40 ? ' urgent' : '');
    document.getElementById('status').textContent = '';

    const btn = document.getElementById('theBtn');
    btn.style.filter = ch.blur ? 'blur(4px)' : '';

    // stop any running effects
    clearInterval(moveInterval);

    if (ch.type === 'tiny') {
        btn.style.transform = 'scale(0.35)';
    } else {
        btn.style.transform = '';
    }

    if (ch.type === 'move') {
        startMoveMode();
    }

    if (ch.type === 'rapid') { rapidCount = 0; rapidNeeded = ch.count; }
    if (ch.type === 'wait') {
        waitUntil = Date.now() + ch.duration;
        btn.disabled = true;
        const iv = setInterval(() => {
            const rem = Math.max(0, (waitUntil - Date.now()) / 1000);
            document.getElementById('status').textContent = `Wait ${rem.toFixed(1)}s...`;
            if (rem <= 0) { btn.disabled = false; document.getElementById('status').textContent = 'NOW!'; clearInterval(iv); }
        }, 50);
    }
}

function startMoveMode() {
    const btn = document.getElementById('theBtn');
    moveInterval = setInterval(() => {
        const maxX = Math.min(200, window.innerWidth / 4);
        const maxY = 80;
        const x = (Math.random() - 0.5) * maxX;
        const y = (Math.random() - 0.5) * maxY;
        btn.style.transform = `translate(${x}px, ${y}px)`;
    }, 600);
}

function handleClick() {
    const ch = currentChallenge;
    if (!ch) return;

    if (ch.type === 'wait' && Date.now() < waitUntil) {
        fail('You clicked too early!'); return;
    }

    if (ch.type === 'double') {
        if (!doubleClickFirst) {
            doubleClickFirst = true;
            doubleClickTimer = setTimeout(() => { doubleClickFirst = false; fail('Too slow! Double-click needed.'); }, 600);
            return;
        }
        clearTimeout(doubleClickTimer);
        doubleClickFirst = false;
        succeed(); return;
    }

    if (ch.type === 'hold') {
        // hold handled by mousedown/mouseup
        return;
    }

    if (ch.type === 'rapid') {
        rapidCount++;
        document.getElementById('status').textContent = `${rapidCount}/${rapidNeeded}`;
        if (rapidCount >= rapidNeeded) { succeed(); }
        clearTimeout(doubleClickTimer);
        doubleClickTimer = setTimeout(() => { if (rapidCount < rapidNeeded) fail(`Only got ${rapidCount}/${rapidNeeded}!`); }, 1500);
        return;
    }

    succeed();
}

// hold detection
document.getElementById('theBtn').addEventListener('mousedown', startHold);
document.getElementById('theBtn').addEventListener('touchstart', startHold, { passive: true });
document.getElementById('theBtn').addEventListener('mouseup', endHold);
document.getElementById('theBtn').addEventListener('mouseleave', endHold);
document.getElementById('theBtn').addEventListener('touchend', endHold);

let holdStart = null;
function startHold(e) {
    const ch = currentChallenge;
    if (!ch || ch.type !== 'hold') return;
    holdStart = Date.now();
    document.getElementById('holdBarWrap').style.display = 'block';
    holdInterval = setInterval(() => {
        const elapsed = Date.now() - holdStart;
        const pct = Math.min(100, (elapsed / ch.duration) * 100);
        document.getElementById('holdBar').style.width = pct + '%';
        if (elapsed >= ch.duration) { clearInterval(holdInterval); succeed(); }
    }, 30);
}

function endHold(e) {
    const ch = currentChallenge;
    if (!ch || ch.type !== 'hold') return;
    if (!holdStart) return;
    const elapsed = Date.now() - holdStart;
    holdStart = null;
    clearInterval(holdInterval);
    document.getElementById('holdBarWrap').style.display = 'none';
    document.getElementById('holdBar').style.width = '0%';
    if (elapsed < (ch.duration - 100)) fail(`Held for ${(elapsed/1000).toFixed(1)}s, needed ${ch.duration/1000}s`);
}

function succeed() {
    clicks++;
    clearInterval(moveInterval);
    document.getElementById('theBtn').style.transform = '';
    updateDisplay();
    applyChallenge();
}

function fail(msg) {
    clearInterval(holdInterval); clearInterval(moveInterval);
    document.getElementById('theBtn').style.transform = '';
    const title = clicks < 10 ? 'You failed.' : clicks < 25 ? 'Not bad!' : clicks < 45 ? 'Impressive!' : 'Absolute legend.';
    document.getElementById('goEmoji').textContent = clicks >= 45 ? '🏆' : '💀';
    document.getElementById('goTitle').textContent = title;
    document.getElementById('goClicks').textContent = clicks;
    setTimeout(() => document.getElementById('gameover').classList.add('show'), 300);
}

function updateDisplay() {
    document.getElementById('clickCount').textContent = clicks;
}

startGame();

const canvas = document.getElementById('particles'), ctx = canvas.getContext('2d');
let W, H, stars = [];
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
function initStars() { stars = []; for(let i=0;i<Math.floor((W*H)/8000);i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.1+0.3,speed:Math.random()*0.14+0.03,opacity:Math.random()*0.45+0.1,ts:Math.random()*0.01+0.003,to:Math.random()*Math.PI*2}); }
let t=0;
function draw() { ctx.clearRect(0,0,W,H); t+=0.016; for(const s of stars){ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(148,197,255,${Math.max(0,s.opacity+Math.sin(t*s.ts*60+s.to)*0.14)})`;ctx.fill();s.y-=s.speed;if(s.y<-2){s.y=H+2;s.x=Math.random()*W;}} requestAnimationFrame(draw); }
resize(); initStars(); draw();
window.addEventListener('resize',()=>{resize();initStars();});
