// ---- Game Configuration and State ----
const roasts = [
    // 1-9
    ["Okay, you clicked. Revolutionary.", "Bold move.", "A click. How original.", "You're really going for it huh.", "Still going? Interesting life choices.", "Most people have hobbies.", "Each click is a second of your life. Just saying.", "You could be outside right now.", "Is this the highlight of your day?"],
    // 10
    ["10 clicks. You've achieved the bare minimum. Congrats, I guess."],
    // 11-24
    ["Okay seriously what are you doing.", "My grandma clicks faster.", "You look like you click with your elbow.", "Each click adds 0 value to the world.", "I've seen sloths with more urgency.", "You must be fun at parties. Actually no.", "Your mouse is embarrassed for you.", "Doctors hate this one weird clicker.", "Clicking won't fix your problems.", "Have you tried going outside?", "Your WiFi is faster than your ambition.", "Peak performance. Just kidding.", "I'm not mad, I'm just disappointed.", "Are you okay? Genuinely asking."],
    // 25
    ["25 clicks. A quarter century of bad decisions. Just like your life! (kidding... mostly)"],
    // 26-49
    ["You're still here. Bold.", "I respect the commitment. Not the person, just the commitment.", "This is genuinely your fault.", "Have you considered literally anything else?", "Your mouse is filing for workers' comp.", "The button didn't ask for this.", "Somewhere, a philosopher is crying because of you.", "You're the reason we can't have nice things.", "I'm logging this. Idk what I'll do with it but I'm logging it.", "Sir/ma'am this is a website.", "At this point you're basically family. Unwanted family.", "Your future self is watching this and cringing.", "You've unlocked the 'nothing to do' achievement.", "Even the button feels sorry for you."],
    // 50
    ["50 CLICKS?! You need help. Actual, professional help. But respect."],
    // 51-99
    ["You're still going. Incredible.", "The internet was a mistake.", "No notes. Just disappointment.", "You have the energy of someone who replies-all.", "I didn't think you'd make it this far. I was hoping you wouldn't.", "Your fingers must be so proud of you. Your brain less so.", "Somewhere a tree grew and it wasn't for this.", "I'm running out of roasts. You're running out of dignity.", "We're both stuck here aren't we.", "You remind me of a loading screen that never finishes.", "This is fine. Everything is fine.", "The audacity. The nerve. The clicks.", "You and this button deserve each other.", "At this point it's art. Terrible, pointless art."],
    // 100
    ["100 CLICKS. ONE HUNDRED. You've done it. Done absolutely nothing. Legendary."],
    // 101+
    ["okay i give up roasting you", "you win. whatever that means.", "you've broken me. happy?", "i have nothing left.", "...just keep clicking i guess", "you're a menace to society", "this is your villain origin story", "i genuinely respect and fear you", "please. i am begging you to stop.", "no? okay. fine. FINE.", "i'm telling neal.fun about you", "you've ascended beyond my roasts", "you're not a person anymore. you're a click.", "the button is tired. i'm tired. are YOU tired? no? of course not."]
];

let clicks = 0;
const milestones = { 10: "10 clicks!", 25: "25 clicks!", 50: "50 clicks!", 100: "ONE HUNDRED CLICKS!" };

// ---- DOM Elements ----
const clickBtn = document.getElementById('clickBtn');
const counter = document.getElementById('counter');
const roastEl = document.getElementById('roast');
const milestoneEl = document.getElementById('milestone');
const milestoneTextEl = document.getElementById('milestone-text');

// ---- Event Handling ----
clickBtn.addEventListener('click', handleClick);

function getRoast(n) {
    if (n === 0) return "Click the button. Go on. I dare you.";
    if (n <= 9)  return roasts[0][n - 1];
    if (n === 10) return roasts[1][0];
    if (n <= 24) return roasts[2][n - 11];
    if (n === 25) return roasts[3][0];
    if (n <= 49) return roasts[4][n - 26];
    if (n === 50) return roasts[5][0];
    if (n <= 99) return roasts[6][n - 51];
    if (n === 100) return roasts[7][0];
    const idx = (n - 101) % roasts[8].length;
    return roasts[8][idx];
}

function showMilestone(text) {
    milestoneTextEl.textContent = text;
    milestoneEl.className = 'milestone';
    void milestoneEl.offsetWidth;
    milestoneEl.className = 'milestone show';
}

function handleClick(e) {
    clicks++;

    // Counter bump effect
    counter.textContent = clicks.toLocaleString();
    counter.classList.remove('bump');
    void counter.offsetWidth;
    counter.classList.add('bump');
    setTimeout(() => counter.classList.remove('bump'), 120);

    // Floating +1 text
    const f = document.createElement('div');
    f.className = 'float-text';
    f.textContent = '+1';
    f.style.left = (e.clientX - 12) + 'px';
    f.style.top  = (e.clientY - 20) + 'px';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 800);

    // Roast message change with fade
    roastEl.classList.add('hidden');
    setTimeout(() => {
        roastEl.textContent = getRoast(clicks);
        roastEl.classList.remove('hidden');
    }, 200);

    // Milestone check
    if (milestones[clicks]) {
        showMilestone(milestones[clicks]);
    }
}

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
            twinkleSpeed: Math.random() * 0.01 + 0.003, 
            twinkleOffset: Math.random() * Math.PI * 2 
        });
    }
}

let t = 0;
function draw() {
    ctx.clearRect(0, 0, W, H); 
    t += 0.016;

    for (const s of stars) {
        const alpha = s.opacity + Math.sin(t * s.twinkleSpeed * 60 + s.twinkleOffset) * 0.14;
        ctx.beginPath(); 
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,197,255,${Math.max(0, alpha)})`; 
        ctx.fill();
        
        s.y -= s.speed;
        if (s.y < -2) { 
            s.y = H + 2; 
            s.x = Math.random() * W; 
        }
    }
    requestAnimationFrame(draw);
}

// ---- Initialization ----
resize(); 
initStars(); 
draw();

window.addEventListener('resize', () => { 
    resize(); 
    initStars(); 
});
