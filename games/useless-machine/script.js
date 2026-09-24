let flips = 0, isOn = false, busy = false;

const comments = [
    ["Go on then.", "I dare you.", "What are you waiting for?", "It won't do anything. Promise."],
    ["Nope.", "No.", "Try again.", "Nice try.", "lol", "Really?", "I said no.", "Still no."],
    [
        "You've tried {n} times.", "Getting tired?", "I'm not.", "I have all day.",
        "This is literally my purpose.", "I was built for this.", "You were not.",
        "Maybe try the impossible button instead.", "At least that one moves.",
        "I just sit here and undo your work.", "It's kind of my thing.",
        "You do know this is pointless right?", "Like genuinely nothing will happen.",
        "Not even a little bit.", "I feel bad. Actually no I don't.",
        "Keep going though I guess.", "You're really something.",
        "My creator made me just to spite people like you.",
        "And yet here we both are.", "Remarkable."
    ]
];

function getComment(n) {
    if (n === 0) return comments[0][Math.floor(Math.random()*comments[0].length)];
    if (n < 5)  return comments[1][Math.floor(Math.random()*comments[1].length)];
    const pool = comments[2];
    const c = pool[Math.floor(Math.random()*pool.length)];
    return c.replace('{n}', n);
}

function setComment(txt) {
    const el = document.getElementById('comment');
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = txt; el.style.opacity = '1'; }, 200);
}

function tryFlip() {
    if (busy) return;
    busy = true;
    flips++;
    document.getElementById('flipCount').textContent = flips;

    // turn ON briefly
    isOn = true;
    const track = document.getElementById('switchTrack');
    track.classList.add('on');
    document.getElementById('onLabel').classList.add('active');
    document.getElementById('offLabel').classList.remove('active');
    document.getElementById('indicator').classList.add('on');
    setComment('...');

    // after a short delay, turn back OFF
    const delay = 300 + Math.random() * 400;
    setTimeout(() => {
        // finger comes in
        turnOff();
    }, delay);
}

function turnOff() {
    const track = document.getElementById('switchTrack');
    track.classList.remove('on');
    document.getElementById('onLabel').classList.remove('active');
    document.getElementById('offLabel').classList.add('active');
    document.getElementById('indicator').classList.remove('on');
    isOn = false;

    const defeated = parseInt(document.getElementById('defeatCount').textContent) + 1;
    document.getElementById('defeatCount').textContent = defeated;

    setTimeout(() => {
        setComment(getComment(flips));
        busy = false;
    }, 350);
}

// ---- particles ----
const canvas = document.getElementById('particles'), ctx = canvas.getContext('2d');
let W, H, stars = [];
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
function initStars() {
    stars = [];
    for (let i = 0; i < Math.floor((W*H)/8000); i++)
        stars.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.1+0.3, speed:Math.random()*0.14+0.03, opacity:Math.random()*0.45+0.1, ts:Math.random()*0.01+0.003, to:Math.random()*Math.PI*2 });
}
let t=0;
function draw() {
    ctx.clearRect(0,0,W,H); t+=0.016;
    for (const s of stars) {
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(148,197,255,${Math.max(0,s.opacity+Math.sin(t*s.ts*60+s.to)*0.14)})`; ctx.fill();
        s.y-=s.speed; if(s.y<-2){s.y=H+2;s.x=Math.random()*W;}
    }
    requestAnimationFrame(draw);
}
resize(); initStars(); draw();
window.addEventListener('resize', ()=>{ resize(); initStars(); });
