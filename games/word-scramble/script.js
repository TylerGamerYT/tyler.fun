const WORDS = [
    // animals
    { word: 'ELEPHANT', hint: 'Big grey animal with a trunk', category: 'Animals' },
    { word: 'PENGUIN', hint: 'A bird that swims but cannot fly', category: 'Animals' },
    { word: 'DOLPHIN', hint: 'Smart ocean mammal', category: 'Animals' },
    { word: 'GIRAFFE', hint: 'Tallest animal on land', category: 'Animals' },
    { word: 'CHEETAH', hint: 'Fastest land animal', category: 'Animals' },
    { word: 'OCTOPUS', hint: 'Eight-armed sea creature', category: 'Animals' },
    { word: 'HAMSTER', hint: 'Tiny fluffy pet with cheek pouches', category: 'Animals' },
    { word: 'LOBSTER', hint: 'Red when cooked, a seafood delicacy', category: 'Animals' },
    // food
    { word: 'BURGER', hint: 'Classic fast food sandwich', category: 'Food' },
    { word: 'PIZZA', hint: 'Italian dish with toppings on dough', category: 'Food' },
    { word: 'WAFFLE', hint: 'Grid-patterned breakfast treat', category: 'Food' },
    { word: 'PRETZEL', hint: 'Twisted salty baked snack', category: 'Food' },
    { word: 'MANGO', hint: 'Tropical yellow-orange fruit', category: 'Food' },
    { word: 'NOODLE', hint: 'Long thin pasta or ramen ingredient', category: 'Food' },
    { word: 'BROWNIE', hint: 'Dense chocolate baked square', category: 'Food' },
    { word: 'SAUSAGE', hint: 'Meat in a casing, great in a bun', category: 'Food' },
    // tech
    { word: 'KEYBOARD', hint: 'You type on this', category: 'Tech' },
    { word: 'MONITOR', hint: 'Screen that displays your work', category: 'Tech' },
    { word: 'BROWSER', hint: 'App you use to visit websites', category: 'Tech' },
    { word: 'LAPTOP', hint: 'Portable personal computer', category: 'Tech' },
    { word: 'SERVER', hint: 'Computer that serves data to others', category: 'Tech' },
    { word: 'ROUTER', hint: 'Device that sends WiFi around your home', category: 'Tech' },
    { word: 'PYTHON', hint: 'Popular programming language, also a snake', category: 'Tech' },
    { word: 'CURSOR', hint: 'The arrow you move with your mouse', category: 'Tech' },
    // sports
    { word: 'CRICKET', hint: 'Popular bat-and-ball sport in England', category: 'Sports' },
    { word: 'FOOTBALL', hint: 'The most popular sport on Earth', category: 'Sports' },
    { word: 'TENNIS', hint: 'Played with rackets across a net', category: 'Sports' },
    { word: 'BOXING', hint: 'Two people punch each other in a ring', category: 'Sports' },
    { word: 'CYCLING', hint: 'Racing or riding on two wheels', category: 'Sports' },
    { word: 'ARCHERY', hint: 'Shooting arrows at a target', category: 'Sports' },
    // random fun
    { word: 'VOLCANO', hint: 'Mountain that erupts with lava', category: 'Nature' },
    { word: 'THUNDER', hint: 'The loud boom after lightning', category: 'Nature' },
    { word: 'GLACIER', hint: 'Massive slow-moving river of ice', category: 'Nature' },
    { word: 'TORNADO', hint: 'Spinning column of wind', category: 'Nature' },
    { word: 'CACTUS', hint: 'Spiky desert plant', category: 'Nature' },
    { word: 'GALAXY', hint: 'A massive system of stars in space', category: 'Space' },
    { word: 'COMET', hint: 'Icy rock that streaks across the sky', category: 'Space' },
    { word: 'SATURN', hint: 'Planet with famous rings', category: 'Space' },
    { word: 'NEBULA', hint: 'Giant cloud of gas and dust in space', category: 'Space' },
];

const TIME_PER_WORD = 15; // seconds
const MAX_HINTS = 3;

let score = 0, streak = 0, bestStreak = 0, round = 1;
let hintsLeft = MAX_HINTS;
let currentWord = '', scrambled = '';
let answer = [], selectedTiles = [];
let timerInterval = null, timeLeft = TIME_PER_WORD;
let usedWords = [];
let hintShown = false;

function scrambleWord(word) {
    let arr = word.split('');
    let attempts = 0;
    do {
        arr.sort(() => Math.random() - 0.5);
        attempts++;
    } while (arr.join('') === word && attempts < 20);
    return arr.join('');
}

function startGame() {
    score = 0; streak = 0; bestStreak = 0; round = 1;
    hintsLeft = MAX_HINTS;
    usedWords = [];
    document.getElementById('gameover').classList.remove('show');
    updateStats();
    nextWord();
}

