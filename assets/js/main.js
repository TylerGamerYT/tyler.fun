// Preview & Filtering Logic
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.search.includes("preview")) {
    const gamesSec = document.getElementById("gamesSection");
    if (gamesSec) gamesSec.classList.add("visible");
  }

  // Announcement Banner Close Logic
  const banner = document.getElementById('announcement-banner');
  const closeBtn = document.getElementById('close-banner');

  if (closeBtn && banner) {
    closeBtn.addEventListener('click', () => {
      banner.style.display = 'none';
    });
  }
});

function filterGamesAndUsers(query) {
  const q = query.toLowerCase().trim();
  const cleanQ = q.startsWith('@') ? q.slice(1) : q;

  const cards = document.querySelectorAll(".game-card");
  const usersSection = document.getElementById("usersSection");

  let visibleGamesCount = 0;
  let visibleUsersCount = 0;

  cards.forEach((card) => {
    const isUser = card.classList.contains("user-card");
    const title = card.querySelector(".game-title")?.textContent.toLowerCase() || "";
    const desc = card.querySelector(".game-desc")?.textContent.toLowerCase() || "";
    const match = !cleanQ || title.includes(cleanQ) || desc.includes(cleanQ);

    if (isUser) {
      const showUser = q.length > 0 && match;
      card.style.display = showUser ? "" : "none";
      if (showUser) visibleUsersCount++;
    } else {
      card.style.display = match ? "" : "none";
      if (match) visibleGamesCount++;
    }
  });

  if (usersSection) {
    usersSection.style.display = visibleUsersCount > 0 ? "block" : "none";
  }

  const totalVisible = visibleGamesCount + visibleUsersCount;
  const noResultsEl = document.getElementById("noResults");
  if (noResultsEl) {
    noResultsEl.style.display = q && totalVisible === 0 ? "block" : "none";
  }

  document.querySelectorAll(".games-section").forEach((sec) => {
    const anyVisible = [...sec.querySelectorAll(".game-card")].some((c) => c.style.display !== "none");
    sec.style.opacity = anyVisible ? "1" : "0.3";
  });
}

// Particle Background Engine
const canvas = document.getElementById("particles");
if (canvas) {
  const ctx = canvas.getContext("2d");

  let W;
  let H;
  let stars = [];

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
        r: Math.random() * 1.2 + 0.3,
        speed: Math.random() * 0.15 + 0.03,
        opacity: Math.random() * 0.5 + 0.1,
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
      const alpha = s.opacity + Math.sin(t * s.twinkleSpeed * 60 + s.twinkleOffset) * 0.15;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(148, 197, 255, ${Math.max(0, alpha)})`;
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
}
