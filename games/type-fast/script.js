const TEXTS = [
    "The quick brown fox jumps over the lazy dog while the cat watches from afar.",
    "Pack my box with five dozen liquor jugs and a brand new pair of gloves.",
    "How vexingly quick daft zebras jump over the sleeping fox near the pond.",
    "The five boxing wizards jump quickly before the match starts at dawn.",
    "Sphinx of black quartz judge my vow while the river flows past the ancient stones.",
    "Crazy Fredrick bought many very exquisite opal jewels and some rare gems.",
    "We promptly judged antique ivory buckles for the next prize in the quiet town.",
];

const TWISTS = [
    { condition: wpm => wpm < 30,  emoji: '🐌', title: 'Glacially slow.', text: 'You typed slower than most people think. The average person types 40 WPM. You typed {wpm} WPM. Maybe try again?' },
    { condition: wpm => wpm >= 30 && wpm < 50, emoji: '🙂', title: 'Average. Painfully average.', text: 'You got {wpm} WPM. That\'s... fine. Not impressive. Not embarrassing. Just fine. You are the beige of typists.' },
    { condition: wpm => wpm >= 50 && wpm < 70, emoji: '👏', title: 'Above average!', text: '{wpm} WPM puts you ahead of most people. Still not a typing god, but you\'re getting there. Keep practicing.' },
    { condition: wpm => wpm >= 70 && wpm < 100, emoji: '🔥', title: 'Legitimately fast.', text: '{wpm} WPM. That\'s impressive. Your fingers must be very happy. You have probably annoyed many coworkers with your typing speed.' },
    { condition: wpm => wpm >= 100, emoji: '⚡', title: 'Are you even human?', text: '{wpm} WPM?! The world record is 212 WPM. You\'re not there yet, but honestly at this point you might be some kind of keyboard wizard.' },
];

const TIME_LIMIT = 60;
let text = '', typed = '', started = false, finished = false;
let startTime = null, timerInterval = null, timeLeft = TIME_LIMIT;
let errors = 0, totalTyped = 0;

function startGame() {
    text = TEXTS[Math.floor(Math.random() * TEXTS.length)];
    typed = ''; started = false; finished = false;
    errors = 0; totalTyped = 0; timeLeft = TIME_LIMIT;
    document.getElementById('results').classList.remove('show');
    document.getElementById('typeInput').value = '';
    document.getElementById('typeInput').disabled = false;
    document.getElementById('typeInput').focus();
    document.getElementById('wpmVal').textContent = '0';
    document.getElementById('accVal').textContent = '100%';
    document.getElementById('timeVal').textContent = TIME_LIMIT;
    document.getElementById('timerBar').style.width = '100%';
    document.getElementById('timerBar').className = 'timer-bar';
    document.getElementById('hintText').textContent = 'Type the highlighted character to begin the timer';
    clearInterval(timerInterval);
    renderText();
}

function renderText() {
    const display = document.getElementById('textDisplay');
    display.innerHTML = text.split('').map((ch, i) => {
        if (i < typed.length) {
            const correct = typed[i] === text[i];
            return `<span class="char-${correct ? 'correct' : 'wrong'}">${ch}</span>`;
        }
        if (i === typed.length) return `<span class="char-current">${ch}</span>`;
        return `<span class="char-pending">${ch}</span>`;
    }).join('');
}

document.getElementById('typeInput').addEventListener('input', e => {
    if (finished) return;
    const val = e.target.value;

    if (!started && val.length > 0) {
        started = true;
        startTime = Date.now();
        document.getElementById('hintText').textContent = '';
        startTimer();
    }

    // only allow typing forward
    if (val.length > text.length) { e.target.value = val.slice(0, text.length); return; }

    totalTyped = Math.max(totalTyped, val.length);
    // count errors
    errors = 0;
    for (let i = 0; i < val.length; i++) {
        if (val[i] !== text[i]) errors++;
    }

    typed = val;
    renderText();
    updateStats();

    if (val === text) finishGame();
});

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft = Math.max(0, TIME_LIMIT - (Date.now() - startTime) / 1000);
        document.getElementById('timeVal').textContent = Math.ceil(timeLeft);
        const pct = (timeLeft / TIME_LIMIT) * 100;
        const bar = document.getElementById('timerBar');
        bar.style.width = pct + '%';
        bar.className = 'timer-bar' + (pct < 25 ? ' danger' : pct < 50 ? ' warn' : '');
        updateStats();
        if (timeLeft <= 0) finishGame();
    }, 100);
}

function updateStats() {
    const elapsed = started ? (Date.now() - startTime) / 60000 : 0;
    const words = typed.trim().split(/\s+/).filter(w => w).length;
    const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
    const acc = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100;
    document.getElementById('wpmVal').textContent = wpm;
    document.getElementById('accVal').textContent = acc + '%';
}

function finishGame() {
    if (finished) return;
    finished = true;
    clearInterval(timerInterval);
    document.getElementById('typeInput').disabled = true;

    const elapsed = (Date.now() - startTime) / 60000;
    const words = typed.trim().split(/\s+/).filter(w=>w).length;
    const wpm = Math.round(words / elapsed);
    const acc = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100;
    const timeTaken = Math.round((Date.now() - startTime) / 100) / 10;

    document.getElementById('resWpm').textContent = wpm;
    document.getElementById('resAcc').textContent = acc + '%';
    document.getElementById('resTime').textContent = timeTaken + 's';
    document.getElementById('resErrors').textContent = errors;

    const twist = TWISTS.find(t => t.condition(wpm)) || TWISTS[TWISTS.length - 1];
    document.getElementById('resEmoji').textContent = twist.emoji;
    document.getElementById('resTitle').textContent = twist.title;
    document.getElementById('twistText').textContent = twist.text.replace('{wpm}', wpm);

    setTimeout(() => document.getElementById('results').classList.add('show'), 300);
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
