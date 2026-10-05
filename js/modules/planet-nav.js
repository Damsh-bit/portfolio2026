/**
 * =========================================================================
 * PLANET NAVIGATION PANEL
 * =========================================================================
 * Minimalist bottom control panel, observe mode only: cycles focus between
 * the six 3D bodies (one per page section, in scroll order — the list
 * comes straight from js/space/config.js) and exposes rotate/zoom buttons
 * for the focused one.
 *
 * Decoupled from the 3D layer: it only dispatches/listens to window
 * CustomEvents ('nav-focus-planet', 'nav-rotate', 'nav-zoom',
 * 'planet-focus-changed', 'planet-loading'), so it keeps working — and
 * stays hidden via CSS — if WebGL never comes up.
 */

import { BODIES } from '../space/config.js';

export function initPlanetNav() {
  const panel = document.getElementById('planetNav');
  if (!panel) return;

  const prevBtn = document.getElementById('planetNavPrev');
  const nextBtn = document.getElementById('planetNavNext');
  const nameEl = document.getElementById('planetNavName');
  const dotsEl = document.getElementById('planetNavDots');
  const extraEl = document.getElementById('planetNavExtra');

  const targets = BODIES.map(({ id, name, sectionId }) => ({ id, name, sectionId }));
  let selected = 0;
  let loadingId = null;

  const dotEls = targets.map((t, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'planet-nav-dot';
    dot.setAttribute('aria-label', t.name);
    dot.addEventListener('click', () => focusTarget(i));
    dotsEl.appendChild(dot);
    return dot;
  });

  function updateUI(focused) {
    const t = targets[selected];
    nameEl.textContent = loadingId === t.id ? `${t.name} · cargando…` : t.name;
    dotEls.forEach((d, i) => {
      d.classList.toggle('active', i === selected);
      d.setAttribute('aria-current', i === selected ? 'true' : 'false');
    });
    extraEl.classList.toggle('visible', !!focused);
  }
  updateUI(false);

  function focusTarget(i) {
    selected = ((i % targets.length) + targets.length) % targets.length;
    const t = targets[selected];
    updateUI(document.body.classList.contains('planet-focused'));

    // Every body holds its place on the page, so bring its section into
    // view first — the focus flight runs concurrently and converges on the
    // viewport center wherever the scroll lands.
    const sectionEl = document.getElementById(t.sectionId);
    if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    window.dispatchEvent(new CustomEvent('nav-focus-planet', { detail: { id: t.id } }));
  }

  prevBtn.addEventListener('click', () => focusTarget(selected - 1));
  nextBtn.addEventListener('click', () => focusTarget(selected + 1));

  const send = (name, dir) => () => window.dispatchEvent(new CustomEvent(name, { detail: { dir } }));
  document.getElementById('planetNavRotL').addEventListener('click', send('nav-rotate', -1));
  document.getElementById('planetNavRotR').addEventListener('click', send('nav-rotate', 1));
  document.getElementById('planetNavZoomOut').addEventListener('click', send('nav-zoom', -1));
  document.getElementById('planetNavZoomIn').addEventListener('click', send('nav-zoom', 1));

  window.addEventListener('planet-loading', (e) => {
    loadingId = e.detail ? e.detail.id : null;
    updateUI(document.body.classList.contains('planet-focused'));
  });

  // Keep the panel in sync when focus changes any other way — a direct
  // click on a planet, the back button, Escape.
  window.addEventListener('planet-focus-changed', (e) => {
    const d = e.detail;
    loadingId = null;
    if (d) {
      const idx = targets.findIndex((t) => t.id === d.id);
      if (idx >= 0) selected = idx;
    }
    updateUI(!!d);
  });
}
