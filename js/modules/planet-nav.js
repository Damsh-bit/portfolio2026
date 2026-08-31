/**
 * =========================================================================
 * PLANET NAVIGATION PANEL
 * =========================================================================
 * Minimalist bottom control panel, observe mode only: cycles focus between
 * every focal body on the site — the 2 decorative 2D planets driven by
 * universe-bg.js and the navigable 3D Earth/Saturn driven by space-scene.js
 * and space-scene-saturn.js — and exposes rotate/zoom controls for the 3D
 * ones. Fully decoupled from all of them: it only ever dispatches/listens to
 * window CustomEvents, the same loosely-coupled pattern those modules
 * already use for their own cross-module signals (e.g. 'open-star-lightbox').
 */

// Ordered to match the page's own scroll order — one body per section, each
// anchored to that section's own box (see universe-bg.js / space-scene.js /
// space-scene-saturn.js / space-scene-coruscant.js): Tierra in hero,
// Saturno in work, Coruscant in experience, then the 3 remaining decorative
// 2D bodies each own one more section going down the page.
const TARGETS = [
  { system: '3d', name: 'Tierra', sectionId: 'hero' },
  { system: 'saturn', name: 'Gigante Gaseoso', sectionId: 'work' },
  { system: '2d', index: 0, name: 'Alfa Muscae', sectionId: 'industries' },
  { system: 'coruscant', name: 'Coruscant', sectionId: 'experience' },
  { system: '2d', index: 1, name: 'El Lucero', sectionId: 'about' },
  { system: '2d', index: 2, name: 'TRAPPIST-1e', sectionId: 'contact' }
];

export function initPlanetNav() {
  const panel = document.getElementById('planetNav');
  if (!panel) return;

  const prevBtn = document.getElementById('planetNavPrev');
  const nextBtn = document.getElementById('planetNavNext');
  const nameEl = document.getElementById('planetNavName');
  const dotsEl = document.getElementById('planetNavDots');
  const extraEl = document.getElementById('planetNavExtra');
  const rotL = document.getElementById('planetNavRotL');
  const rotR = document.getElementById('planetNavRotR');
  const zoomOut = document.getElementById('planetNavZoomOut');
  const zoomIn = document.getElementById('planetNavZoomIn');

  let selected = 0;

  const dotEls = TARGETS.map((t, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'planet-nav-dot';
    dot.setAttribute('aria-label', t.name);
    dot.addEventListener('click', () => focusTarget(i));
    dotsEl.appendChild(dot);
    return dot;
  });

  function updateUI() {
    const t = TARGETS[selected];
    nameEl.textContent = t.name;
    dotEls.forEach((d, i) => d.classList.toggle('active', i === selected));
    extraEl.classList.toggle('visible', t.system === '3d' || t.system === 'saturn' || t.system === 'coruscant');
  }
  updateUI();

  function focusTarget(i) {
    selected = ((i % TARGETS.length) + TARGETS.length) % TARGETS.length;
    updateUI();
    const t = TARGETS[selected];

    // Every body now holds its place on the page instead of floating fixed
    // on screen, so bring its section into view first — the focus tween
    // below (camera dolly + un-shift to center) runs concurrently and
    // converges on center regardless of where the scroll lands.
    const sectionEl = t.sectionId ? document.getElementById(t.sectionId) : null;
    if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Exit whatever's currently focused first — both modules guard their
    // focus-entry against "something else is already focused", so this
    // has to land before the follow-up focus request, not after.
    window.dispatchEvent(new CustomEvent('nav-exit-focus'));
    window.dispatchEvent(new CustomEvent('nav-focus-planet', { detail: t }));
  }

  prevBtn.addEventListener('click', () => focusTarget(selected - 1));
  nextBtn.addEventListener('click', () => focusTarget(selected + 1));

  rotL.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('nav-rotate', { detail: { dir: -1 } }));
  });
  rotR.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('nav-rotate', { detail: { dir: 1 } }));
  });
  zoomOut.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('nav-zoom', { detail: { dir: -1 } }));
  });
  zoomIn.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('nav-zoom', { detail: { dir: 1 } }));
  });

  // Keep the panel's own selection in sync when focus changes through any
  // other route — a direct click on a planet, the back button, Escape.
  window.addEventListener('planet-focus-changed', (e) => {
    const d = e.detail;
    if (!d) return;
    const idx = TARGETS.findIndex((t) => t.system === d.system && (t.index === undefined || t.index === d.index));
    if (idx >= 0 && idx !== selected) {
      selected = idx;
      updateUI();
    }
  });
}
