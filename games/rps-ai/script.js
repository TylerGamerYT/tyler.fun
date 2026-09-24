// ---- Game Setup & Constants ----
const CHOICES = ['rock', 'paper', 'scissors'];
const EMOJI = { rock: '🪨', paper: '📄', scissors: '✂️' };
const BEATS = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

let scores = { you: 0, ai: 0, tie: 0 };
let history = []; 
let round = 0;

// Markov Chain setup to track moves after prior states
let markov = {
    rock: { rock: 0, paper: 0, scissors: 0 },
    paper: { rock: 0, paper: 0, scissors: 0 },
    scissors: { rock: 0, paper: 0, scissors: 0 }
};
let lastMove = null;

const winComments = [
    "Ha! Predicted that.", "Too easy.", "Called it.",
    "Did you really think I wouldn't see that?", "Predictable.",
    "I'm in your head.", "I knew you'd do that.", "Classic.",
    "Try something different.", "Your patterns are showing."
];

const loseComments = [
    "Lucky.", "Hmm. Interesting.", "You surprised me. Once.",
    "Fine. Well played.", "I wasn't expecting that.", "Recalibrating...",
    "You got me. This time.", "Noted.", "Good move. Won't work twice.", "I'll remember that."
];

const tieComments = [
    "We think alike.", "Interesting.", "Great minds.",
    "Same wavelength.", "Mirror.", "Hmm.", "Again?",
    "We're tied. For now.", "Coincidence.", "Curious."
];

// ---- DOM Elements ----
const youScoreEl = document.getElementById('youScore');
const tieScoreEl = document.getElementById('tieScore');
const aiScoreEl = document.getElementById('aiScore');
const youEmojiEl = document.getElementById('youEmoji');
const aiEmojiEl = document.getElementById('aiEmoji');
const resultTextEl = document.getElementById('resultText');
const aiCommentEl = document.getElementById('aiComment');
const aiThinkingEl = document.getElementById('aiThinking');

const btnR = document.getElementById('btnR');
const btnP = document.getElementById('btnP');
const btnS = document.getElementById('btnS');

// ---- Event Listeners ----
btnR.addEventListener('click', () => play('rock'));
btnP.addEventListener('click', () => play('paper'));
btnS.addEventListener('click', () => play('scissors'));

// ---- AI Prediction Logic ----
function aiPredict() {
    if (lastMove && round > 2) {
        const probs = markov[lastMove];
        const total = probs.rock + probs.paper + probs.scissors;
        
        if (total > 0) {
            let maxProb = 0;
            let predicted = null;
            
            for (const m of CHOICES) {
                if (probs[m] > maxProb) { 
                    maxProb = probs[m]; 
                    predicted = m; 
                }
            }
            
            if (predicted && (maxProb / total) > 0.3) {
                return CHOICES.find(c => BEATS[c] === predicted);
            }
        }
    }
    
    // Fallback: Random choice with slight bias to counter last move
    if (lastMove && Math.random() < 0.4) {
        return CHOICES.find(c => BEATS[c] === lastMove);
    }
    
    return CHOICES[Math.floor(Math.random() * 3)];
}

// ---- Game Flow ----
function play(move) {
    round++;
    setButtons(true);

    if (lastMove) {
        markov[lastMove][move]++;
    }

    const aiMove = aiPredict();
    lastMove = move;
    history.push(move);

    // Reset visual choices for animation
    youEmojiEl.textContent = '❓';
    aiEmojiEl.textContent = '❓';
    youEmojiEl.className = 'choice-emoji';
    aiEmojiEl.className = 'choice-emoji';

    setTimeout(() => {
        youEmojiEl.textContent = EMOJI[move];
        aiEmojiEl.textContent = EMOJI[aiMove];
        youEmojiEl.className = 'choice-emoji reveal';
        aiEmojiEl.className = 'choice-emoji reveal';

        let comment;
        if (move === aiMove) {
            scores.tie++;
            resultTextEl.textContent = 'Tie.';
            resultTextEl.className = 'result-text tie';
            comment = tieComments[Math.floor(Math.random() * tieComments.length)];
        } else if (BEATS[move] === aiMove) {
            scores.you++;
            resultTextEl.textContent = 'You win!';
            resultTextEl.className = 'result-text win';
            comment = loseComments[Math.floor(Math.random() * loseComments.length)];
        } else {
            scores.ai++;
            resultTextEl.textContent = 'AI wins!';
            resultTextEl.className = 'result-text lose';
            comment = winComments[Math.floor(Math.random() * winComments.length)];
        }

        aiCommentEl.textContent = comment;
        updateScores();

        const thinking = round < 5 
            ? 'Still learning your patterns...' 
            : round < 10 
            ? 'Pattern recognition improving...' 
            : round < 20 
            ? "I know what you're going to do." 
            : 'I am inevitable.';
            
        aiThinkingEl.textContent = thinking;

        setTimeout(() => setButtons(false), 300);
    }, 400);
}

function setButtons(disabled) {
    btnR.disabled = disabled;
    btnP.disabled = disabled;
    btnS.disabled = disabled;
}

function updateScores() {
    youScoreEl.textContent = scores.you;
    tieScoreEl.textContent = scores.tie;
    aiScoreEl.textContent = scores.ai;
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

// ---- Initialization ----
resize(); 
initStars(); 
draw();

window.addEventListener('resize', () => {
    resize();
    initStars();
});
