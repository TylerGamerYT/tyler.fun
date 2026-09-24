const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startOverlay = document.getElementById("startOverlay");
const deadOverlay = document.getElementById("deadOverlay");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const scoreHud = document.getElementById("scoreHud");
const ballsHud = document.getElementById("ballsHud");
const shyHud = document.getElementById("shyHud");

const deadTitle = document.getElementById("deadTitle");
const deadSub = document.getElementById("deadSub");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const W = () => canvas.width;
const H = () => canvas.height;
const FLIPPER_W = 80;
const FLIPPER_H = 12;
const BALL_R = 10;

let ball, score, balls, running, animId;
let leftFlipper = {
  angle: 30,
  target: 30,
  shy: false,
  shyTimer: 0,
  activated: false,
};
let rightFlipper = {
  angle: 150,
  target: 150,
  shy: false,
  shyTimer: 0,
  activated: false,
};
let bumpers = [];
let keys = {};
let particles = [];
let shyMessages = ["😳", "😶", "🫣", "😬", "🙈", "😵‍💫"];
let shyMsgTimer = 0;
let shyMsgText = "";

function startGame() {
  startOverlay.classList.remove("show");
  deadOverlay.classList.remove("show");
  score = 0;
  balls = 3;
  running = true;
  leftFlipper = {
    angle: 30,
    target: 30,
    shy: false,
    shyTimer: 0,
    activated: false,
  };
  rightFlipper = {
    angle: 150,
    target: 150,
    shy: false,
    shyTimer: 0,
    activated: false,
  };
  bumpers = [
    { x: W() * 0.3, y: H() * 0.25, r: 22, color: "#ef4444" },
    { x: W() * 0.7, y: H() * 0.25, r: 22, color: "#3b82f6" },
    { x: W() * 0.5, y: H() * 0.18, r: 18, color: "#10b981" },
    { x: W() * 0.25, y: H() * 0.4, r: 16, color: "#f97316" },
    { x: W() * 0.75, y: H() * 0.4, r: 16, color: "#a855f7" },
  ];
  launchBall();
  if (animId) cancelAnimationFrame(animId);
  loop();
}

function launchBall() {
  ball = {
    x: W() / 2,
    y: H() * 0.6,
    vx: (Math.random() - 0.5) * 4,
    vy: -8,
    trail: [],
  };
}

function loop() {
  if (!running) return;
  update();
  draw();
  animId = requestAnimationFrame(loop);
}

function update() {
  if (!ball) return;

  // shy logic — flippers get nervous when ball is close
  const distToLeft = Math.sqrt(
    (ball.x - W() * 0.25) ** 2 + (ball.y - (H() - 80)) ** 2
  );
  const distToRight = Math.sqrt(
    (ball.x - W() * 0.75) ** 2 + (ball.y - (H() - 80)) ** 2
  );

  // left flipper shyness
  if (distToLeft < 180 && !leftFlipper.activated && Math.random() < 0.015) {
    leftFlipper.shy = true;
    leftFlipper.shyTimer = 40 + Math.floor(Math.random() * 40);
    shyMsgText = shyMessages[Math.floor(Math.random() * shyMessages.length)];
    shyMsgTimer = 50;
  }
  if (leftFlipper.shyTimer > 0) leftFlipper.shyTimer--;
  else leftFlipper.shy = false;

  // right flipper shyness
  if (distToRight < 180 && !rightFlipper.activated && Math.random() < 0.015) {
    rightFlipper.shy = true;
    rightFlipper.shyTimer = 40 + Math.floor(Math.random() * 40);
    shyMsgText = shyMessages[Math.floor(Math.random() * shyMessages.length)];
    shyMsgTimer = 50;
  }
  if (rightFlipper.shyTimer > 0) rightFlipper.shyTimer--;
  else rightFlipper.shy = false;

  if (shyMsgTimer > 0) shyMsgTimer--;

  // flipper activation
  leftFlipper.activated =
    (keys["z"] || keys["ArrowLeft"]) && !leftFlipper.shy;
  rightFlipper.activated =
    (keys["/"] || keys["ArrowRight"]) && !rightFlipper.shy;

  // flipper angles
  const leftTarget = leftFlipper.activated ? -30 : 30;
  const rightTarget = rightFlipper.activated ? 210 : 150;
  leftFlipper.angle += (leftTarget - leftFlipper.angle) * 0.3;
  rightFlipper.angle += (rightTarget - rightFlipper.angle) * 0.3;

  // ball physics
  ball.vy += 0.25; // gravity
  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.trail.push({ x: ball.x, y: ball.y });
  if (ball.trail.length > 12) ball.trail.shift();

  // walls
  if (ball.x - BALL_R < 0) {
    ball.x = BALL_R;
    ball.vx = Math.abs(ball.vx);
  }
  if (ball.x + BALL_R > W()) {
    ball.x = W() - BALL_R;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - BALL_R < 0) {
    ball.y = BALL_R;
    ball.vy = Math.abs(ball.vy);
  }

  // bumpers
  bumpers.forEach((b) => {
    const dx = ball.x - b.x,
      dy = ball.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < BALL_R + b.r) {
      const nx = dx / dist,
        ny = dy / dist;
      ball.vx = nx * 7;
      ball.vy = ny * 7;
      score += 50;
      updateHud();
      spawnParticles(b.x, b.y, b.color);
    }
  });

  // flipper collisions
  checkFlipperCollision(leftFlipper, W() * 0.25, H() - 80, false);
  checkFlipperCollision(rightFlipper, W() * 0.75, H() - 80, true);

  // lost ball
  if (ball.y > H() + 20) {
    balls--;
    updateHud();
    if (balls <= 0) {
      die();
      return;
    }
    setTimeout(launchBall, 800);
    ball = null;
  }

  // particles
  particles = particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life--;
    return p.life > 0;
  });
}

