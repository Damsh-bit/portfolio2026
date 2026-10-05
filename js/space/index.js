/**
 * =========================================================================
 * SPACE (Three.js layer) — entry point
 * =========================================================================
 * Loaded with a dynamic import from main.js, so the portfolio content never
 * depends on the CDN that serves Three.js: if WebGL or the network fails,
 * the site renders exactly the same, minus the 3D bodies.
 *
 * Layout:
 *   config.js              the bodies, their sections and sizes (pure data)
 *   core/                  engine (single renderer), assets, anchors, math
 *   bodies/                CelestialBody base + one module per body
 *   shaders/               GLSL: terrestrial planets, glows, noise
 *   effects/               black hole lensing, asteroid flybys
 *   interaction/           focus controller, pointer router, DOM markers
 *
 * Frame order (one rAF for the whole page — see modules/frame-loop.js):
 *   anchors -> focus -> bodies -> effects -> hover -> render -> markers
 *   -> publish screen positions for the 2D canvas, which draws right after.
 */

import { onFrame, stepFrames } from '../modules/frame-loop.js';
import { panOffset } from '../modules/space-pan.js';
import { spaceState } from '../modules/space-state.js';
import { portfolioData } from '../data/portfolio-data.js';
import { BODIES } from './config.js';
import { Engine } from './core/engine.js';
import { Anchors } from './core/anchors.js';
import { setMaxAnisotropy } from './core/assets.js';
import { referenceSize } from './core/math.js';
import { FocusController, isObserveMode } from './interaction/focus.js';
import { PointerRouter } from './interaction/pointer.js';
import { MarkerLayer } from './interaction/markers.js';
import { AsteroidField } from './effects/asteroids.js';
import { BlackHole } from './effects/black-hole.js';

export async function initSpace() {
  const canvas = document.getElementById('space-canvas');
  if (!canvas) return false;

  let engine;
  try {
    engine = new Engine(canvas);
  } catch (err) {
    console.warn('[space] WebGL unavailable, 3D layer disabled:', err);
    return false;
  }
  setMaxAnisotropy(engine.maxAnisotropy);

  // Body classes are tiny; their heavy assets load lazily (see below). A
  // body whose module fails to load is simply left out.
  const modules = await Promise.all(BODIES.map((cfg) => cfg.load().catch((err) => {
    console.warn(`[space] ${cfg.id} module failed:`, err);
    return null;
  })));
  const bodies = [];
  modules.forEach((mod, i) => {
    if (mod) bodies.push(new mod.default(engine, BODIES[i]));
  });
  if (!bodies.length) return false;
  spaceState.bodyIds = bodies.map((b) => b.id);

  const anchors = new Anchors();
  bodies.forEach((b) => anchors.track(b.config.sectionId));

  const focus = new FocusController(bodies);
  const pointer = new PointerRouter(bodies, focus);
  const markers = new MarkerLayer(document.getElementById('spaceMarkers'));
  const asteroids = new AsteroidField(engine);
  const blackHole = new BlackHole(engine, document.getElementById('bg-canvas'));

  // --- markers: Earth's surface hotspots + the small bodies' fact rings
  const earth = focus.byId('earth');
  if (earth) {
    markers.addHotspots(earth, portfolioData.earthHotspots || [], (h) => {
      window.dispatchEvent(new CustomEvent('open-earth-lightbox', { detail: h }));
    });
  }
  const facts = portfolioData.spaceFacts || {};
  bodies.forEach((b) => {
    if (!facts[b.id]) return;
    markers.addOrbitPoints(b, facts[b.id], (body) => {
      if (body.triggerEasterEgg) body.triggerEasterEgg();
      const card = body.cardEvent && body.cardEvent(portfolioData);
      if (card) window.dispatchEvent(new CustomEvent(card.event, { detail: card.detail }));
    });
  });

  let lastFocusedId = null;
  window.addEventListener('planet-focus-changed', (e) => {
    if (lastFocusedId) markers.collapse(lastFocusedId);
    lastFocusedId = e.detail ? e.detail.id : null;
  });

  // --- lazy asset loading: a body loads when its section gets close to
  // the viewport; Earth (hero) right away; everything once observe mode
  // is on, so the nav panel can jump anywhere without a wait.
  bodies[0].ensureLoaded();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        bodies.forEach((b) => {
          if (b.config.sectionId === entry.target.id) b.ensureLoaded();
        });
        io.unobserve(entry.target);
      });
    }, { rootMargin: '120% 0px 120% 0px' });
    bodies.forEach((b) => {
      const el = document.getElementById(b.config.sectionId);
      if (el) io.observe(el);
    });
  } else {
    bodies.forEach((b) => b.ensureLoaded());
  }
  const loadAll = () => bodies.forEach((b) => b.ensureLoaded());
  new MutationObserver(() => {
    if (isObserveMode()) loadAll();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // --- the frame
  const ctx = {
    width: 0,
    height: 0,
    reference: 0,
    anchors,
    pan: panOffset,
    focusId: null,
    reducedMotion: engine.reducedMotion
  };
  // Draw order: resting bodies, then the focused one on top of them (each
  // layer clears depth, so later = in front), then the effects.
  const layers = [];
  let onTop = null;

  onFrame((dt, t) => {
    const w = engine.width;
    const h = engine.height;
    ctx.width = w;
    ctx.height = h;
    ctx.reference = referenceSize(w, h);

    anchors.update(w, h);
    focus.update(dt);
    ctx.focusId = focus.current ? focus.current.id : null;

    for (let i = 0; i < bodies.length; i++) bodies[i].update(dt, t, ctx);
    asteroids.update(dt, t, ctx, focus.dim);
    blackHole.update(dt, t, ctx);

    pointer.update();

    // The focused body stays on top until it has flown back to rest.
    if (focus.current) onTop = focus.current;
    else if (onTop && onTop.focusMix < 0.02) onTop = null;
    layers.length = 0;
    let busy = false;
    for (let i = 0; i < bodies.length; i++) {
      if (bodies[i] !== onTop) layers.push(bodies[i]);
      busy = busy || bodies[i].isRenderable();
    }
    if (onTop) layers.push(onTop);
    layers.push(asteroids, blackHole);
    busy = busy || asteroids.isRenderable() || blackHole.isRenderable();
    engine.render(layers, dt, busy);

    markers.update(focus.current, w, h);

    // Publish for the 2D canvas (drawn right after this, same frame).
    spaceState.focus.id = ctx.focusId;
    spaceState.focus.dim = focus.dim;
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const s = spaceState.bodies[b.id] || (spaceState.bodies[b.id] = {});
      s.x = b.screen.x;
      s.y = b.screen.y;
      s.r = b.screen.r;
      s.ready = b.ready;
      s.focusMix = b.focusMix;
    }
  }, 10);

  spaceState.webgl = true;
  document.body.classList.add('has-space3d');

  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
  idle(() => blackHole.precompile());

  // Inspection handle for development only: open the site with ?debug3d.
  if (new URLSearchParams(window.location.search).has('debug3d')) {
    window.__space = { engine, bodies, focus, pointer, markers, asteroids, blackHole, spaceState, stepFrames };
  }
  return true;
}
