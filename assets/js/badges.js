// Generic Badge Explosion Helper
function setupBadgeExplosion(config) {
  const { badgeId, containerId, baseClass, animClass, fallbackSrc, count = 45, duration = 800 } = config;
  const badge = document.getElementById(badgeId);
  const container = document.getElementById(containerId);

  if (!badge || !container) return;

  badge.addEventListener('click', (e) => {
    e.stopPropagation();

    // Use current badge image src, or fall back to the exact icon file path
    const particleSrc = badge.getAttribute('src') || fallbackSrc;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('img');
      particle.src = particleSrc;
      particle.className = baseClass;

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

// Auto-initialize all badge triggers when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Fish Badge
  setupBadgeExplosion({
    badgeId: 'fishBadge',
    containerId: 'fishBadgeContainer',
    baseClass: 'tiny-fish-particle',
    animClass: 'exploding-fish-massive',
    fallbackSrc: '/assets/icons/fish-badge.png'
  });

  // Tawsif Badge
  setupBadgeExplosion({
    badgeId: 'tawsifBadge',
    containerId: 'tawsifBadgeContainer',
    baseClass: 'tiny-pfp-particle',
    animClass: 'exploding-pfp-massive',
    fallbackSrc: '/assets/icons/tawsif-badge.png'
  });

  // Tyler Badge
  setupBadgeExplosion({
    badgeId: 'tylerBadge',
    containerId: 'tylerBadgeContainer',
    baseClass: 'tiny-pfp-particle',
    animClass: 'exploding-pfp-massive',
    fallbackSrc: '/assets/icons/tylerpfp.png'
  });
});
