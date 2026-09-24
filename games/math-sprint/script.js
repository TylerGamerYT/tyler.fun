// ---- State & Configuration ----
const TIME = 60;
let score = 0,
  streak = 0,
  bestStreak = 0,
  timeLeft = TIME,
  diff = "easy";
let currentAnswer = 0,
  timerInterval = null,
  started = false;

// ---- Difficulty Selection ----
function setDiff(d) {
  diff = d;
  ["easy", "medium", "hard"].forEach((x) =>
    document
      .getElementById("d" + x.charAt(0).toUpperCase() + x.slice(1))
      .classList.toggle("active", x === d)
  );
  if (!started) nextQuestion();
}

document.getElementById("dEasy").addEventListener("click", () => setDiff("easy"));
document.getElementById("dMedium").addEventListener("click", () => setDiff("medium"));
document.getElementById("dHard").addEventListener("click", () => setDiff("hard"));

// ---- Question Generator ----
function rand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function genQuestion() {
  const ops =
    diff === "easy"
      ? ["+", "-"]
      : diff === "medium"
        ? ["+", "-", "×"]
        : ["+", "-", "×", "÷"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, ans;

  if (op === "+") {
    a =
      diff === "easy"
        ? rand(1, 20)
        : diff === "medium"
          ? rand(1, 50)
          : rand(1, 200);
    b =
      diff === "easy"
        ? rand(1, 20)
        : diff === "medium"
          ? rand(1, 50)
          : rand(1, 200);
    ans = a + b;
  } else if (op === "-") {
    a =
      diff === "easy"
        ? rand(5, 30)
        : diff === "medium"
          ? rand(10, 100)
          : rand(50, 500);
    b = rand(1, a);
    ans = a - b;
  } else if (op === "×") {
    a = diff === "medium" ? rand(2, 12) : rand(2, 20);
    b = diff === "medium" ? rand(2, 12) : rand(2, 20);
    ans = a * b;
  } else {
    b = rand(2, 12);
    ans = rand(1, 12);
    a = b * ans;
  }
  return { question: `${a} ${op} ${b} =`, answer: ans };
}

function nextQuestion() {
  const q = genQuestion();
  currentAnswer = q.answer;
  document.getElementById("question").textContent = q.question;
  document.getElementById("answerInput").value = "";
  document.getElementById("answerInput").className = "answer-input";
  document.getElementById("answerInput").focus();
}

// ---- Game Loop Controls ----
document
  .getElementById("answerInput")
  .addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (!started) {
      started = true;
      startTimer();
    }
    const val = parseInt(document.getElementById("answerInput").value);
    if (isNaN(val)) return;

    if (val === currentAnswer) {
      score += diff === "easy" ? 1 : diff === "medium" ? 2 : 3;
      streak++;
      if (streak > bestStreak) bestStreak = streak;
      document.getElementById("answerInput").className = "answer-input correct";
      setFeedback("✓ Correct!", "good");
    } else {
      streak = 0;
      document.getElementById("answerInput").className = "answer-input wrong";
      setFeedback(`✗ It was ${currentAnswer}`, "bad");
    }

    updateStats();
    setTimeout(nextQuestion, 300);
  });

function setFeedback(msg, cls) {
  const el = document.getElementById("feedback");
  el.textContent = msg;
  el.className = "feedback " + cls;
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft = Math.max(0, timeLeft - 0.1);
    updateStats();
    const pct = (timeLeft / TIME) * 100;
    const bar = document.getElementById("timerBar");
    bar.style.width = pct + "%";
    bar.className =
      "timer-bar" + (pct < 25 ? " danger" : pct < 50 ? " warn" : "");
    if (timeLeft <= 0) endGame();
  }, 100);
}

function updateStats() {
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("timeVal").textContent = Math.ceil(timeLeft);
}

function endGame() {
  clearInterval(timerInterval);
  const title =
    score < 5
      ? "Keep practicing."
      : score < 15
        ? "Not bad!"
        : score < 30
          ? "Fast!"
          : "Calculator vibes.";
  document.getElementById("goTitle").textContent = title;
  document.getElementById("goScore").textContent = score;
  document.getElementById("goStreak").textContent = bestStreak;
  document.getElementById("gameover").classList.add("show");
}

function startGame() {
  score = 0;
  streak = 0;
  bestStreak = 0;
  timeLeft = TIME;
  started = false;
  clearInterval(timerInterval);
  document.getElementById("gameover").classList.remove("show");
  document.getElementById("timerBar").style.width = "100%";
  updateStats();
  nextQuestion();
  setFeedback("Type your answer and press Enter", "");
}

document.getElementById("playAgainBtn").addEventListener("click", startGame);

// Initialize initial round
startGame();

// ---- Background Star Particles ----
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
let W, H, stars = [];

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

window.addEventListener("resize", () => {
  resize();
  initStars();
});
