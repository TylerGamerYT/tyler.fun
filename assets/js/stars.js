const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");

let width;
let height;
let stars = [];

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;

  stars = Array.from(
    { length: Math.min(140, Math.floor(width / 9)) },
    () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.18 + 0.03,
      opacity: Math.random() * 0.7 + 0.2
    })
  );
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  for (const star of stars) {
    star.y -= star.speed;

    if (star.y < -5) {
      star.y = height + 5;
      star.x = Math.random() * width;
    }

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 195, 255, ${star.opacity})`;
    ctx.fill();
  }

  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);

resize();
animate();
