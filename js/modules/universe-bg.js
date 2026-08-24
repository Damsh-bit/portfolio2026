/**
 * =========================================================================
 * UNIVERSE CANVAS ANIMATION ENGINE
 * =========================================================================
 * Minimalist space universe background featuring twinkling starfields,
 * floating glowing planets with ring systems, cosmic dust, cursor interaction,
 * ambient digital-glitch bursts, and click-triggered planet easter eggs.
 */

export function initUniverseBg() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  let stars = [];
  let stardust = [];
  let planets = [];
  let burstParticles = [];
  const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };

  // Responsive setup
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    createStars();
    createStardust();
    createPlanets();
    burstParticles = [];
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
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? '#d4d4d8' : '#a1a1aa'
      });
    }
  }

  // Create minimalist celestial planets
  function createPlanets() {
    planets = [
      {
        // Pale Gas Giant with subtle ring
        relX: 0.85,
        relY: 0.22,
        radius: 42,
        ringRadiusX: 75,
        ringRadiusY: 18,
        tilt: -0.25,
        colorCore: '#e4e4e7',
        colorEdge: '#27272a',
        glowColor: 'rgba(228, 228, 231, 0.22)',
        ringColor: 'rgba(180, 180, 190, 0.4)',
        floatOffset: 0,
        floatSpeed: 0.001,
        ...createPlanetInteractionState()
      },
      {
        // Small Distant Gray Orb
        relX: 0.12,
        relY: 0.72,
        radius: 22,
        ringRadiusX: 0,
        ringRadiusY: 0,
        tilt: 0,
        colorCore: '#a1a1aa',
        colorEdge: '#3f3f46',
        glowColor: 'rgba(161, 161, 170, 0.18)',
        ringColor: 'transparent',
        floatOffset: Math.PI,
        floatSpeed: 0.0012,
        ...createPlanetInteractionState()
      },
      {
        // Deep Space Celestial Sphere
        relX: 0.78,
        relY: 0.85,
        radius: 14,
        ringRadiusX: 28,
        ringRadiusY: 7,
        tilt: 0.4,
        colorCore: '#f5f5f7',
        colorEdge: '#52525b',
        glowColor: 'rgba(245, 245, 247, 0.14)',
        ringColor: 'rgba(212, 212, 216, 0.3)',
        floatOffset: Math.PI * 0.5,
        floatSpeed: 0.0008,
        ...createPlanetInteractionState()
      }
    ];
  }

  // Shared ambient-glitch + easter-egg state every planet starts with
  function createPlanetInteractionState() {
    return {
      glitchTimer: 300 + Math.random() * 420,
      glitchActive: false,
      glitchFrames: 0,
      glitchSliceY: 0,
      glitchOffsetX: 0,
      origCore: null,
      origEdge: null,
      pendingRestore: false,
      burst: null,
      px: undefined,
      py: undefined,
      currentRadius: undefined
    };
  }

  // Ambient random glitch trigger + per-frame glitch countdown (also drives
  // the planet-3 click egg, which forces glitchActive on directly)
  function updatePlanetGlitch(p) {
    if (p.glitchActive) {
      p.glitchFrames--;
      if (p.glitchFrames <= 0) {
        p.glitchActive = false;
        if (p.pendingRestore) {
          p.colorCore = p.origCore;
          p.colorEdge = p.origEdge;
          p.pendingRestore = false;
        }
      }
      return;
    }

    if (reducedMotion) return; // no ambient random glitches under reduced motion

    p.glitchTimer--;
    if (p.glitchTimer <= 0) {
      p.glitchActive = true;
      p.glitchFrames = 6 + Math.floor(Math.random() * 6);
      p.glitchSliceY = (Math.random() - 0.5) * p.radius * 1.2;
      p.glitchOffsetX = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 5);
      p.glitchTimer = 300 + Math.random() * 420;
    }
  }

  // ------------------------------------------------------------------
  // Planet click easter eggs
  // ------------------------------------------------------------------

  function triggerPlanetEasterEgg(index, p) {
    if (index === 0) spawnSupernovaBurst(p);
    else if (index === 1) spawnSatellite(p);
    else spawnGlitchPulse(p);
  }

  // Planet 1: supernova-style particle burst + brief size pulse
  function spawnSupernovaBurst(p) {
    const rmFactor = reducedMotion ? 0.33 : 1;
    const count = Math.max(6, Math.round(24 * rmFactor));

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      burstParticles.push({
        x: p.px,
        y: p.py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 1.5,
        alpha: 1,
        color: Math.random() > 0.5 ? '#f5f5f7' : '#d4d4d8'
      });
    }

    p.burst = { type: 'pulse', frame: 0, frames: Math.max(4, Math.round(8 * rmFactor)) };
  }

  // Planet 2: a tiny satellite wakes up, orbits briefly, then fades
  function spawnSatellite(p) {
    const rmFactor = reducedMotion ? 0.25 : 1;
    const life = Math.max(60, Math.round(240 * rmFactor));
    p.burst = {
      type: 'satellite',
      angle: 0,
      distance: p.radius * 2.2,
      speed: 0.08,
      life,
      maxLife: life
    };
  }

  // Planet 3: a longer, inverted-color glitch pulse
  function spawnGlitchPulse(p) {
    const rmFactor = reducedMotion ? 0.35 : 1;
    if (!p.origCore) {
      p.origCore = p.colorCore;
      p.origEdge = p.colorEdge;
    }
    p.glitchActive = true;
    p.glitchFrames = Math.max(8, Math.round(20 * rmFactor));
    p.glitchSliceY = 0;
    p.glitchOffsetX = 6;
    p.colorCore = '#000000';
    p.colorEdge = '#ffffff';
    p.pendingRestore = true;
  }

  // Hit-test clicks against each planet's last-rendered screen position
  window.addEventListener('click', (e) => {
    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      if (p.px === undefined) continue;

      const dx = e.clientX - p.px;
      const dy = e.clientY - p.py;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= (p.currentRadius || p.radius) * 1.4) {
        triggerPlanetEasterEgg(i, p);
        break;
      }
    }
  });

  // Mouse movement handlers
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.targetX = -9999;
    mouse.targetY = -9999;
  });

  window.addEventListener('resize', resize);

  // Main Render Loop
  let time = 0;

  function render() {
    time += reducedMotion ? 0.003 : 0.008;

    // Smooth mouse interpolation
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Starfield
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      const twinkle = Math.sin(time * star.twinkleSpeed * 100 + star.phase);
      const alpha = Math.max(0.05, Math.min(1, star.baseAlpha + twinkle * 0.3));

      ctx.beginPath();
      ctx.fillStyle = `${star.color}${alpha})`;
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw Minimalist Planets
    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      const floatY = Math.sin(time * 0.8 + p.floatOffset) * 12;
      const px = p.relX * width;
      const py = p.relY * height + floatY;
      p.px = px;
      p.py = py;

      updatePlanetGlitch(p);

      // Supernova click-egg: brief radius pulse that eases back to normal
      let radiusScale = 1;
      if (p.burst && p.burst.type === 'pulse') {
        p.burst.frame++;
        const t = p.burst.frame / p.burst.frames;
        radiusScale = 1 + 0.3 * Math.max(0, 1 - t);
        if (p.burst.frame >= p.burst.frames) p.burst = null;
      }
      const effRadius = p.radius * radiusScale;
      p.currentRadius = effRadius;

      ctx.save();
      ctx.translate(px, py);

      // Planet Glow Aura
      const glowGrad = ctx.createRadialGradient(0, 0, effRadius * 0.5, 0, 0, effRadius * 2.5);
      glowGrad.addColorStop(0, p.glowColor);
      glowGrad.addColorStop(1, 'rgba(7, 7, 7, 0)');
      ctx.beginPath();
      ctx.fillStyle = glowGrad;
      ctx.arc(0, 0, effRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Planet Ring (Back part if tilted ring exists)
      if (p.ringRadiusX > 0) {
        ctx.save();
        ctx.rotate(p.tilt);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.ringRadiusX, p.ringRadiusY, 0, Math.PI, Math.PI * 2);
        ctx.strokeStyle = p.ringColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }

      // Planet Sphere Gradient
      const planetGrad = ctx.createRadialGradient(
        -effRadius * 0.3,
        -effRadius * 0.3,
        effRadius * 0.1,
        0,
        0,
        effRadius
      );
      planetGrad.addColorStop(0, p.colorCore);
      planetGrad.addColorStop(0.7, p.colorEdge);
      planetGrad.addColorStop(1, '#070707');

      ctx.beginPath();
      ctx.fillStyle = planetGrad;
      ctx.arc(0, 0, effRadius, 0, Math.PI * 2);
      ctx.fill();

      // Glitch slice-shift: redraw one clipped horizontal band, offset in X
      if (p.glitchActive) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(-effRadius, p.glitchSliceY - effRadius * 0.15, effRadius * 2, effRadius * 0.3);
        ctx.clip();
        ctx.translate(p.glitchOffsetX, 0);
        ctx.beginPath();
        ctx.fillStyle = planetGrad;
        ctx.arc(0, 0, effRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Planet Ring (Front part)
      if (p.ringRadiusX > 0) {
        ctx.save();
        ctx.rotate(p.tilt);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.ringRadiusX, p.ringRadiusY, 0, 0, Math.PI);
        ctx.strokeStyle = p.ringColor;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();
      }

      // Satellite click-egg: a tiny moon orbiting a couple times, then fading
      if (p.burst && p.burst.type === 'satellite') {
        const b = p.burst;
        b.angle += b.speed;
        b.life--;

        const fadeWindow = Math.min(40, b.maxLife * 0.3);
        const alpha = b.life < fadeWindow ? Math.max(0, b.life / fadeWindow) : 1;

        ctx.beginPath();
        ctx.fillStyle = '#e4e4e7';
        ctx.globalAlpha = alpha;
        ctx.arc(Math.cos(b.angle) * b.distance, Math.sin(b.angle) * b.distance, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (b.life <= 0) p.burst = null;
      }

      ctx.restore();
    }

    // 3. Draw Floating Stardust & Constellations
    for (let i = 0; i < stardust.length; i++) {
      const p = stardust[i];

      if (!reducedMotion) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }

      // Mouse attraction / repulsion glow
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
            ctx.strokeStyle = `rgba(212, 212, 216, ${0.3 * factor})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, currentAlpha);
      ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 4. Draw Easter-Egg Burst Particles (supernova debris)
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const bp = burstParticles[i];
      bp.x += bp.vx;
      bp.y += bp.vy;
      bp.alpha *= 0.94;

      if (bp.alpha < 0.02) {
        burstParticles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.fillStyle = bp.color;
      ctx.globalAlpha = bp.alpha;
      ctx.arc(bp.x, bp.y, bp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    requestAnimationFrame(render);
  }

  resize();
  render();
}
