const segments = [
    { label:'Nothing', emoji:'😐', color:'#1e3a8a', title:'Absolutely nothing happened.', desc:'You spun the wheel for this. I hope you\'re proud.', action: null },
    { label:'Confetti!', emoji:'🎉', color:'#7c3aed', title:'Confetti!!', desc:'You earned confetti. No cookies, no prizes. Just confetti.', action: ()=>launchConfetti() },
    { label:'Roasted', emoji:'🔥', color:'#dc2626', title:'You got roasted.', desc:roastMe(), action: null },
    { label:'Spin Again', emoji:'🔄', color:'#0891b2', title:'Spin again! (Lucky you)', desc:'The wheel demands another spin.', action: ()=>setTimeout(spin,800) },
    { label:'Screen Flip', emoji:'🙃', color:'#059669', title:'Enjoy your new perspective.', desc:'The page is upside down now. You did this.', action: ()=>flipScreen() },
    { label:'+100 Points', emoji:'💯', color:'#d97706', title:'+100 Points!', desc:'Points for what? Nobody knows. But you have them.', action: ()=>addPoints(100) },
    { label:'LOSE Points', emoji:'💀', color:'#991b1b', title:'-50 Points. Ouch.', desc:'The wheel giveth and the wheel taketh away.', action: ()=>addPoints(-50) },
    { label:'Big Mode', emoji:'🔍', color:'#4338ca', title:'Everything is BIG now.', desc:'The wheel has spoken. Embrace the bigness.', action: ()=>bigMode() },
    { label:'Rick Roll', emoji:'🎵', color:'#065f46', title:'Never gonna give you up...', desc:'You just got Rick Roll\'d. Classic.', action: ()=>rickRoll() },
    { label:'Grandma', emoji:'👵', color:'#6d28d9', title:'The grandma has appeared.', desc:'She watches. She knows.', action: ()=>grandmaAppear() },
    { label:'Ghost Mode', emoji:'👻', color:'#374151', title:'You can\'t see the wheel anymore.', desc:'The wheel is shy now.', action: ()=>ghostWheel() },
    { label:'Jackpot!', emoji:'🏆', color:'#b45309', title:'JACKPOT! ...just kidding.', desc:'There is no jackpot. There never was.', action: ()=>launchConfetti() },
];

function roastMe() { 
    return ['You spin wheels instead of getting a hobby.','The wheel is embarrassed for you.','Even the wheel didn\'t want to stop here.'][Math.floor(Math.random()*3)]; 
}

let angle = 0, spinning = false, spinCount = 0, points = 0;
const wCanvas = document.getElementById('wheel');
const wCtx = wCanvas.getContext('2d');
const R = 148, CX = 150, CY = 150;
const ARC = (Math.PI * 2) / segments.length;

function drawWheel(rot) {
    wCtx.clearRect(0,0,300,300);
    segments.forEach((seg, i) => {
        const start = rot + i * ARC - Math.PI/2;
        const end   = start + ARC;
        wCtx.beginPath();
        wCtx.moveTo(CX, CY);
        wCtx.arc(CX, CY, R, start, end);
        wCtx.closePath();
        wCtx.fillStyle = seg.color;
        wCtx.fill();
        wCtx.strokeStyle = 'rgba(0,0,0,0.3)';
        wCtx.lineWidth = 2;
        wCtx.stroke();

        // label
        wCtx.save();
        wCtx.translate(CX, CY);
        wCtx.rotate(start + ARC/2);
        wCtx.textAlign = 'right';
        wCtx.fillStyle = '#fff';
        wCtx.font = 'bold 11px Inter';
        wCtx.fillText(seg.emoji + ' ' + seg.label, R - 8, 4);
        wCtx.restore();
    });
    // center circle
    wCtx.beginPath(); 
    wCtx.arc(CX, CY, 18, 0, Math.PI*2);
    wCtx.fillStyle = '#020617'; 
    wCtx.fill();
    wCtx.strokeStyle = 'rgba(255,255,255,0.2)'; 
    wCtx.lineWidth = 2; 
    wCtx.stroke();
}

