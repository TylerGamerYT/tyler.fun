const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startOverlay = document.getElementById("startOverlay");
const deadOverlay = document.getElementById("deadOverlay");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const scoreHud = document.getElementById("scoreHud");
const livesHud = document.getElementById("livesHud");
const levelHud = document.getElementById("levelHud");

const deadTitle = document.getElementById("deadTitle");
const deadSub = document.getElementById("deadSub");

let ship, bullets, asteroids, score, lives, level, running, animId;
let keys = {};
let panicTimer = 0;
let panicMode = false;
let panicDir = 0;
let shootCooldown = 0;

const PANIC_MESSAGES = [
  "AAAAA",
  "NOPE",
  "TOO MANY",
  "im scared",
  "run!!",
  "WHY",
  "help",
  "not today",
  "ABORT",
];
let panicMsg = "";
let panicMsgTimer = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function startGame() {
  startOverlay.classList.remove("show");
  deadOverlay.classList.remove("show");
  score = 0;
  lives = 3;
  level = 1;
  ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 0,
    vy: 0,
    angle: 0,
    invincible: 0,
  };
  bullets = [];
  asteroids = [];
  spawnAsteroids(4 + level);
  running = true;
  if (animId) cancelAnimationFrame(animId);
  loop();
}

function spawnAsteroids(n) {
  for (let i = 0; i < n; i++) {
    let x, y;
    do {
      x = Math.random() * canvas.width;
      y = Math.random() * canvas.height;
    } while (dist(x, y, ship.x, ship.y) < 150);
    const size = 30 + Math.random() * 30;
    const speed = 1 + Math.random() * 1.5 + level * 0.3;
    const angle = Math.random() * Math.PI * 2;
    asteroids.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      hp: size > 45 ? 2 : 1,
    });
  }
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function loop() {
  if (!running) return;
  update();
  draw();
  animId = requestAnimationFrame(loop);
}

function update() {
  // Panic system
  panicTimer--;
  if (panicTimer <= 0) {
    panicMode = !panicMode;
    panicTimer = panicMode
      ? 60 + Math.random() * 90
      : 120 + Math.random() * 180;
    if (panicMode) {
      panicDir = (Math.random() - 0.5) * 0.2;
      panicMsg =
        PANIC_MESSAGES[Math.floor(Math.random() * PANIC_MESSAGES.length)];
      panicMsgTimer = 60;
    }
  }
  if (panicMsgTimer > 0) panicMsgTimer--;

  // Ship movement
  const thrust = 0.18;
  if (panicMode) {
    ship.angle += panicDir;
    ship.vx += Math.sin(ship.angle) * thrust * 1.5;
    ship.vy -= Math.cos(ship.angle) * thrust * 1.5;
  } else {
    if (keys["ArrowLeft"] || keys["a"]) ship.angle -= 0.06;
    if (keys["ArrowRight"] || keys["d"]) ship.angle += 0.06;
    if (keys["ArrowUp"] || keys["w"]) {
      ship.vx += Math.sin(ship.angle) * thrust;
      ship.vy -= Math.cos(ship.angle) * thrust;
    }
    if (keys["ArrowDown"] || keys["s"]) {
      ship.vx -= Math.sin(ship.angle) * thrust * 0.5;
      ship.vy += Math.cos(ship.angle) * thrust * 0.5;
    }
  }

  ship.vx *= 0.97;
  ship.vy *= 0.97;
  ship.x = (ship.x + ship.vx + canvas.width) % canvas.width;
  ship.y = (ship.y + ship.vy + canvas.height) % canvas.height;
  if (ship.invincible > 0) ship.invincible--;

  // Shooting - panic mode shoots randomly
  shootCooldown--;
  const wantShoot = keys[" "] || (panicMode && Math.random() < 0.04);
  if (wantShoot && shootCooldown <= 0) {
    const bulletAngle =
      ship.angle + (panicMode ? (Math.random() - 0.5) * 0.8 : 0);
    bullets.push({
      x: ship.x,
      y: ship.y,
      vx: Math.sin(bulletAngle) * 8,
      vy: -Math.cos(bulletAngle) * 8,
      life: 60,
    });
    shootCooldown = panicMode ? 8 : 15;
  }

  // Bullets
  bullets = bullets.filter((b) => {
    b.x = (b.x + b.vx + canvas.width) % canvas.width;
    b.y = (b.y + b.vy + canvas.height) % canvas.height;
    return --b.life > 0;
  });

  // Asteroids
  asteroids.forEach((a) => {
    a.x = (a.x + a.vx + canvas.width) % canvas.width;
    a.y = (a.y + a.vy + canvas.height) % canvas.height;
  });

  // Bullet vs Asteroid collision
  bullets = bullets.filter((b) => {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (dist(b.x, b.y, a.x, a.y) < a.size) {
        a.hp--;
        if (a.hp <= 0) {
          score += Math.floor((100 / a.size) * 30);
          if (a.size > 35) {
            for (let j = 0; j < 2; j++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 1.5 + Math.random() * 2;
              asteroids.push({
                x: a.x,
                y: a.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: a.size / 2,
                hp: 1,
              });
            }
          }
          asteroids.splice(i, 1);
        }
        updateHud();
        return false;
      }
    }
    return true;
  });

  // Ship vs Asteroid collision
  if (ship.invincible === 0) {
    for (const a of asteroids) {
      if (dist(ship.x, ship.y, a.x, a.y) < a.size + 12) {
        lives--;
        ship.invincible = 120;
        updateHud();
        if (lives <= 0) {
          die();
          return;
        }
        break;
      }
    }
  }

  if (asteroids.length === 0) {
    level++;
    spawnAsteroids(4 + level);
    updateHud();
  }
}

function draw() {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Asteroids
  asteroids.forEach((a) => {
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = a.size * (0.8 + Math.sin(i * 2.3) * 0.2);
      const x = a.x + Math.cos(angle) * r;
      const y = a.y + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  });

  // Bullets
  bullets.forEach((b) => {
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ship
  if (
    ship.invincible === 0 ||
    Math.floor(ship.invincible / 5) % 2 === 0
  ) {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.strokeStyle = panicMode ? "#f87171" : "#60a5fa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(10, 12);
    ctx.lineTo(0, 7);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.stroke();

    // Ship Emoji Face
    ctx.fillStyle = panicMode ? "#f87171" : "#60a5fa";
    ctx.font = "10px serif";
    ctx.textAlign = "center";
    ctx.fillText(panicMode ? "😰" : "🚀", 0, 3);
    ctx.restore();
  }

  // Panic Message
  if (panicMsgTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, panicMsgTimer / 20);
    ctx.font = `bold ${16 + Math.random() * 4}px Syne, sans-serif`;
    ctx.fillStyle = "#f87171";
    ctx.textAlign = "center";
    ctx.fillText(panicMsg, ship.x, ship.y - 30);
    ctx.restore();
  }
}

function die() {
  running = false;
  const titles =
    score < 100
      ? "The ship gave up."
      : score < 500
        ? "Decent panic run."
        : score < 1000
          ? "Surprisingly good!"
          : "The panic was worth it.";
  deadTitle.textContent = titles;
  deadSub.textContent = `Score: ${score} · Level: ${level}`;
  deadOverlay.classList.add("show");
}

function updateHud() {
  scoreHud.textContent = score;
  livesHud.textContent = lives;
  levelHud.textContent = level;
}

// Event Listeners
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

resize();
window.addEventListener("resize", resize);

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " ") e.preventDefault();
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});
