function setupBadgeExplosion(badgeId, containerId, particleClass, animClass, count = 45, duration = 800) {
  const badge = document.getElementById(badgeId);
  const container = document.getElementById(containerId);

  if (!badge || !container) return;

  badge.addEventListener('click', (e) => {
    e.stopPropagation();

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('img');
      // badge.src gives the exact loaded image source
      particle.src = badge.src;
      particle.className = particleClass;

      const angle = Math.random() * 2 * Math.PI;
      const distance = 35 + Math.random() * 75;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const trot = (Math.random() - 0.5) * 720;

      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);
      particle.style.setProperty('--trot', `${trot}deg`);

      container.appendChild(particle);
      particle.classList.add(animClass);

      setTimeout(() => {
        particle.remove();
      }, duration);
    }
  });
}

function initBadges() {
  // Fish Badge
  setupBadgeExplosion('fishBadge', 'fishBadgeContainer', 'tiny-fish-particle', 'exploding-fish-massive');

  // Tawsif Badge
  setupBadgeExplosion('tawsifBadge', 'tawsifBadgeContainer', 'tiny-pfp-particle', 'exploding-pfp-massive');

  // Tyler Badge
  setupBadgeExplosion('tylerBadge', 'tylerBadgeContainer', 'tiny-pfp-particle', 'exploding-pfp-massive');
}

// Handles both early and late script loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBadges);
} else {
  initBadges();
}
