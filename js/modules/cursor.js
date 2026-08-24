/**
 * =========================================================================
 * CUSTOM MONOCHROME GLOW CURSOR MODULE
 * =========================================================================
 * Provides dynamic cursor tracking with inertia using GSAP quickTo.
 */

export function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor || 'ontouchstart' in window) return;

  const setX = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
  const setY = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });

  window.addEventListener('mousemove', (e) => {
    setX(e.clientX);
    setY(e.clientY);
  });

  // Attach hover state observers dynamically
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('a, .work-card, .tag, .close-btn, button, .m-link');
    if (target) {
      cursor.classList.add('grow');
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('a, .work-card, .tag, .close-btn, button, .m-link');
    if (target) {
      cursor.classList.remove('grow');
    }
  });
}
