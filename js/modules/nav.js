/**
 * =========================================================================
 * MOBILE NAVIGATION CONTROLLER
 * =========================================================================
 * Owns the open/close state of the mobile slide-in nav panel.
 */

export function initNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  const scrim = document.getElementById('navScrim');
  if (!toggle || !nav) return;

  function open() {
    nav.classList.add('open');
    if (scrim) scrim.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    nav.classList.remove('open');
    if (scrim) scrim.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    if (nav.classList.contains('open')) close();
    else open();
  }

  toggle.addEventListener('click', toggleMenu);
  if (scrim) scrim.addEventListener('click', close);

  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) close();
  });
}
