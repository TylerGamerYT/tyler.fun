let cookies = 0;
let cps = 0; // cookies per second from upgrades
let clickValue = 1;
let curseCount = 0;

const upgrades = [
    { id:'grandma', name:'Suspicious Grandma', emoji:'👵', desc:'+1 cookie/sec. She watches you.', cost:15, cps:1, curse:'The grandma emoji now appears randomly on screen.', owned:false, effect:()=>startGrandma() },
    { id:'flip', name:'Upside Down Mode', emoji:'🙃', desc:'+3 cookies/click. At a price.', cost:50, click:2, curse:'The entire page is now upside down.', owned:false, effect:()=>flipPage() },
    { id:'auto', name:'Auto-Clicker (Broken)', emoji:'🤖', desc:'+5 cookies/sec. It has opinions.', cost:120, cps:5, curse:'Random clicks are added. You can\'t control them.', owned:false, effect:()=>startAutoClicker() },
    { id:'disco', name:'Disco Mode', emoji:'🪩', desc:'+10 cookies/sec. Fabulous.', cost:300, cps:10, curse:'The background now cycles through colours. Forever.', owned:false, effect:()=>startDisco() },
    { id:'zoom', name:'Zoom Enhancer', emoji:'🔍', desc:'+20 cookies/click. Everything is BIG now.', cost:500, click:19, curse:'The cookie button is now enormous.', owned:false, effect:()=>bigCookie() },
    { id:'mirror', name:'Mirror Universe', emoji:'🪞', desc:'+25 cookies/sec. Parallel gains.', cost:1000, cps:25, curse:'All text is now mirrored horizontally.', owned:false, effect:()=>mirrorText() },
    { id:'ghost', name:'Ghost Upgrades', emoji:'👻', desc:'+50 cookies/sec. Spooky.', cost:2500, cps:50, curse:'Buttons randomly become invisible until you hover.', owned:false, effect:()=>ghostMode() },
    { id:'chaos', name:'Full Chaos Mode', emoji:'💀', desc:'+100 cookies/sec. What could go wrong.', cost:5000, cps:100, curse:'Everything. Just... everything.', owned:false, effect:()=>fullChaos() },
];

// Render upgrades list
function renderUpgrades() {
    const grid = document.getElementById('upgradesGrid');
    grid.innerHTML = '';
    upgrades.forEach(u => {
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn' + (u.owned ? ' owned' : '');
        btn.disabled = u.owned || cookies < u.cost;
        btn.innerHTML = `<span class="upg-emoji">${u.emoji}</span><div class="upg-info"><div class="upg-name">${u.name}</div><div class="upg-desc">${u.desc}</div></div><span class="upg-cost ${u.owned?'free':''}">${u.owned ? 'OWNED' : u.cost + ' 🍪'}</span>`;
        btn.onclick = () => buyUpgrade(u);
        grid.appendChild(btn);
    });
}

function buyUpgrade(u) {
    if (u.owned || cookies < u.cost) return;
    cookies -= u.cost;
    u.owned = true;
    if (u.cps)   cps += u.cps;
    if (u.click) clickValue += u.click;
    curseCount++;
    u.effect();
    addCurseLog(u.curse);
    updateDisplay();
    renderUpgrades();
}

function clickCookie(e) {
    cookies += clickValue;
    updateDisplay();
    const f = document.createElement('div');
    f.className = 'float';
    f.textContent = '+' + clickValue;
    f.style.left = (e.clientX - 15) + 'px';
    f.style.top  = (e.clientY - 20) + 'px';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 900);
}

function updateDisplay() {
    document.getElementById('cookieCount').textContent = Math.floor(cookies).toLocaleString();
    renderUpgrades();
}

// CPS loop
setInterval(() => {
    if (cps > 0) { cookies += cps / 20; updateDisplay(); }
}, 50);

function addCurseLog(msg) {
    const entries = document.getElementById('curseEntries');
    const div = document.createElement('div');
    div.className = 'curse-entry new';
    div.textContent = '⚠️ ' + msg;
    entries.prepend(div);
    setTimeout(() => div.classList.remove('new'), 2000);
    if (entries.children.length > 10) entries.removeChild(entries.lastChild);
}

// CURSES
let grandmaInterval = null;
function startGrandma() {
    grandmaInterval = setInterval(() => {
        const g = document.createElement('div');
        g.textContent = '👵';
        g.style.cssText = `position:fixed;font-size:2rem;left:${Math.random()*90}vw;top:${Math.random()*90}vh;z-index:50;pointer-events:none;animation:floatUp 2s ease forwards;`;
        document.body.appendChild(g);
        setTimeout(() => g.remove(), 2000);
    }, 3000);
}

function flipPage() {
    document.body.style.transform = document.body.style.transform === 'rotate(180deg)' ? '' : 'rotate(180deg)';
}

let autoInterval = null;
function startAutoClicker() {
    autoInterval = setInterval(() => {
        cookies += Math.random() < 0.5 ? 1 : -1;
        updateDisplay();
    }, 800);
}

let discoInterval = null;
const discoColors = ['#0a0020','#001020','#100a00','#0a1000','#1a0010','#020617'];
let discoIdx = 0;
function startDisco() {
    discoInterval = setInterval(() => {
        document.body.style.background = discoColors[discoIdx % discoColors.length];
        discoIdx++;
    }, 600);
}

function bigCookie() {
    const btn = document.getElementById('cookieBtn');
    btn.style.width = '220px'; btn.style.height = '220px'; btn.style.fontSize = '7rem';
}

function mirrorText() {
    document.querySelector('.container').style.transform = 'scaleX(-1)';
    document.querySelector('.back-home').style.transform = 'scaleX(-1)';
}

let ghostInterval = null;
function ghostMode() {
    ghostInterval = setInterval(() => {
        const btns = document.querySelectorAll('.upgrade-btn');
        btns.forEach(b => { b.style.opacity = Math.random() < 0.3 ? '0' : '1'; });
        setTimeout(() => btns.forEach(b => b.style.opacity = '1'), 600);
    }, 2000);
}

function fullChaos() {
    startGrandma();
    startDisco();
    document.body.style.animation = 'none';
    setInterval(() => {
        document.querySelector('.container').style.transform = `rotate(${(Math.random()-0.5)*6}deg) scaleX(${Math.random()<0.5?-1:1})`;
    }, 1500);
    setInterval(() => {
        document.getElementById('cookieBtn').style.fontSize = (3 + Math.random()*5) + 'rem';
    }, 800);
}

renderUpgrades();

// Particles
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
    for(const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 197, 255, ${Math.max(0, s.opacity + Math.sin(t * s.ts * 60 + s.to) * 0.14)})`;
        ctx.fill();
        s.y -= s.speed;
        if(s.y < -2) {
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
