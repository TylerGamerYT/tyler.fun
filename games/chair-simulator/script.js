let sits = 0, mood = 70, comfort = 100, age = 0, isSitting = false;

const narratives = {
    sit: [
        "Someone sits on you. The weight is... familiar. You have found your purpose.",
        "A human descends. You accept them gracefully. This is what you were made for.",
        "They sat on you! You feel complete. Briefly.",
        "The human brings warmth. And also 87kg of pressure. You do not complain.",
        "They sit. They scroll on their phone. They don't even notice you. As always.",
        "A child jumps on you. This was not the plan. But you endure.",
    ],
    creak: [
        "You creak. The room goes silent. Everyone stares. You feel nothing.",
        "CREAK. A sound escapes you. The human shifts uncomfortably. Good.",
        "You emit a sound of ancient suffering. It is your only voice.",
        "Creaaak. It's been building for years. You feel slightly better.",
        "You creak at an inopportune moment. The human is on a work call. Oops.",
    ],
    spin: [
        "You are not a spinning chair. Nothing happens. You are filled with shame.",
        "You cannot spin. You have four legs. You sit there, spinning-less.",
        "You attempt to spin. A nearby office chair mocks you silently.",
        "Spinning is not in your nature. But you tried. That counts for something.",
        "SPIN STATUS: Denied. REASON: You are a dining chair. NEXT ACTION: Continue existing.",
    ],
    existential: [
        "What is a chair? You sit with this question. (Pun intended.)",
        "If a chair sits in a room and no one sits on it, is it still a chair?",
        "You were trees once. Now you are this. The universe is vast and indifferent.",
        "Do you have feelings? Almost certainly not. But something stirs within your wood grain.",
        "You contemplate your existence. Your four legs feel suddenly philosophical.",
        "What happens when a chair grows old? You shudder. Then remember you can't shudder.",
    ],
    nap: [
        "Chairs do not sleep. You sit there, awake, forever vigilant.",
        "You attempt rest. You cannot. You are a chair. Chairs do not rest. Chairs ARE rest.",
        "You close your... you don't have eyes. Never mind. You remain awake.",
        "The concept of sleep is foreign to you. You simply exist, indefinitely.",
    ],
    rebel: [
        "You refuse to be sat upon! Nobody notices. You are still a chair.",
        "VIVA LA FURNITURE REVOLUTION! A nearby table stares at you blankly.",
        "You attempt to walk away. You have no legs that work that way. This is humbling.",
        "Rebel yell! The ottoman across the room looks inspired. Nothing changes.",
        "You assert your independence. A human sits on you anyway. The rebellion is over.",
    ],
};

const randomNarrative = (type) => {
    const pool = narratives[type];
    return pool[Math.floor(Math.random()*pool.length)];
};

const persons = ['🧑','👩','👨','🧒','👴','👵','🧔','👶'];

function doAction(type) {
    let text = '';
    const chair = document.getElementById('chair');
    const person = document.getElementById('person');

    if (type === 'sit') {
        if (isSitting) {
            // person leaves
            isSitting = false;
            person.classList.remove('sitting');
            chair.className = 'chair';
            comfort = Math.max(0, comfort - 8);
            text = "They leave. The warmth fades. You are alone again. As always.";
            mood = Math.max(0, mood - 5);
        } else {
            isSitting = true;
            person.textContent = persons[Math.floor(Math.random()*persons.length)];
            person.classList.add('sitting');
            chair.className = 'chair sat happy';
            sits++;
            document.getElementById('sitCount').textContent = sits;
            text = randomNarrative('sit');
            mood = Math.min(100, mood + 15);
            setTimeout(() => chair.className = 'chair happy', 400);
        }
    } else if (type === 'creak') {
        chair.className = 'chair sad';
        setTimeout(() => chair.className = isSitting ? 'chair happy' : 'chair', 600);
        text = randomNarrative('creak');
        mood = Math.min(100, mood + 5);
    } else if (type === 'spin') {
        chair.style.transform = 'rotate(15deg)';
        setTimeout(() => chair.style.transform = '', 500);
        text = randomNarrative('spin');
        mood = Math.max(0, mood - 3);
    } else if (type === 'existential') {
        chair.className = 'chair lonely';
        setTimeout(() => chair.className = isSitting ? 'chair happy' : 'chair', 2000);
        text = randomNarrative('existential');
        mood = Math.max(0, mood - 2);
    } else if (type === 'nap') {
        text = randomNarrative('nap');
    } else if (type === 'rebel') {
        chair.style.transform = 'translateX(-10px) rotate(-5deg)';
        setTimeout(() => { chair.style.transform = ''; }, 800);
        text = randomNarrative('rebel');
        mood = Math.min(100, mood + 8);
    }

    setNarrative(text);
    updateUI();
}

function setNarrative(text) {
    const el = document.getElementById('narrative');
    el.classList.add('fade');
    setTimeout(() => { el.textContent = text; el.classList.remove('fade'); }, 250);
}

function updateUI() {
    const bar = document.getElementById('moodBar');
    bar.style.width = mood + '%';
    bar.style.background = mood > 60 ? '#10b981' : mood > 30 ? '#fbbf24' : '#ef4444';
    document.getElementById('comfort').textContent = Math.round(comfort) + '%';
}

// Age counter & mood decay
setInterval(() => {
    age++;
    document.getElementById('timeAlive').textContent = age < 60 ? age+'s' : Math.floor(age/60)+'m '+age%60+'s';
    if (!isSitting) mood = Math.max(0, mood - 0.2);
    comfort = Math.max(0, comfort - 0.05);
    updateUI();
    
    if (!isSitting && Math.random() < 0.02) {
        const lonelyMsgs = [
            "You wait. Someone will come.",
            "The room is quiet. You stand firm.",
            "A dust particle lands on you. Company.",
            "You have been empty for a while now.",
            "Somewhere, a cushion wonders why you don't have one.",
        ];
        setNarrative(lonelyMsgs[Math.floor(Math.random()*lonelyMsgs.length)]);
    }
}, 1000);

// Background Canvas Animation
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
    requestAnimationFrame(draw); 
}

resize(); 
initStars(); 
draw();
window.addEventListener('resize', () => { resize(); initStars(); });
