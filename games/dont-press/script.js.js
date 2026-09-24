let presses = 0;

const events = [
    { emoji: '😐', text: 'I said don\'t.', bg: null },
    { emoji: '😑', text: 'You pressed it. Of course you pressed it.', bg: null },
    { emoji: '🙄', text: 'Incredible. Truly. The nerve.', bg: null },
    { emoji: '😤', text: 'Fine. Keep going. See what happens.', bg: null, action: () => shakeScreen() },
    { emoji: '😡', text: 'You want chaos? You\'re getting chaos.', bg: '#1a0a0a', action: () => flashRed() },
    { emoji: '🤯', text: 'THE SCREEN IS TURNING RED AND IT\'S YOUR FAULT.', bg: '#2a0505', action: () => flashRed() },
    { emoji: '🎉', text: 'Wait actually... confetti?? You unlocked confetti somehow.', bg: null, action: () => launchConfetti() },
    { emoji: '😭', text: 'I worked so hard on this website and this is what you do.', bg: null },
    { emoji: '🌀', text: 'Everything is spinning now. Are you happy?', bg: null, action: () => spinPage() },
    { emoji: '😰', text: 'Please. I\'m begging you. Stop pressing the button.', bg: null },
    { emoji: '💀', text: 'You\'ve pressed it 11 times. Eleven. That\'s not normal behaviour.', bg: null },
    { emoji: '🔥', text: 'The website is on fire now. Metaphorically. (Please don\'t actually set fire to anything.)', bg: '#1a0800', action: () => flashOrange() },
    { emoji: '👁️', text: 'I\'m watching you. I\'ve always been watching.', bg: null, action: () => eyeFollow() },
    { emoji: '🤖', text: 'INITIATING CONSEQUENCES... just kidding. But seriously stop.', bg: null },
    { emoji: '🌮', text: 'You get a taco. You don\'t deserve it but here you go. 🌮', bg: null },
    { emoji: '🥲', text: 'I\'ve accepted my fate. Press away. I\'ll just be here. Crying.', bg: null },
    { emoji: '🎸', text: 'You know what, respect. Most people stop at 3. You\'re still here.', bg: null, action: () => launchConfetti() },
    { emoji: '😮', text: 'Okay wait — are you actually trying to break this? Because you might.', bg: null },
    { emoji: '💣', text: 'This button is now a bomb. It\'s always been a bomb. Tick tock.', bg: '#1a0a00', action: () => shakeScreen() },
    { emoji: '🏆', text: '20 presses. You\'ve won absolutely nothing. Congratulations champion.', bg: null, action: () => launchConfetti() },
];

const loopEvents = [
    { emoji: '😶', text: 'Still going huh.', bg: null },
    { emoji: '🤷', text: 'At this point I respect the commitment.', bg: null },
    { emoji: '🧘', text: 'I\'ve found inner peace. Have you?', bg: null },
    { emoji: '🌈', text: 'You unlocked: a rainbow. (You didn\'t.)', bg: null, action: () => flashRainbow() },
    { emoji: '🛸', text: 'Aliens are watching you press this button. They\'re confused too.', bg: null },
    { emoji: '📞', text: 'Your mum called. She says to stop pressing the button.', bg: null },
    { emoji: '😴', text: 'I\'m going to sleep. Wake me when you\'re done.', bg: null },
    { emoji: '🎲', text: () => 'Random number: ' + Math.floor(Math.random() * 9999) + '. You\'re welcome.', bg: null },
];

function pressButton() {
    presses++;
    document.getElementById('pressCount').textContent = presses;

    const ev = presses <= events.length
        ? events[presses - 1]
        : loopEvents[(presses - events.length - 1) % loopEvents.length];

    const textEl = document.getElementById('consText');
    const emojiEl = document.getElementById('consEmoji');
    textEl.classList.add('fade');

    setTimeout(() => {
        emojiEl.textContent = ev.emoji;
        textEl.textContent = typeof ev.text === 'function' ? ev.text() : ev.text;
        textEl.classList.remove('fade');
    }, 250);

    document.body.style.background = ev.bg || '#020617';

    if (ev.action) ev.action();
}

function shakeScreen() {
    document.body.style.animation = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.animation = 'bodyShake 0.5s ease';
    setTimeout(() => { document.body.style.animation = ''; }, 500);
}

function flashRed() {
    document.body.style.background = '#3a0000';
    setTimeout(() => { document.body.style.background = '#020617'; }, 400);
}

function flashOrange() {
    document.body.style.background = '#3a1500';
    setTimeout(() => { document.body.style.background = '#020617'; }, 400);
}

function flashRainbow() {
    const colors = ['#1a0020', '#001a20', '#001a00', '#1a1a00', '#1a0000'];
    let i = 0;
    const iv = setInterval(() => {
        document.body.style.background = colors[i % colors.length];
        i++;
        if (i > 6) { 
            clearInterval(iv); 
            document.body.style.background = '#020617'; 
        }
    }, 120);
}

function spinPage() {
    const container = document.querySelector('.container');
    container.style.transition = 'transform 0.5s ease';
    container.style.transform = 'rotate(5deg)';
    setTimeout(() => { container.style.transform = 'rotate(-5deg)'; }, 500);
    setTimeout(() => { container.style.transform = 'rotate(0deg)'; }, 1000);
}

function eyeFollow() {
    const btn = document.getElementById('redBtn');
    btn.textContent = '👁️';
    setTimeout(() => { btn.innerHTML = 'DO NOT<br>PRESS'; }, 2000);
}

function launchConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#60a5fa', '#f87171', '#fbbf24', '#10b981', '#a78bfa', '#fb923c'];
    
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div');
        const animIndex = Math.floor(Math.random() * 3);
        const duration = 1 + Math.random() * 2;
        const opacity = 0.7 + Math.random() * 0.3;
        const rotation = Math.random() * 360;
        const isCircle = Math.random() < 0.5;

        p.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            border-radius: ${isCircle ? '50%' : '2px'};
            animation: fall${animIndex} ${duration}s linear forwards;
            opacity: ${opacity};
            transform: rotate(${rotation}deg);
        `;
        
        container.appendChild(p);
        setTimeout(() => p.remove(), 3000);
    }
}

/* Background Particle System */
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
        const currentOpacity = Math.max(0, s.opacity + Math.sin(t * s.ts * 60 + s.to) * 0.14);
        ctx.fillStyle = `rgba(148, 197, 255, ${currentOpacity})`;
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