function nextWord() {
    hintShown = false;
    document.getElementById('hintText').textContent = '';
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('hintBtn').textContent = `💡 Hint (${hintsLeft} left)`;
    document.getElementById('hintBtn').disabled = hintsLeft === 0;

    // pick unused word
    const available = WORDS.filter(w => !usedWords.includes(w.word));
    if (available.length === 0) { usedWords = []; }
    const pick = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : WORDS[Math.floor(Math.random() * WORDS.length)];
    usedWords.push(pick.word);
    currentWord = pick.word;
    document.getElementById('categoryBadge').textContent = pick.category;

    scrambled = scrambleWord(currentWord);
    answer = Array(currentWord.length).fill(null);
    selectedTiles = Array(scrambled.length).fill(false);

    renderTiles();
    startTimer();
}

function renderTiles() {
    // scramble tiles
    const sd = document.getElementById('scrambleDisplay');
    sd.innerHTML = '';
    scrambled.split('').forEach((ch, i) => {
        const tile = document.createElement('div');
        tile.className = 'letter-tile' + (selectedTiles[i] ? ' selected' : '');
        tile.textContent = ch;
        tile.dataset.idx = i;
        tile.onclick = () => pickLetter(i);
        sd.appendChild(tile);
    });

    // answer slots
    const ar = document.getElementById('answerRow');
    ar.innerHTML = '';
    answer.forEach((ch, i) => {
        const slot = document.createElement('div');
        slot.className = 'answer-slot' + (ch ? ' filled' : '');
        slot.textContent = ch || '';
        slot.dataset.slot = i;
        if (ch) slot.onclick = () => removeLetter(i);
        ar.appendChild(slot);
    });
}

function pickLetter(tileIdx) {
    if (selectedTiles[tileIdx]) return;
    const firstEmpty = answer.indexOf(null);
    if (firstEmpty === -1) return;
    answer[firstEmpty] = scrambled[tileIdx];
    selectedTiles[tileIdx] = true;
    renderTiles();

    // auto-check when full
    if (!answer.includes(null)) checkAnswer();
}

function removeLetter(slotIdx) {
    const ch = answer[slotIdx];
    if (!ch) return;
    // find corresponding tile to un-select
    // find first selected tile matching this letter
    for (let i = 0; i < scrambled.length; i++) {
        if (selectedTiles[i] && scrambled[i] === ch) {
            selectedTiles[i] = false;
            break;
        }
    }
    answer[slotIdx] = null;
    renderTiles();
}

function clearAnswer() {
    answer = Array(currentWord.length).fill(null);
    selectedTiles = Array(scrambled.length).fill(false);
    renderTiles();
}

function checkAnswer() {
    const guess = answer.join('');
    if (guess === currentWord) {
        // correct!
        score++;
        streak++;
        if (streak > bestStreak) bestStreak = streak;
        round++;
        updateStats();
        flashFeedback('✓ Correct!', 'correct');
        flashTiles('correct');
        clearTimer();
        setTimeout(nextWord, 900);
    } else {
        // wrong
        streak = 0;
        updateStats();
        flashFeedback('✗ Not quite...', 'wrong');
        flashTiles('wrong');
        setTimeout(clearAnswer, 600);
    }
}

function flashFeedback(msg, type) {
    const el = document.getElementById('feedback');
    el.textContent = msg;
    el.className = 'feedback ' + type;
    setTimeout(() => { el.textContent = ''; el.className = 'feedback'; }, 800);
}

function flashTiles(type) {
    document.querySelectorAll('.answer-slot.filled').forEach(el => {
        el.classList.add(type);
        setTimeout(() => el.classList.remove(type), 500);
    });
}

function skipWord() {
    streak = 0;
    updateStats();
    clearTimer();
    round++;
    flashFeedback(`Word was: ${currentWord}`, 'wrong');
    setTimeout(nextWord, 900);
}

function useHint() {
    if (hintsLeft <= 0 || hintShown) return;
    hintsLeft--;
    hintShown = true;
    const pick = WORDS.find(w => w.word === currentWord);
    document.getElementById('hintText').textContent = pick ? `Hint: ${pick.hint}` : '';
    document.getElementById('hintBtn').textContent = `💡 Hint (${hintsLeft} left)`;
    document.getElementById('hintBtn').disabled = hintsLeft === 0;
}

function updateStats() {
    document.getElementById('scoreVal').textContent = score;
    document.getElementById('streakVal').textContent = streak;
    document.getElementById('roundVal').textContent = round;
}

// ---- timer ----
function startTimer() {
    clearTimer();
    timeLeft = TIME_PER_WORD;
    updateTimerBar();
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        updateTimerBar();
        if (timeLeft <= 0) {
            clearTimer();
            timeOut();
        }
    }, 100);
}

function updateTimerBar() {
    const bar = document.getElementById('timerBar');
    const pct = Math.max(0, (timeLeft / TIME_PER_WORD) * 100);
    bar.style.width = pct + '%';
    if (pct < 25) bar.className = 'timer-bar danger';
    else if (pct < 50) bar.className = 'timer-bar warn';
    else bar.className = 'timer-bar';
}

function clearTimer() { clearInterval(timerInterval); }

function timeOut() {
    streak = 0;
    updateStats();
    document.getElementById('goTitle').textContent = `Time's up! The word was "${currentWord}"`;
    document.getElementById('goScore').textContent = score;
    document.getElementById('goStreak').textContent = bestStreak;
    setTimeout(() => document.getElementById('gameover').classList.add('show'), 400);
}

startGame();

// particles
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
