let progress = 0;
let drainInterval = null;
let lastScrollTime = 0;
let started = false;
let won = false;

const pctEl = document.getElementById("pct");
const fillEl = document.getElementById("barFill");
const hintEl = document.getElementById("scrollHint");
const commentEl = document.getElementById("comment");
const winScreenEl = document.getElementById("winScreen");
const winBtn = document.getElementById("winBtn");

const drainComments = [
  "It's slipping away.",
  "Don't stop now.",
  "I told you.",
  "Almost had it.",
  "Oh no.",
  "Keep going!",
  "It's draining...",
  "Focus.",
  "You hesitated.",
  "So close. So, so close.",
];

const scrollComments = [
  "You've got this. Probably.",
  "Keep scrolling!",
  "Yes! Like that!",
  "You're doing it!",
  "Don't slow down.",
  "Go go go!",
  "Nearly there!",
  "I'm impressed. A little.",
  "The bar hungers for more.",
  "Almost!",
];

const highComments = [
  "You're actually doing it.",
  "Don't jinx it.",
  "So close...",
  "One slip and it's over.",
  "I'm watching.",
  "Stay focused.",
  "Breathe.",
];

function setComment(txt) {
  commentEl.style.opacity = "0";
  setTimeout(() => {
    commentEl.textContent = txt;
    commentEl.style.opacity = "1";
  }, 200);
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function updateUI() {
  const p = Math.max(0, Math.min(100, progress));
  pctEl.textContent = Math.round(p) + "%";
  fillEl.style.width = p + "%";

  // colours
  if (p >= 80) {
    pctEl.className = "pct winning";
    fillEl.className = "bar-fill winning";
  } else if (p < 20 && started) {
    pctEl.className = "pct danger";
    fillEl.className = "bar-fill danger";
  } else {
    pctEl.className = "pct";
    fillEl.className = "bar-fill";
  }

  // hint
  const idle = Date.now() - lastScrollTime > 400;
  if (!started) {
    hintEl.textContent = "↑ Scroll up to begin";
    hintEl.className = "scroll-hint";
  } else if (idle && p > 0) {
    hintEl.textContent = "⚠️ It's draining! Keep scrolling!";
    hintEl.className = "scroll-hint urgent";
  } else {
    hintEl.textContent = "↑ Keep scrolling!";
    hintEl.className = "scroll-hint";
  }
}

// drain loop — runs always, progress drains when not scrolling
drainInterval = setInterval(() => {
  if (!started || won) return;
  const idle = Date.now() - lastScrollTime > 300;
  if (idle && progress > 0) {
    // drain speed increases as you get higher — cruel
    const drainRate = 0.4 + (progress / 100) * 0.6;
    progress = Math.max(0, progress - drainRate);
    updateUI();
    if (Math.random() < 0.08) setComment(randomFrom(drainComments));
  }
}, 50);

function handleScroll(delta) {
  if (won) return;
  if (delta > 0) return; // only scroll up counts (negative delta = up)

  started = true;
  lastScrollTime = Date.now();
  const gain = Math.min(Math.abs(delta) * 0.18, 3.5);
  progress = Math.min(100, progress + gain);
  updateUI();

  if (Math.random() < 0.06) {
    if (progress >= 75) setComment(randomFrom(highComments));
    else setComment(randomFrom(scrollComments));
  }

  if (progress >= 100) triggerWin();
}

function triggerWin() {
  won = true;
  progress = 100;
  updateUI();
  setTimeout(() => winScreenEl.classList.add("show"), 400);
}

function resetGame() {
  won = false;
  started = false;
  progress = 0;
  lastScrollTime = 0;
  winScreenEl.classList.remove("show");
  hintEl.textContent = "↑ Scroll up to begin";
  hintEl.className = "scroll-hint";
  setComment("You've got this. Probably.");
  updateUI();
}

// Event Listeners
winBtn.addEventListener("click", resetGame);

// mouse wheel
window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    handleScroll(e.deltaY);
  },
  { passive: false }
);

// touch
let lastTouchY = null;
window.addEventListener(
  "touchstart",
  (e) => {
    lastTouchY = e.touches[0].clientY;
  },
  { passive: false }
);

window.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    if (lastTouchY === null) return;
    const delta = lastTouchY - e.touches[0].clientY; // positive = scrolling down, negative = up
    lastTouchY = e.touches[0].clientY;
    handleScroll(delta); // pass as-is, up swipe = negative delta
  },
  { passive: false }
);

window.addEventListener("touchend", () => {
  lastTouchY = null;
});

updateUI();

// particles
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
let W,
  H,
  stars = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function initStars() {
  stars = [];
  for (let i = 0; i < Math.floor((W * H) / 8000); i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.1 + 0.3,
      speed: Math.random() * 0.14 + 0.03,
      opacity: Math.random() * 0.45 + 0.1,
      ts: Math.random() * 0.01 + 0.003,
      to: Math.random() * Math.PI * 2,
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
    ctx.fillStyle = `rgba(148,197,255,${Math.max(
      0,
      s.opacity + Math.sin(t * s.ts * 60 + s.to) * 0.14
    )})`;
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

window.addEventListener("resize", () => {
  resize();
  initStars();
});
