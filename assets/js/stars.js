const canvas = document.getElementById("stars") || document.getElementById("particles");

if (canvas) {
  const ctx = canvas.getContext("2d");

  let W, H;
  let stars = [];
  let t = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = [];
    const count = Math.min(140, Math.floor((W * H) / 8000));

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.3,
        speed: Math.random() * 0.16 + 0.03,
        opacity: Math.random() * 0.5 + 0.2,
        ts: Math.random() * 0.01 + 0.003,
        to: Math.random() * Math.PI * 2
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.016;

    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);

      const alpha = Math.max(0, s.opacity + Math.sin(t * s.ts * 60 + s.to) * 0.14);
      ctx.fillStyle = `rgba(180, 195, 255, ${alpha})`;
      ctx.fill();

      s.y -= s.speed;

      if (s.y < -5) {
        s.y = H + 5;
        s.x = Math.random() * W;
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => {
    resize();
    initStars();
  });

  resize();
  initStars();
  draw();
}
