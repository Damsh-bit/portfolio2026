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
  let asteroids = [];
  let shootingStars = [];
  const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };
  let parallaxX = 0;
  let parallaxY = 0;
  let asteroidTimer = 1500 + Math.random() * 1800; // ~25-55s at 60fps
  let shootingStarTimer = 240 + Math.random() * 300; // ~4-9s at 60fps
  const starTooltip = document.getElementById('starTooltip');

  // Observe-mode planet focus/zoom state
  let focusIndex = -1;
  let focusTarget = 0;
  let focusProgress = 0;

  function enterFocus(index) {
    focusIndex = index;
    focusTarget = 1;
  }

  function exitFocus() {
    focusTarget = 0;
    if (focusIndex >= 0 && planets[focusIndex] && planets[focusIndex].infoPoints) {
      planets[focusIndex].infoPoints.forEach((pt) => { pt.expanded = false; });
    }
  }

  // Responsive setup
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    createStars();
    createStardust();
    createPlanets();
    burstParticles = [];
    asteroids = [];
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
        // Pale Gas Giant with subtle ring. Click egg: an orbiting space
        // station wakes up and loops the ring plane forever.
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
        station: {
          active: false,
          progress: 0,
          angle: Math.random() * Math.PI * 2,
          speed: reducedMotion ? 0.0006 : 0.0016,
          screenX: undefined,
          screenY: undefined
        },
        infoPoints: [
          { angle: -Math.PI / 2, text: 'Gigante gaseoso: hidrógeno y helio en capas turbulentas.' },
          { angle: -Math.PI / 8, text: 'El anillo son fragmentos de hielo en órbita perfecta.' },
          { angle: Math.PI * 0.7, text: 'Un día dura apenas 9 horas — gira muy rápido.' },
          { angle: Math.PI * 0.15, text: 'Hogar de la Estación Deriva-9, en órbita permanente.' }
        ].map((pt) => ({ ...pt, expanded: false })),
        ...createPlanetInteractionState()
      },
      {
        // Alpha Muscae (α Mus) — brightest star of Musca, the Fly.
        // Click easter egg reveals its real astronomical data.
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
        infoPoints: [
          { angle: -Math.PI / 2, text: 'Pulsa cada 2.17 horas — variable Beta Cephei.' },
          { angle: -Math.PI / 6, text: 'A ~315 años luz, en el hemisferio sur celeste.' },
          { angle: Math.PI * 0.6, text: '8.8 masas solares: candidata a supernova.' },
          { angle: Math.PI * 0.15, text: 'Ancla la constelación de Musca, la Mosca.' }
        ].map((pt) => ({ ...pt, expanded: false })),
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
        infoPoints: [
          { angle: -Math.PI / 2, text: 'Planeta errante — no orbita ninguna estrella conocida.' },
          { angle: -Math.PI / 8, text: 'Superficie helada, sumida en oscuridad profunda.' },
          { angle: Math.PI * 0.65, text: 'Emite una señal débil y constante, de origen desconocido.' },
          { angle: Math.PI * 0.15, text: 'Su órbita real es un misterio sin trazar.' }
        ].map((pt) => ({ ...pt, expanded: false })),
        ...createPlanetInteractionState()
      }
    ];
  }

  // ------------------------------------------------------------------
  // Musca constellation, anchored on the "Alpha Muscae" planet (index 1).
  // Companion star offsets (px) reproduce the traditional Musca stick
  // figure: a β–δ–γ–α kite with an ε–λ tail trailing off toward the edge.
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

  // β Muscae is the nearest companion to Alpha and — fittingly — a real
  // binary star system, so it shares Alpha's attention-grabbing twinkle.
  function drawMuscaConstellation(p, time) {
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
      ctx.moveTo(p.px + na.dx, p.py + na.dy);
      ctx.lineTo(p.px + nb.dx, p.py + nb.dy);
      ctx.stroke();
    }

    const twinkle = 0.5 + 0.5 * Math.sin(time * 0.5);

    ctx.font = '10px "IBM Plex Mono", monospace';
    for (let i = 0; i < MUSCA_STARS.length; i++) {
      const s = MUSCA_STARS[i];
      let r = Math.max(0.7, 2.6 - s.mag * 0.35);
      let alpha = Math.max(0.35, 1 - s.mag * 0.13);
      const sx = p.px + s.dx;
      const sy = p.py + s.dy;

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
    ctx.fillText('α', p.px + p.radius + 6, p.py + 4);
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // Orbiting space station: click egg for the top-right gas giant. Loops
  // the ring plane forever once woken up; clicking it opens its info card.
  // ------------------------------------------------------------------

  // Orbit distance grows with the planet's zoom scale, but is capped so it
  // never drifts past the visible viewport once the planet fills the screen.
  function stationOrbitScale(p, sizeScale, width, height) {
    const baseOrbitR = p.ringRadiusX * 1.45;
    const maxOrbitR = Math.min(width, height) * 0.4;
    return Math.min(sizeScale, maxOrbitR / baseOrbitR);
  }

  function updateStation(p, sizeScale, width, height) {
    const st = p.station;
    if (!st) return;

    if (st.active) st.angle += st.speed;
    st.progress += ((st.active ? 1 : 0) - st.progress) * 0.06;

    if (st.progress < 0.001) {
      st.screenX = undefined;
      st.screenY = undefined;
      return;
    }

    const orbitScale = stationOrbitScale(p, sizeScale, width, height);
    const orbitRx = p.ringRadiusX * 1.45 * orbitScale;
    const orbitRy = p.ringRadiusY * 1.45 * orbitScale;
    const ex = Math.cos(st.angle) * orbitRx;
    const ey = Math.sin(st.angle) * orbitRy;
    const tiltCos = Math.cos(p.tilt);
    const tiltSin = Math.sin(p.tilt);
    const localX = ex * tiltCos - ey * tiltSin;
    const localY = ex * tiltSin + ey * tiltCos;

    // Tangent to the tilted ellipse at this angle, so the station's own
    // orientation follows its travel direction instead of cutting across
    // the ring plane.
    const dEx = -Math.sin(st.angle) * orbitRx;
    const dEy = Math.cos(st.angle) * orbitRy;
    const tangentX = dEx * tiltCos - dEy * tiltSin;
    const tangentY = dEx * tiltSin + dEy * tiltCos;

    st.localX = localX;
    st.localY = localY;
    st.travelAngle = Math.atan2(tangentY, tangentX);
    st.screenX = p.px + localX;
    st.screenY = p.py + localY;
    st.hitRadius = 14 * Math.max(1, orbitScale * 0.7);
  }

  function drawStation(p, sizeScale, width, height) {
    const st = p.station;
    if (!st || st.progress < 0.001) return;

    const orbitScale = stationOrbitScale(p, sizeScale, width, height);
    const orbitRx = p.ringRadiusX * 1.45 * orbitScale;
    const orbitRy = p.ringRadiusY * 1.45 * orbitScale;

    // Faint dashed orbit path
    ctx.save();
    ctx.globalAlpha *= st.progress;
    ctx.rotate(p.tilt);
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = 'rgba(212, 212, 216, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, orbitRx, orbitRy, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Station icon: hub + truss + two solar-panel wings, oriented along
    // its direction of travel around the ring plane
    const scale = 1.3 * orbitScale * (0.6 + st.progress * 0.4);
    ctx.save();
    ctx.globalAlpha *= st.progress;
    ctx.translate(st.localX, st.localY);
    ctx.rotate(st.travelAngle);
    ctx.strokeStyle = 'rgba(245, 245, 247, 0.85)';
    ctx.fillStyle = 'rgba(245, 245, 247, 0.92)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-9 * scale, -2.5 * scale, 6 * scale, 5 * scale);
    ctx.strokeRect(3 * scale, -2.5 * scale, 6 * scale, 5 * scale);
    ctx.beginPath();
    ctx.moveTo(-3 * scale, 0);
    ctx.lineTo(3 * scale, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // Observe-mode info markers: small clickable "+" points scattered
  // around the focused planet, each expanding into a short fact.
  // ------------------------------------------------------------------

  function drawInfoPoints(p, effRadius, focusProgress) {
    if (!p.infoPoints) return;

    const alpha = Math.max(0, (focusProgress - 0.45) / 0.55);
    if (alpha <= 0.001) {
      p.infoPoints.forEach((pt) => { pt.screenX = undefined; pt.screenY = undefined; });
      return;
    }

    const markerDist = effRadius + 34;
    const markerR = 9;

    for (let i = 0; i < p.infoPoints.length; i++) {
      const pt = p.infoPoints[i];
      const mx = p.px + Math.cos(pt.angle) * markerDist;
      const my = p.py + Math.sin(pt.angle) * markerDist;
      pt.screenX = mx;
      pt.screenY = my;

      ctx.save();
      ctx.globalAlpha *= alpha;

      // Connector line from the planet's edge to the marker
      ctx.strokeStyle = 'rgba(212, 212, 216, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.px + Math.cos(pt.angle) * effRadius, p.py + Math.sin(pt.angle) * effRadius);
      ctx.lineTo(mx, my);
      ctx.stroke();

      // Marker circle
      ctx.beginPath();
      ctx.arc(mx, my, markerR, 0, Math.PI * 2);
      ctx.fillStyle = pt.expanded ? 'rgba(245, 245, 247, 0.95)' : 'rgba(16, 16, 16, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(212, 212, 216, 0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Plus / minus glyph
      ctx.strokeStyle = pt.expanded ? 'rgba(16, 16, 16, 0.9)' : 'rgba(245, 245, 247, 0.9)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(mx - 3.5, my);
      ctx.lineTo(mx + 3.5, my);
      if (!pt.expanded) {
        ctx.moveTo(mx, my - 3.5);
        ctx.lineTo(mx, my + 3.5);
      }
      ctx.stroke();

      // Expanded caption popover
      if (pt.expanded) {
        ctx.font = '11px "IBM Plex Mono", monospace';
        const paddingX = 10;
        const paddingY = 8;
        const textW = ctx.measureText(pt.text).width;
        const boxW = textW + paddingX * 2;
        const boxH = 14 + paddingY * 2;
        const dirX = Math.cos(pt.angle);
        const offset = markerR + 10;
        const boxX = mx + (dirX >= 0 ? offset : -offset - boxW);
        const boxY = my - boxH / 2;

        ctx.fillStyle = 'rgba(12, 12, 14, 0.92)';
        ctx.strokeStyle = 'rgba(212, 212, 216, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(245, 245, 247, 0.92)';
        ctx.textBaseline = 'middle';
        ctx.fillText(pt.text, boxX + paddingX, boxY + boxH / 2 + 0.5);
      }

      ctx.restore();
    }
  }

  // ------------------------------------------------------------------
  // Asteroids: a rocky body drifts across the screen at a fixed cadence
  // ------------------------------------------------------------------

  function createAsteroidShape(radius) {
    const sides = 7 + Math.floor(Math.random() * 4);
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      points.push({ angle, r: radius * (0.65 + Math.random() * 0.5) });
    }
    return points;
  }

  function spawnAsteroid() {
    const fromLeft = Math.random() > 0.5;
    const radius = 7 + Math.random() * 6;
    const speed = 0.9 + Math.random() * 0.7;

    asteroids.push({
      x: fromLeft ? -80 : width + 80,
      y: height * (0.08 + Math.random() * 0.55),
      vx: (fromLeft ? 1 : -1) * speed,
      vy: (Math.random() - 0.5) * 0.3,
      radius,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.025,
      shape: createAsteroidShape(radius)
    });
  }

  function updateAsteroids() {
    if (!reducedMotion) {
      asteroidTimer--;
      if (asteroidTimer <= 0) {
        spawnAsteroid();
        asteroidTimer = 1500 + Math.random() * 1800; // occasional, ~25-55s at 60fps
      }
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.rotation += a.rotationSpeed;

      if (a.x < -120 || a.x > width + 120 || a.y < -120 || a.y > height + 120) {
        asteroids.splice(i, 1);
      }
    }
  }

  function drawAsteroids() {
    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i];

      // Faint motion trail
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(161, 161, 170, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x - a.vx * 7, a.y - a.vy * 7);
      ctx.stroke();

      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);

      ctx.beginPath();
      for (let j = 0; j < a.shape.length; j++) {
        const pt = a.shape[j];
        const px = Math.cos(pt.angle) * pt.r;
        const py = Math.sin(pt.angle) * pt.r;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(-a.radius * 0.3, -a.radius * 0.3, a.radius * 0.1, 0, 0, a.radius);
      grad.addColorStop(0, '#9a9aa2');
      grad.addColorStop(0.7, '#4a4a52');
      grad.addColorStop(1, '#1c1c20');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }

  // ------------------------------------------------------------------
  // Shooting stars: quick fading streaks crossing the whole site
  // ------------------------------------------------------------------

  function spawnShootingStar() {
    const dir = Math.random() > 0.5 ? 1 : -1;
    const angle = Math.PI * 0.22 + Math.random() * 0.2; // shallow downward diagonal
    const speed = 1.6 + Math.random() * 1.1;

    shootingStars.push({
      x: Math.random() * width * 1.2 - width * 0.1,
      y: -30 - Math.random() * 60,
      vx: Math.cos(angle) * speed * dir,
      vy: Math.sin(angle) * speed,
      length: 220 + Math.random() * 140,
      life: 0,
      maxLife: 340 + Math.random() * 140
    });
  }

  function updateShootingStars() {
    if (!reducedMotion) {
      shootingStarTimer--;
      if (shootingStarTimer <= 0) {
        spawnShootingStar();
        shootingStarTimer = 240 + Math.random() * 300; // ~4-9s at 60fps
      }
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life++;

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
      if (s.life < 14) alpha = s.life / 14;
      else if (s.life > s.maxLife - 35) alpha = Math.max(0, (s.maxLife - s.life) / 35);

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
    if (index === 0) {
      spawnSupernovaBurst(p);
      if (p.station) p.station.active = true;
    }
    else if (index === 1) {
      spawnSatellite(p);
      window.dispatchEvent(new CustomEvent('open-star-lightbox'));
    }
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

  // Hit-test clicks against each planet's last-rendered screen position.
  // In observe mode (UI hidden), clicks zoom into a planet instead of
  // triggering the normal easter eggs.
  window.addEventListener('click', (e) => {
    const observeMode = document.body.classList.contains('ui-hidden');

    if (observeMode) {
      if (focusIndex >= 0) {
        const fp = planets[focusIndex];

        // Station click (bigger, easier target while zoomed in)
        if (fp.station && fp.station.screenX !== undefined) {
          const sdx = e.clientX - fp.station.screenX;
          const sdy = e.clientY - fp.station.screenY;
          if (Math.hypot(sdx, sdy) <= fp.station.hitRadius) {
            window.dispatchEvent(new CustomEvent('open-station-lightbox'));
            return;
          }
        }

        // Info marker click: toggle its expanded caption, stay zoomed in
        if (fp.infoPoints) {
          for (let j = 0; j < fp.infoPoints.length; j++) {
            const pt = fp.infoPoints[j];
            if (pt.screenX === undefined) continue;
            const mdx = e.clientX - pt.screenX;
            const mdy = e.clientY - pt.screenY;
            if (Math.hypot(mdx, mdy) <= 13) {
              pt.expanded = !pt.expanded;
              return;
            }
          }
        }

        exitFocus();
        return;
      }
      for (let i = 0; i < planets.length; i++) {
        const p = planets[i];
        if (p.px === undefined) continue;

        const dx = e.clientX - p.px;
        const dy = e.clientY - p.py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= (p.currentRadius || p.radius) * 1.4) {
          enterFocus(i);
          break;
        }
      }
      return;
    }

    // Space station click (orbits planet 0) takes priority over the planet itself
    const stationPlanet = planets[0];
    if (stationPlanet && stationPlanet.station && stationPlanet.station.screenX !== undefined) {
      const sdx = e.clientX - stationPlanet.station.screenX;
      const sdy = e.clientY - stationPlanet.station.screenY;
      if (Math.hypot(sdx, sdy) <= (stationPlanet.station.hitRadius || 14)) {
        window.dispatchEvent(new CustomEvent('open-station-lightbox'));
        return;
      }
    }

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

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && focusIndex >= 0) exitFocus();
  });

  // Mouse movement handlers
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;

    // Alpha Muscae hover tooltip
    if (starTooltip) {
      const alphaPlanet = planets[1];
      if (alphaPlanet && alphaPlanet.px !== undefined) {
        const dx = e.clientX - alphaPlanet.px;
        const dy = e.clientY - alphaPlanet.py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= (alphaPlanet.currentRadius || alphaPlanet.radius) * 1.5) {
          starTooltip.style.opacity = '1';
          starTooltip.style.transform = `translate(${e.clientX + 16}px, ${e.clientY - 12}px)`;
        } else {
          starTooltip.style.opacity = '0';
        }
      }
    }
  });

  window.addEventListener('mouseleave', () => {
    mouse.targetX = -9999;
    mouse.targetY = -9999;
    if (starTooltip) starTooltip.style.opacity = '0';
  });

  window.addEventListener('resize', resize);

  // Main Render Loop
  let time = 0;

  function render() {
    time += reducedMotion ? 0.003 : 0.008;

    // Observe-mode planet focus/zoom: auto-exit if the UI comes back, ease
    // progress toward its target, and fully clear the focus once settled.
    if (focusIndex >= 0 && !document.body.classList.contains('ui-hidden')) {
      exitFocus();
    }
    focusProgress += ((focusIndex >= 0 ? focusTarget : 0) - focusProgress) * 0.09;
    if (focusIndex >= 0 && focusTarget === 0 && focusProgress < 0.01) {
      focusProgress = 0;
      focusIndex = -1;
    }
    const dim = focusIndex >= 0 ? focusProgress : 0;

    // Smooth mouse interpolation
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;

    // Starfield parallax: pixel offset of the mouse from screen center, clamped
    // and eased toward its target so stars drift as if the camera pans through space
    const maxOffset = 600;
    const rawTargetX = mouse.targetX > -9000 ? mouse.x - width / 2 : 0;
    const rawTargetY = mouse.targetY > -9000 ? mouse.y - height / 2 : 0;
    const targetParallaxX = Math.max(-maxOffset, Math.min(maxOffset, rawTargetX));
    const targetParallaxY = Math.max(-maxOffset, Math.min(maxOffset, rawTargetY));
    parallaxX += (targetParallaxX - parallaxX) * 0.06;
    parallaxY += (targetParallaxY - parallaxY) * 0.06;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Starfield
    const parallaxStrength = reducedMotion ? 0 : 0.26;
    ctx.save();
    ctx.globalAlpha = 1 - dim * 0.85;
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      const twinkle = Math.sin(time * star.twinkleSpeed * 100 + star.phase);
      const alpha = Math.max(0.05, Math.min(1, star.baseAlpha + twinkle * 0.3));
      const sx = star.x - parallaxX * parallaxStrength * star.parallax;
      const sy = star.y - parallaxY * parallaxStrength * star.parallax;

      ctx.beginPath();
      ctx.fillStyle = `${star.color}${alpha})`;
      ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Draw Minimalist Planets
    const bigRadius = Math.min(width, height) * 0.32;
    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      const floatY = Math.sin(time * 0.25 + p.floatOffset) * 12;
      const naturalPx = p.relX * width;
      const naturalPy = p.relY * height + floatY;

      let px = naturalPx;
      let py = naturalPy;
      let sizeScale = 1;

      if (i === focusIndex) {
        px = naturalPx + (width / 2 - naturalPx) * focusProgress;
        py = naturalPy + (height / 2 - naturalPy) * focusProgress;
        sizeScale = 1 + (bigRadius / p.radius - 1) * focusProgress;
      }

      p.px = px;
      p.py = py;

      if (i === 1) {
        ctx.save();
        ctx.globalAlpha = 1 - dim * 0.85;
        drawMuscaConstellation(p, time);
        ctx.restore();
      }

      updateStation(p, sizeScale, width, height);
      updatePlanetGlitch(p);

      // Supernova click-egg: brief radius pulse that eases back to normal
      let radiusScale = 1;
      if (p.burst && p.burst.type === 'pulse') {
        p.burst.frame++;
        const t = p.burst.frame / p.burst.frames;
        radiusScale = 1 + 0.3 * Math.max(0, 1 - t);
        if (p.burst.frame >= p.burst.frames) p.burst = null;
      }
      const effRadius = p.radius * radiusScale * sizeScale;
      p.currentRadius = effRadius;

      ctx.save();
      if (i !== focusIndex && dim > 0) ctx.globalAlpha = 1 - dim * 0.9;
      ctx.translate(px, py);

      // Planet Glow Aura
      const glowGrad = ctx.createRadialGradient(0, 0, effRadius * 0.5, 0, 0, effRadius * 2.5);
      glowGrad.addColorStop(0, p.glowColor);
      glowGrad.addColorStop(1, 'rgba(7, 7, 7, 0)');
      ctx.beginPath();
      ctx.fillStyle = glowGrad;
      ctx.arc(0, 0, effRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Alpha Muscae attention-grabbing twinkle: a slow pulsing halo loop
      if (i === 1) {
        const twinkle = 0.5 + 0.5 * Math.sin(time * 0.5);
        const twinkleRadius = effRadius * (2.2 + twinkle * 1.4);
        const twinkleGrad = ctx.createRadialGradient(0, 0, effRadius * 0.8, 0, 0, twinkleRadius);
        twinkleGrad.addColorStop(0, `rgba(245, 245, 247, ${0.16 + twinkle * 0.24})`);
        twinkleGrad.addColorStop(1, 'rgba(245, 245, 247, 0)');
        ctx.beginPath();
        ctx.fillStyle = twinkleGrad;
        ctx.arc(0, 0, twinkleRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Planet Ring (Back part if tilted ring exists)
      if (p.ringRadiusX > 0) {
        ctx.save();
        ctx.rotate(p.tilt);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.ringRadiusX * sizeScale, p.ringRadiusY * sizeScale, 0, Math.PI, Math.PI * 2);
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
        ctx.ellipse(0, 0, p.ringRadiusX * sizeScale, p.ringRadiusY * sizeScale, 0, 0, Math.PI);
        ctx.strokeStyle = p.ringColor;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();
      }

      drawStation(p, sizeScale, width, height);

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

      if (i === focusIndex) drawInfoPoints(p, effRadius, focusProgress);
      else if (p.infoPoints) p.infoPoints.forEach((pt) => { pt.screenX = undefined; pt.screenY = undefined; });
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
            ctx.strokeStyle = `rgba(212, 212, 216, ${0.3 * factor * (1 - dim * 0.85)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, currentAlpha) * (1 - dim * 0.85);
      ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 4. Draw Asteroids
    updateAsteroids();
    ctx.save();
    ctx.globalAlpha = 1 - dim * 0.85;
    drawAsteroids();
    ctx.restore();

    // 5. Draw Shooting Stars
    updateShootingStars();
    ctx.save();
    ctx.globalAlpha = 1 - dim * 0.85;
    drawShootingStars();
    ctx.restore();

    // 6. Draw Easter-Egg Burst Particles (supernova debris)
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
      ctx.globalAlpha = bp.alpha * (1 - dim * 0.85);
      ctx.arc(bp.x, bp.y, bp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    requestAnimationFrame(render);
  }

  resize();
  render();
}
