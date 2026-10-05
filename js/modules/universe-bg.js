/**
 * =========================================================================
 * UNIVERSE CANVAS (2D) — the deep-space backdrop
 * =========================================================================
 * Twinkling multi-layer starfield, cursor-reactive stardust, per-section
 * constellations, shooting stars and the black hole's trigger/timing.
 *
 * Every focal body (Earth, Saturn, Alfa Muscae, Coruscant, El Lucero,
 * TRAPPIST-1e) and the asteroid flybys are real 3D now (js/space/) and sit
 * on the WebGL canvas above this one. This layer reads their live screen
 * positions from spaceState — Musca's stick figure is drawn around Alfa
 * Muscae wherever the 3D star is — and fades itself while a body is
 * focused.
 *
 * Runs on the shared frame loop (modules/frame-loop.js) right after the 3D
 * layer, in real seconds, so it moves at the same speed on any monitor.
 */

import { panOffset } from './space-pan.js';
import { onFrame, ease, decay } from './frame-loop.js';
import { spaceState, claimTooltip } from './space-state.js';

export function initUniverseBg() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  let width = 0;
  let height = 0;
  let stars = [];
  let stardust = [];
  let burstParticles = [];
  let shootingStars = [];
  const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };
  let parallaxX = 0;
  let parallaxY = 0;
  let cancerBounds = null;

  // Scroll-driven starfield drift: scrolling the page pans the deep-space
  // star layer, as if flying past it toward whatever section is next.
  let scrollTarget = window.scrollY || 0;
  let scrollEased = scrollTarget;
  let shootingStarTimer = 4 + Math.random() * 5; // seconds

  // "agujero negro" keyword easter egg
  let blackHole = null;
  let keyBuffer = '';

  function isObserveMode() {
    return document.body.classList.contains('ui-hidden');
  }

  // Responsive setup. On phones the URL bar sliding in/out fires resize
  // with a slightly different height while scrolling — keep the field
  // instead of re-randomizing every star on each of those.
  function resize(force) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!force && isTouch && w === width && h <= height && height - h < 160) return;
    const widthChanged = w !== width;
    width = canvas.width = w;
    height = canvas.height = h;

    if (force || widthChanged || stars.length === 0) {
      createStars();
      createStardust();
    } else {
      createStars();
    }
    burstParticles = [];
    shootingStars = [];
  }

  // Create multi-layer starfield
  function createStars() {
    stars = [];
    const count = Math.floor((width * height) / 3800);

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.3,
        baseAlpha: Math.random() * 0.7 + 0.15,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
        parallax: Math.random() * 0.6 + 0.15,
        color: Math.random() > 0.45 ? 'rgba(245, 245, 247, ' : 'rgba(180, 180, 190, '
      });
    }
  }

  // Create floating stardust particles
  function createStardust() {
    stardust = [];
    const count = Math.floor(Math.min(width, height) / 18);

    for (let i = 0; i < count; i++) {
      stardust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 12, // px/s
        vy: (Math.random() - 0.5) * 12,
        radius: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? '#d4d4d8' : '#a1a1aa'
      });
    }
  }

  // ------------------------------------------------------------------
  // Musca constellation, anchored on Alfa Muscae (the 3D star in the
  // "industries" section). Companion star offsets (px) reproduce the
  // traditional Musca stick figure: a β–δ–γ–α kite with an ε–λ tail.
  // ------------------------------------------------------------------

  const MUSCA_STARS = [
    { name: 'β', dx: -45, dy: -50, mag: 3.05 },
    { name: 'ε', dx: 78, dy: -62, mag: 4.11 },
    { name: 'λ', dx: 172, dy: -102, mag: 3.67 },
    { name: 'γ', dx: 18, dy: 148, mag: 3.84 },
    { name: 'δ', dx: -92, dy: 158, mag: 3.62 }
  ];
  const MUSCA_LINES = [
    ['α', 'β'], ['β', 'δ'], ['δ', 'γ'], ['γ', 'α'], ['α', 'ε'], ['ε', 'λ']
  ];
  const MUSCA_FALLBACK = { sectionId: 'industries', relX: 0.88, relY: 0.09, radius: 30 };
  const muscaSection = document.getElementById(MUSCA_FALLBACK.sectionId);

  // Where Alfa Muscae is right now: the 3D star's live position, or its
  // section anchor if the 3D layer isn't running.
  function getMuscaAnchor() {
    const live = spaceState.bodies['alfa-muscae'];
    if (live && spaceState.webgl) return { x: live.x, y: live.y, r: Math.max(8, live.r) };
    const box = muscaSection ? muscaSection.getBoundingClientRect() : { left: 0, top: 0, width, height };
    return {
      x: box.left + box.width * MUSCA_FALLBACK.relX - panOffset.x,
      y: box.top + box.height * MUSCA_FALLBACK.relY - panOffset.y,
      r: MUSCA_FALLBACK.radius
    };
  }

  // β Muscae is the nearest companion to Alpha and — fittingly — a real
  // binary star system, so it shares Alpha's attention-grabbing twinkle.
  function drawMuscaConstellation(p, time) {
    if (p.y < -300 || p.y > height + 300) return;
    const nodes = { 'α': { dx: 0, dy: 0 } };
    MUSCA_STARS.forEach((s) => { nodes[s.name] = s; });

    ctx.save();
    ctx.strokeStyle = 'rgba(212, 212, 216, 0.22)';
    ctx.lineWidth = 1;
    for (let i = 0; i < MUSCA_LINES.length; i++) {
      const [a, b] = MUSCA_LINES[i];
      const na = nodes[a];
      const nb = nodes[b];
      ctx.beginPath();
      ctx.moveTo(p.x + na.dx, p.y + na.dy);
      ctx.lineTo(p.x + nb.dx, p.y + nb.dy);
      ctx.stroke();
    }

    const twinkle = 0.5 + 0.5 * Math.sin(time * 0.5);

    ctx.font = '10px "IBM Plex Mono", monospace';
    for (let i = 0; i < MUSCA_STARS.length; i++) {
      const s = MUSCA_STARS[i];
      let r = Math.max(0.7, 2.6 - s.mag * 0.35);
      let alpha = Math.max(0.35, 1 - s.mag * 0.13);
      const sx = p.x + s.dx;
      const sy = p.y + s.dy;

      if (s.name === 'β') {
        r *= 1 + twinkle * 0.7;
        alpha = Math.min(1, alpha + twinkle * 0.35);

        const glowR = r * 6;
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        glow.addColorStop(0, `rgba(245, 245, 247, ${0.14 + twinkle * 0.22})`);
        glow.addColorStop(1, 'rgba(245, 245, 247, 0)');
        ctx.beginPath();
        ctx.fillStyle = glow;
        ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.fillStyle = `rgba(245, 245, 247, ${alpha})`;
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(212, 212, 216, 0.4)';
      ctx.fillText(s.name, sx + r + 4, sy + 3);
    }

    ctx.fillStyle = 'rgba(212, 212, 216, 0.4)';
    ctx.fillText('α', p.x + p.r + 6, p.y + 4);
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // Cancer constellation — free-floating decoration, only drawn in
  // observe mode. Every star gets its own gentle twinkle (rather than
  // one standout star like Musca) so the whole shape reads as alive.
  // Anchored on δ Cancri; screen-space bounds are recomputed each frame
  // for the hover tooltip hit-test.
  // ------------------------------------------------------------------

  const CANCER_ANCHOR = { relX: 0.42, relY: 0.16 };
  const CANCER_STARS = [
    { name: 'δ', dx: 0, dy: 0, mag: 3.94 },
    { name: 'γ', dx: -71, dy: -127, mag: 4.66 },
    { name: 'η', dx: -34, dy: -53, mag: 5.33 },
    { name: 'θ', dx: -68, dy: 105, mag: 5.33 },
    { name: 'β', dx: 100, dy: 101, mag: 3.53 }
  ];
  const CANCER_LINES = [
    ['γ', 'η'], ['η', 'δ'], ['δ', 'θ'], ['δ', 'β']
  ];

  function drawCancerConstellation(time) {
    const anchorX = CANCER_ANCHOR.relX * width - panOffset.x;
    const anchorY = CANCER_ANCHOR.relY * height - panOffset.y;
    const nodes = {};
    CANCER_STARS.forEach((s) => { nodes[s.name] = s; });

    ctx.save();
    ctx.strokeStyle = 'rgba(212, 212, 216, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANCER_LINES.length; i++) {
      const [a, b] = CANCER_LINES[i];
      const na = nodes[a];
      const nb = nodes[b];
      ctx.beginPath();
      ctx.moveTo(anchorX + na.dx, anchorY + na.dy);
      ctx.lineTo(anchorX + nb.dx, anchorY + nb.dy);
      ctx.stroke();
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (let i = 0; i < CANCER_STARS.length; i++) {
      const s = CANCER_STARS[i];
      const sx = anchorX + s.dx;
      const sy = anchorY + s.dy;
      minX = Math.min(minX, sx);
      minY = Math.min(minY, sy);
      maxX = Math.max(maxX, sx);
      maxY = Math.max(maxY, sy);

      const twinkle = 0.5 + 0.5 * Math.sin(time * 0.6 + i * 1.7);
      const r = Math.max(0.8, 2.4 - s.mag * 0.3) * (1 + twinkle * 0.35);
      const alpha = Math.max(0.4, 1 - s.mag * 0.12) * (0.75 + twinkle * 0.25);

      const glowR = r * 4;
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
      glow.addColorStop(0, `rgba(245, 245, 247, ${0.1 + twinkle * 0.14})`);
      glow.addColorStop(1, 'rgba(245, 245, 247, 0)');
      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `rgba(245, 245, 247, ${alpha})`;
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    const pad = 22;
    cancerBounds = {
      x: minX - pad,
      y: minY - pad,
      w: (maxX - minX) + pad * 2,
      h: (maxY - minY) + pad * 2
    };
  }

  // ------------------------------------------------------------------
  // Section constellations — one per page section, cross-fading in and
  // out as it scrolls through view (each tracks its own eased alpha).
  // Shapes are simplified real asterisms, same spirit as Musca/Cancer
  // above but picked to echo what each section is about.
  // ------------------------------------------------------------------

  const SECTION_CONSTELLATIONS = [
    {
      // Orion — the Hunter. Bold, unmistakable: opens the page.
      id: 'hero',
      anchor: { relX: 0.18, relY: 0.32 },
      alpha: 0,
      target: 0,
      stars: [
        { name: 'Alnilam', dx: 0, dy: 0, mag: 1.69 },
        { name: 'Alnitak', dx: 34, dy: 6, mag: 1.88 },
        { name: 'Mintaka', dx: -34, dy: -6, mag: 2.23 },
        { name: 'Betelgeuse', dx: -70, dy: -110, mag: 0.42 },
        { name: 'Bellatrix', dx: 60, dy: -100, mag: 1.64 },
        { name: 'Saiph', dx: 55, dy: 130, mag: 2.09 },
        { name: 'Rigel', dx: -75, dy: 140, mag: 0.13 }
      ],
      lines: [
        ['Mintaka', 'Alnilam'], ['Alnilam', 'Alnitak'],
        ['Betelgeuse', 'Mintaka'], ['Bellatrix', 'Alnitak'],
        ['Rigel', 'Mintaka'], ['Saiph', 'Alnitak']
      ]
    },
    {
      // Lyra — the Harp, hanging off brilliant Vega: craft and work.
      id: 'work',
      anchor: { relX: 0.58, relY: 0.32 },
      alpha: 0,
      target: 0,
      stars: [
        { name: 'Vega', dx: 0, dy: 0, mag: 0.03 },
        { name: 'ζ¹', dx: 25, dy: 30, mag: 4.36 },
        { name: 'Sheliak', dx: 20, dy: 85, mag: 3.52 },
        { name: 'Sulafat', dx: -25, dy: 100, mag: 3.24 },
        { name: 'δ', dx: -35, dy: 45, mag: 4.3 }
      ],
      lines: [
        ['Vega', 'ζ¹'], ['ζ¹', 'Sheliak'], ['Sheliak', 'Sulafat'],
        ['Sulafat', 'δ'], ['δ', 'ζ¹']
      ]
    },
    {
      // Corona Borealis — the Northern Crown: a shallow arc of many facets.
      id: 'industries',
      anchor: { relX: 0.14, relY: 0.4 },
      alpha: 0,
      target: 0,
      stars: [
        { name: 'ε', dx: 0, dy: 0, mag: 4.15 },
        { name: 'δ', dx: 34, dy: -18, mag: 4.63 },
        { name: 'Alphecca', dx: 66, dy: -28, mag: 2.23 },
        { name: 'β', dx: 98, dy: -18, mag: 3.68 },
        { name: 'θ', dx: 128, dy: 6, mag: 4.14 },
        { name: 'γ', dx: 150, dy: 34, mag: 3.84 }
      ],
      lines: [
        ['ε', 'δ'], ['δ', 'Alphecca'], ['Alphecca', 'β'], ['β', 'θ'], ['θ', 'γ']
      ]
    },
    {
      // Ursa Major's Big Dipper — a guide, fitting a career path.
      id: 'experience',
      anchor: { relX: 0.6, relY: 0.16 },
      alpha: 0,
      target: 0,
      stars: [
        { name: 'Dubhe', dx: 0, dy: 0, mag: 1.79 },
        { name: 'Merak', dx: 7, dy: 38, mag: 2.37 },
        { name: 'Phecda', dx: 49, dy: 48, mag: 2.44 },
        { name: 'Megrez', dx: 55, dy: 7, mag: 3.31 },
        { name: 'Alioth', dx: 91, dy: -3, mag: 1.77 },
        { name: 'Mizar', dx: 125, dy: -15, mag: 2.23 },
        { name: 'Alkaid', dx: 157, dy: -35, mag: 1.86 }
      ],
      lines: [
        ['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'], ['Megrez', 'Dubhe'],
        ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid']
      ]
    },
    {
      // Cassiopeia — the queen, the site's "about me" W.
      id: 'about',
      anchor: { relX: 0.28, relY: 0.16 },
      alpha: 0,
      target: 0,
      stars: [
        { name: 'ε', dx: -110, dy: 40, mag: 3.35 },
        { name: 'δ', dx: -55, dy: -10, mag: 2.68 },
        { name: 'γ', dx: 0, dy: 0, mag: 2.47 },
        { name: 'α', dx: 60, dy: 25, mag: 2.24 },
        { name: 'β', dx: 115, dy: -15, mag: 2.27 }
      ],
      lines: [
        ['ε', 'δ'], ['δ', 'γ'], ['γ', 'α'], ['α', 'β']
      ]
    },
    {
      // Aquarius — the water-bearer: "reaching out" for contact.
      id: 'contact',
      anchor: { relX: 0.82, relY: 0.58 },
      alpha: 0,
      target: 0,
      stars: [
        { name: 'η', dx: 0, dy: 0, mag: 4.02 },
        { name: 'γ', dx: -42, dy: -28, mag: 3.84 },
        { name: 'π', dx: 8, dy: -46, mag: 4.66 },
        { name: 'ζ', dx: 48, dy: -12, mag: 3.65 },
        { name: 'δ', dx: 70, dy: 68, mag: 3.27 },
        { name: 'τ²', dx: 44, dy: 128, mag: 4.05 }
      ],
      lines: [
        ['γ', 'η'], ['η', 'π'], ['η', 'ζ'], ['ζ', 'δ'], ['δ', 'τ²']
      ]
    }
  ];

  function drawSectionConstellation(c, alpha, time) {
    if (alpha <= 0.01) return;

    const anchorX = c.anchor.relX * width - panOffset.x;
    const anchorY = c.anchor.relY * height - panOffset.y;
    const nodes = {};
    c.stars.forEach((s) => { nodes[s.name] = s; });

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(212, 212, 216, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < c.lines.length; i++) {
      const [a, b] = c.lines[i];
      const na = nodes[a];
      const nb = nodes[b];
      ctx.beginPath();
      ctx.moveTo(anchorX + na.dx, anchorY + na.dy);
      ctx.lineTo(anchorX + nb.dx, anchorY + nb.dy);
      ctx.stroke();
    }

    for (let i = 0; i < c.stars.length; i++) {
      const s = c.stars[i];
      const sx = anchorX + s.dx;
      const sy = anchorY + s.dy;

      const twinkle = 0.5 + 0.5 * Math.sin(time * 0.55 + i * 1.4);
      const r = Math.max(0.8, 2.5 - s.mag * 0.32) * (1 + twinkle * 0.3);
      const starAlpha = Math.max(0.4, 1 - s.mag * 0.12) * (0.75 + twinkle * 0.25);

      const glowR = r * 4;
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
      glow.addColorStop(0, `rgba(245, 245, 247, ${0.1 + twinkle * 0.14})`);
      glow.addColorStop(1, 'rgba(245, 245, 247, 0)');
      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `rgba(245, 245, 247, ${starAlpha})`;
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ------------------------------------------------------------------
  // Shooting stars: quick fading streaks crossing the whole site
  // ------------------------------------------------------------------

  function spawnShootingStar() {
    const dir = Math.random() > 0.5 ? 1 : -1;
    const angle = Math.PI * 0.22 + Math.random() * 0.2; // shallow downward diagonal
    const speed = 96 + Math.random() * 66; // px/s

    shootingStars.push({
      x: Math.random() * width * 1.2 - width * 0.1,
      y: -30 - Math.random() * 60,
      vx: Math.cos(angle) * speed * dir,
      vy: Math.sin(angle) * speed,
      length: 220 + Math.random() * 140,
      life: 0,
      maxLife: 5.6 + Math.random() * 2.4 // s
    });
  }

  function updateShootingStars(dt) {
    if (!reducedMotion) {
      shootingStarTimer -= dt;
      if (shootingStarTimer <= 0) {
        spawnShootingStar();
        shootingStarTimer = 4 + Math.random() * 5;
      }
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life += dt;

      if (s.life >= s.maxLife || s.x < -150 || s.x > width + 150 || s.y > height + 150) {
        shootingStars.splice(i, 1);
      }
    }
  }

  function drawShootingStars() {
    for (let i = 0; i < shootingStars.length; i++) {
      const s = shootingStars[i];
      const mag = Math.hypot(s.vx, s.vy) || 1;
      const ux = s.vx / mag;
      const uy = s.vy / mag;
      const tailX = s.x - ux * s.length;
      const tailY = s.y - uy * s.length;

      let alpha = 1;
      if (s.life < 0.23) alpha = s.life / 0.23;
      else if (s.life > s.maxLife - 0.58) alpha = Math.max(0, (s.maxLife - s.life) / 0.58);

      // Soft outer glow trail
      const glowGrad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      glowGrad.addColorStop(0, `rgba(230, 235, 255, ${0.35 * alpha})`);
      glowGrad.addColorStop(0.5, `rgba(200, 210, 255, ${0.14 * alpha})`);
      glowGrad.addColorStop(1, 'rgba(200, 210, 255, 0)');

      ctx.beginPath();
      ctx.strokeStyle = glowGrad;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // Bright core trail
      const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * alpha})`);
      grad.addColorStop(0.4, `rgba(245, 245, 247, ${0.55 * alpha})`);
      grad.addColorStop(1, 'rgba(245, 245, 247, 0)');

      ctx.beginPath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ------------------------------------------------------------------
  // Black hole easter egg: typing "agujero" anywhere on the page, or
  // clicking #blackHoleBtn (only visible in observe mode), spawns a
  // black hole that pulls in nearby stardust and stays put — no timer.
  // It only goes away when the same trigger is used again to collapse
  // it, or (in observe mode) it's clicked directly.
  //
  // This module owns the state machine; the visual is the WebGL lensing
  // shader in js/space/effects/black-hole.js, fed through spaceState.
  // ------------------------------------------------------------------

  const BLACK_HOLE_RADIUS = 85;
  const blackHoleBtn = document.getElementById('blackHoleBtn');

  function syncBlackHoleBtn() {
    if (!blackHoleBtn) return;
    const active = !!blackHole;
    blackHoleBtn.classList.toggle('is-active', active);
    blackHoleBtn.setAttribute('aria-pressed', String(active));
    blackHoleBtn.setAttribute('aria-label', active ? 'Colapsar agujero negro' : 'Invocar agujero negro');
  }

  function spawnBlackHole() {
    if (blackHole) return;
    const margin = 180;
    blackHole = {
      x: margin + Math.random() * Math.max(1, width - margin * 2),
      y: margin + Math.random() * Math.max(1, height - margin * 2),
      phase: 'forming',
      t: 0,
      ringAngle: 0,
      formDuration: reducedMotion ? 0.33 : 0.67, // s
      collapseDuration: reducedMotion ? 0.2 : 0.43
    };
    syncBlackHoleBtn();
  }

  function collapseBlackHole() {
    if (!blackHole || blackHole.phase === 'collapsing') return;
    blackHole.phase = 'collapsing';
    blackHole.t = 0;
  }

  function toggleBlackHole() {
    if (blackHole) collapseBlackHole();
    else spawnBlackHole();
  }

  function spawnBlackHoleFlash(x, y) {
    const rmFactor = reducedMotion ? 0.35 : 1;
    const count = Math.max(10, Math.round(40 * rmFactor));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 270; // px/s
      burstParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 1.8,
        alpha: 1,
        color: Math.random() > 0.5 ? '#ffffff' : '#e4e4e7'
      });
    }
  }

  // Hit-test the black hole against a screen point (observe mode only)
  function isPointOnBlackHole(mx, my) {
    if (!blackHole || blackHole.phase !== 'active') return false;
    return Math.hypot(mx - blackHole.x, my - blackHole.y) <= BLACK_HOLE_RADIUS * 1.3;
  }

  function updateBlackHole(dt) {
    const bh = blackHole;
    if (!bh) {
      spaceState.blackHole = null;
      return;
    }

    bh.t += dt;
    bh.ringAngle += 3 * dt;

    let radius = BLACK_HOLE_RADIUS;
    let ringAlpha = 1;

    if (bh.phase === 'forming') {
      const p = Math.min(1, bh.t / bh.formDuration);
      const eased = 1 - Math.pow(1 - p, 3);
      radius = BLACK_HOLE_RADIUS * eased;
      ringAlpha = eased;
      if (p >= 1) { bh.phase = 'active'; bh.t = 0; }
    } else if (bh.phase === 'active') {
      const pullRadius = BLACK_HOLE_RADIUS * 4;
      for (let i = 0; i < stardust.length; i++) {
        const sd = stardust[i];
        const dx = bh.x - sd.x;
        const dy = bh.y - sd.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < pullRadius) {
          const force = (1 - dist / pullRadius) * 36 * dt; // px
          sd.x += (dx / dist) * force;
          sd.y += (dy / dist) * force;
        }
      }
    } else {
      const p = Math.min(1, bh.t / bh.collapseDuration);
      radius = BLACK_HOLE_RADIUS * (1 - p * p);
      ringAlpha = 1 - p;
      if (p >= 1) {
        spawnBlackHoleFlash(bh.x, bh.y);
        blackHole = null;
        syncBlackHoleBtn();
        spaceState.blackHole = null;
        return;
      }
    }

    const state = spaceState.blackHole || (spaceState.blackHole = {});
    state.x = bh.x;
    state.y = bh.y;
    state.radius = radius;
    state.ringAlpha = ringAlpha;
    state.angle = bh.ringAngle;
  }

  window.addEventListener('keydown', (e) => {
    if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;
    keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-12);
    if (keyBuffer.includes('agujero')) {
      toggleBlackHole();
      keyBuffer = '';
    }
  });

  if (blackHoleBtn) {
    blackHoleBtn.addEventListener('click', toggleBlackHole);
  }

  // In observe mode (nothing focused) the black hole itself is clickable
  // to collapse it.
  window.addEventListener('click', (e) => {
    if (!isObserveMode() || document.body.classList.contains('planet-focused')) return;
    if (isPointOnBlackHole(e.clientX, e.clientY)) collapseBlackHole();
  });

  // Hover tooltip (black hole, Cancer): only meaningful in observe mode.
  // The 3D bodies claim the same tooltip for their names and take
  // precedence (see space-state.js).
  function updateHoverState(mx, my) {
    let hoverName = null;

    if (isObserveMode() && !document.body.classList.contains('planet-focused')) {
      if (isPointOnBlackHole(mx, my)) {
        hoverName = 'Agujero negro — clic para colapsar';
      } else if (cancerBounds &&
        mx >= cancerBounds.x && mx <= cancerBounds.x + cancerBounds.w &&
        my >= cancerBounds.y && my <= cancerBounds.y + cancerBounds.h) {
        hoverName = 'Constelación de Cáncer';
      }
    }

    claimTooltip('canvas2d', hoverName, mx, my);
  }

  // Mouse movement handlers
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    updateHoverState(e.clientX, e.clientY);
  });

  document.documentElement.addEventListener('mouseleave', () => {
    mouse.targetX = -9999;
    mouse.targetY = -9999;
    claimTooltip('canvas2d', null);
  });

  window.addEventListener('scroll', () => {
    scrollTarget = window.scrollY;
  }, { passive: true });

  window.addEventListener('resize', () => resize(false));

  // Fade each section's constellation in while its section is in view
  if ('IntersectionObserver' in window) {
    SECTION_CONSTELLATIONS.forEach((c) => {
      const el = document.getElementById(c.id);
      if (!el) return;
      const observer = new IntersectionObserver((entries) => {
        c.target = entries[0].isIntersecting ? 1 : 0;
      }, { threshold: 0.15 });
      observer.observe(el);
    });
  }

  // Main render loop (shared frame loop, after the 3D layer)
  let time = 0;

  function render(dt) {
    time += (reducedMotion ? 0.18 : 0.48) * dt;

    // Fade the backdrop while a 3D body is focused.
    const dim = spaceState.focus.dim;
    const fade = 1 - dim * 0.85;

    // Smooth mouse interpolation
    mouse.x = ease(mouse.x, mouse.targetX, 0.08, dt);
    mouse.y = ease(mouse.y, mouse.targetY, 0.08, dt);

    // Starfield parallax: pixel offset of the mouse from screen center, clamped
    // and eased toward its target so stars drift as if the camera pans through space
    const maxOffset = 600;
    const rawTargetX = mouse.targetX > -9000 ? mouse.x - width / 2 : 0;
    const rawTargetY = mouse.targetY > -9000 ? mouse.y - height / 2 : 0;
    const targetParallaxX = Math.max(-maxOffset, Math.min(maxOffset, rawTargetX));
    const targetParallaxY = Math.max(-maxOffset, Math.min(maxOffset, rawTargetY));
    parallaxX = ease(parallaxX, targetParallaxX, 0.06, dt);
    parallaxY = ease(parallaxY, targetParallaxY, 0.06, dt);

    // Scroll drift: eased toward the real scroll position, then turned into
    // a slow diagonal pan — a gentle sideways wander plus steady forward
    // travel — so scrolling through the page reads as flying to a new
    // patch of sky rather than the same frozen view sliding underneath it.
    scrollEased = ease(scrollEased, scrollTarget, 0.05, dt);
    const driftX = reducedMotion ? 0 : Math.sin(scrollEased * 0.0006) * 340;
    const driftY = scrollEased * 0.45;

    ctx.clearRect(0, 0, width, height);

    // 1. Starfield
    const parallaxStrength = reducedMotion ? 0 : 0.26;
    ctx.save();
    ctx.globalAlpha = fade;
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      const twinkle = Math.sin(time * star.twinkleSpeed * 100 + star.phase);
      const alpha = Math.max(0.05, Math.min(1, star.baseAlpha + twinkle * 0.3));
      const ox = star.x - parallaxX * parallaxStrength * star.parallax - driftX * star.parallax - panOffset.x * star.parallax;
      const oy = star.y - parallaxY * parallaxStrength * star.parallax - driftY * star.parallax - panOffset.y * star.parallax;
      // Wrapped (not clamped): the drift can travel many screens' worth
      // over a long page, so stars recycle across the canvas edges instead
      // of draining out of view, keeping the field always populated.
      const sx = ((ox % width) + width) % width;
      const sy = ((oy % height) + height) % height;

      ctx.beginPath();
      ctx.fillStyle = `${star.color}${alpha})`;
      ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Cancer constellation (observe mode only)
    if (isObserveMode()) {
      ctx.save();
      ctx.globalAlpha = fade;
      drawCancerConstellation(time);
      ctx.restore();
    } else {
      cancerBounds = null;
    }

    // 3. Per-section constellations (cross-fade as sections scroll by)
    for (let i = 0; i < SECTION_CONSTELLATIONS.length; i++) {
      const c = SECTION_CONSTELLATIONS[i];
      c.alpha = ease(c.alpha, c.target, 0.05, dt);
      if (c.alpha > 0.01) drawSectionConstellation(c, c.alpha * fade, time);
    }

    // 4. Musca, around Alfa Muscae's live position
    ctx.save();
    ctx.globalAlpha = fade;
    drawMuscaConstellation(getMuscaAnchor(), time);
    ctx.restore();

    // 5. Floating stardust (cursor-reactive)
    for (let i = 0; i < stardust.length; i++) {
      const p = stardust[i];

      if (!reducedMotion) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }

      let currentAlpha = p.alpha;
      let currentRadius = p.radius;

      if (mouse.x > 0) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 180;

        if (dist < maxDist) {
          const factor = 1 - dist / maxDist;
          currentAlpha += factor * 0.55;
          currentRadius += factor * 1.5;

          // Connect stardust near cursor with pale laser lines
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(212, 212, 216, ${0.3 * factor * fade})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, currentAlpha) * fade;
      ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 6. Shooting stars
    updateShootingStars(dt);
    ctx.save();
    ctx.globalAlpha = fade;
    drawShootingStars();
    ctx.restore();

    // 7. Black hole collapse debris
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const bp = burstParticles[i];
      bp.x += bp.vx * dt;
      bp.y += bp.vy * dt;
      bp.alpha = decay(bp.alpha, 0.94, dt);

      if (bp.alpha < 0.02) {
        burstParticles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.fillStyle = bp.color;
      ctx.globalAlpha = bp.alpha * fade;
      ctx.arc(bp.x, bp.y, bp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 8. Black hole state -> spaceState (drawn by the WebGL lensing shader)
    updateBlackHole(dt);
  }

  resize(true);
  onFrame(render, 20);
}