function checkFlipperCollision(flipper, fx, fy, isRight) {
  if (!ball) return;
  const rad = (flipper.angle * Math.PI) / 180;
  const ex = fx + Math.cos(rad) * FLIPPER_W;
  const ey = fy + Math.sin(rad) * FLIPPER_W;
  // simple distance to line segment
  const dx = ex - fx,
    dy = ey - fy;
  const len2 = dx * dx + dy * dy;
  let t = ((ball.x - fx) * dx + (ball.y - fy) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = fx + t * dx,
    cy = fy + t * dy;
  const dist = Math.sqrt((ball.x - cx) ** 2 + (ball.y - cy) ** 2);
  if (dist < BALL_R + FLIPPER_H / 2) {
    const nx = (ball.x - cx) / dist,
      ny = (ball.y - cy) / dist;
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    ball.vx = nx * Math.max(speed, 6);
    ball.vy = ny * Math.max(speed, 6) - (flipper.activated ? 3 : 0);
    score += 10;
    updateHud();
  }
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3 - 2,
      life: 20,
      color,
    });
  }
}

function draw() {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, W(), H());

  // walls
  ctx.strokeStyle = "rgba(96,165,250,0.2)";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, W() - 4, H() - 4);

  // bumpers
  bumpers.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.color + "33";
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // particles
  particles.forEach((p) => {
    ctx.globalAlpha = p.life / 20;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // flippers
  drawFlipper(leftFlipper, W() * 0.25, H() - 80, false);
  drawFlipper(rightFlipper, W() * 0.75, H() - 80, true);

  // shy message
  if (shyMsgTimer > 0) {
    ctx.globalAlpha = Math.min(1, shyMsgTimer / 15);
    ctx.font = "2rem serif";
    ctx.textAlign = "center";
    ctx.fillText(shyMsgText, W() / 2, H() * 0.6);
    ctx.globalAlpha = 1;
  }

  // ball
  if (ball) {
    // trail
    ball.trail.forEach((p, i) => {
      ctx.globalAlpha = (i / ball.trail.length) * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, BALL_R * (i / ball.trail.length), 0, Math.PI * 2);
      ctx.fillStyle = "#60a5fa";
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(
      ball.x - 3,
      ball.y - 3,
      2,
      ball.x,
      ball.y,
      BALL_R
    );
    grad.addColorStop(0, "#fff");
    grad.addColorStop(1, "#60a5fa");
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

function drawFlipper(flipper, fx, fy, isRight) {
  const rad = (flipper.angle * Math.PI) / 180;
  const ex = fx + Math.cos(rad) * FLIPPER_W;
  const ey = fy + Math.sin(rad) * FLIPPER_W;

  ctx.save();
  if (flipper.shy) {
    ctx.globalAlpha = 0.2 + Math.sin(Date.now() / 100) * 0.15;
  }

  ctx.strokeStyle = flipper.shy
    ? "#ef4444"
    : flipper.activated
      ? "#60a5fa"
      : "#475569";
  ctx.lineWidth = FLIPPER_H;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  // pivot dot
  ctx.fillStyle = flipper.shy ? "#ef444488" : "#60a5fa";
  ctx.beginPath();
  ctx.arc(fx, fy, 6, 0, Math.PI * 2);
  ctx.fill();

  // shy indicator
  if (flipper.shy) {
    ctx.font = "16px serif";
    ctx.textAlign = "center";
    ctx.globalAlpha = 1;
    ctx.fillText("🫣", fx, fy - 20);
  }

  ctx.restore();
}

function die() {
  running = false;
  const title =
    score < 100
      ? "The flippers were too shy."
      : score < 500
        ? "Not bad!"
        : "Flipper whisperer!";
  deadTitle.textContent = title;
  deadSub.textContent = `Score: ${score}`;
  deadOverlay.classList.add("show");
}

function updateHud() {
  scoreHud.textContent = score;
  ballsHud.textContent = balls;
  const isAnyShy = leftFlipper.shy || rightFlipper.shy;
  shyHud.textContent = isAnyShy ? "😳" : "😊";
}

// Event Listeners
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key))
    e.preventDefault();
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// mobile touch
const leftZone = document.createElement("div");
leftZone.style.cssText =
  "position:fixed;bottom:0;left:0;width:50%;height:30%;z-index:8;";
leftZone.addEventListener("touchstart", () => (keys["z"] = true), {
  passive: true,
});
leftZone.addEventListener("touchend", () => (keys["z"] = false), {
  passive: true,
});
document.body.appendChild(leftZone);

const rightZone = document.createElement("div");
rightZone.style.cssText =
  "position:fixed;bottom:0;right:0;width:50%;height:30%;z-index:8;";
rightZone.addEventListener("touchstart", () => (keys["/"] = true), {
  passive: true,
});
rightZone.addEventListener("touchend", () => (keys["/"] = false), {
  passive: true,
});
document.body.appendChild(rightZone);