drawWheel(0);

function spin() {
    if (spinning) return;
    spinning = true;
    document.getElementById('spinBtn').disabled = true;
    spinCount++;
    document.getElementById('spinCount').textContent = spinCount;

    const extraSpins = 5 + Math.random() * 5;
    const targetAngle = angle + extraSpins * Math.PI * 2 + Math.random() * Math.PI * 2;
    const duration = 3000 + Math.random() * 1500;
    const start = performance.now();
    const startAngle = angle;

    function animate(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        angle = startAngle + (targetAngle - startAngle) * ease;
        drawWheel(angle);
        if (progress < 1) { requestAnimationFrame(animate); return; }

        // find winning segment
        // pointer is at top (angle = -PI/2 from center)
        // normalize angle to find which segment is at top
        let normalised = ((-angle + Math.PI/2) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
        const segIdx = Math.floor(normalised / ARC) % segments.length;
        const seg = segments[segIdx];

        document.getElementById('resEmoji').textContent = seg.emoji;
        document.getElementById('resTitle').textContent = seg.title;
        document.getElementById('resDesc').textContent = seg.desc;
        if (seg.action) seg.action();

        spinning = false;
        document.getElementById('spinBtn').disabled = false;
    }
    requestAnimationFrame(animate);
}

// effects
function launchConfetti() {
    const colors = ['#60a5fa','#f87171','#fbbf24','#10b981','#a78bfa'];
    for (let i=0;i<80;i++) {
        const p = document.createElement('div');
        p.style.cssText=`position:fixed;width:8px;height:8px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${Math.random()*100}%;top:-10px;border-radius:${Math.random()<.5?'50%':'2px'};animation:cfall ${1+Math.random()*2}s linear forwards;z-index:99;`;
        document.body.appendChild(p);
        setTimeout(()=>p.remove(),3000);
    }
}

let flipped = false;
function flipScreen() {
    flipped = !flipped;
    document.querySelector('.container').style.transform = flipped ? 'rotate(180deg)' : '';
}

let pts = 0;
function addPoints(n) {
    pts += n;
    document.getElementById('resDesc').textContent = `Total points: ${pts}. (Still meaningless.)`;
}

let big = false;
function bigMode() {
    big = !big;
    document.querySelector('.wheel-wrap').style.transform = big ? 'scale(1.3)' : '';
}

function rickRoll() {
    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ','_blank');
}

function grandmaAppear() {
    const g = document.createElement('div');
    g.style.cssText='position:fixed;font-size:8rem;bottom:0;right:20px;z-index:50;animation:grandmaRise 3s ease forwards;pointer-events:none;';
    g.textContent='👵';
    document.body.appendChild(g);
    setTimeout(()=>g.remove(),3000);
}

let ghosted = false;
function ghostWheel() {
    ghosted = !ghosted;
    document.getElementById('wheel').style.opacity = ghosted ? '0' : '1';
    document.getElementById('resDesc').textContent = ghosted ? 'The wheel is invisible. Good luck.' : 'The wheel is back.';
}

// particles
const canvas = document.getElementById('particles'), ctx = canvas.getContext('2d');
let W, H, stars = [];
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
function initStars() { stars = []; for(let i=0;i<Math.floor((W*H)/8000);i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.1+0.3,speed:Math.random()*0.14+0.03,opacity:Math.random()*0.45+0.1,ts:Math.random()*0.01+0.003,to:Math.random()*Math.PI*2}); }
let t=0;
function draw() { 
    ctx.clearRect(0,0,W,H); 
    t+=0.016; 
    for(const s of stars){
        ctx.beginPath();
        ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(148,197,255,${Math.max(0,s.opacity+Math.sin(t*s.ts*60+s.to)*0.14)})`;
        ctx.fill();
        s.y-=s.speed;
        if(s.y<-2){s.y=H+2;s.x=Math.random()*W;}
    } 
    requestAnimationFrame(draw); 
}
resize(); initStars(); draw();
window.addEventListener('resize',()=>{resize();initStars();});
