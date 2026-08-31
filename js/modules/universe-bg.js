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
  let cancerBounds = null;
  let asteroidTimer = 1500 + Math.random() * 1800; // ~25-55s at 60fps
  let shootingStarTimer = 240 + Math.random() * 300; // ~4-9s at 60fps
  const starTooltip = document.getElementById('starTooltip');

  // "agujero negro" keyword easter egg
  let blackHole = null;
  let keyBuffer = '';

  // Observe-mode planet focus/zoom state
  let focusIndex = -1;
  let focusTarget = 0;
  let focusProgress = 0;

  function enterFocus(index) {
    focusIndex = index;
    focusTarget = 1;
    document.body.classList.add('planet-focused');
  }

  function exitFocus() {
    focusTarget = 0;
    if (focusIndex >= 0 && planets[focusIndex] && planets[focusIndex].infoPoints) {
      planets[focusIndex].infoPoints.forEach((pt) => { pt.expanded = false; });
    }
    document.body.classList.remove('planet-focused');
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
        name: 'Gigante Gaseoso',
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
          active: true,
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
          { angle: Math.PI * 0.15, text: 'Hogar de la Estación Deriva-9, en órbita permanente.' },
          { angle: Math.PI, isCard: true }
        ].map((pt) => ({ ...pt, expanded: false })),
        ...createPlanetInteractionState()
      },
      {
        // Alpha Muscae (α Mus) — brightest star of Musca, the Fly.
        // Click easter egg reveals its real astronomical data.
        name: 'Alfa Muscae',
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
          { angle: Math.PI * 0.15, text: 'Ancla la constelación de Musca, la Mosca.' },
          { angle: -Math.PI / 4, isCard: true }
        ].map((pt) => ({ ...pt, expanded: false })),
        ...createPlanetInteractionState()
      },
      {
        // Deep Space Celestial Sphere — "El Lucero", dedicated to Hannah.
        name: 'El Lucero',
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
          { angle: -Math.PI / 2, text: 'Vagó a la deriva durante 36 semanas y 4 días.' },
          { angle: -Math.PI / 8, text: 'Superficie helada; brilló por primera vez el 5 de mayo de 2026.' },
          { angle: Math.PI * 0.65, text: 'Emite una señal cálida y constante desde las 20:57 hs.' },
          { angle: Math.PI * 0.15, text: 'Su alineación coincide con Tauro.' },
          { angle: Math.PI * 0.75, isCard: true }
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
    const anchorX = CANCER_ANCHOR.relX * width;
    const anchorY = CANCER_ANCHOR.relY * height;
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

    const anchorX = c.anchor.relX * width;
    const anchorY = c.anchor.relY * height;
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

  // The station's orbit plane is rotated 90° from the ring's plane, so it
  // crosses transversally over the ring instead of tracing alongside it.
  function stationTilt(p) {
    return p.tilt + Math.PI / 2;
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
    const tilt = stationTilt(p);
    const tiltCos = Math.cos(tilt);
    const tiltSin = Math.sin(tilt);
    const localX = ex * tiltCos - ey * tiltSin;
    const localY = ex * tiltSin + ey * tiltCos;

    // Tangent to the tilted ellipse at this angle, so the station's own
    // orientation follows its travel direction instead of cutting across
    // its orbit plane.
    const dEx = -Math.sin(st.angle) * orbitRx;
    const dEy = Math.cos(st.angle) * orbitRy;
    const tangentX = dEx * tiltCos - dEy * tiltSin;
    const tangentY = dEx * tiltSin + dEy * tiltCos;

    // Normalized parametric angle decides which half of the loop the
    // station is on — the same front/back split used for the ring's own
    // near/far halves, so the opaque sphere naturally paints over it
    // when it swings behind the planet.
    const normAngle = ((st.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    st.localX = localX;
    st.localY = localY;
    st.travelAngle = Math.atan2(tangentY, tangentX);
    st.isBack = normAngle >= Math.PI;
    st.screenX = p.px + localX;
    st.screenY = p.py + localY;
    st.hitRadius = 14 * Math.max(1, orbitScale * 0.7);
  }

  function drawStationOrbitPath(p, sizeScale, width, height) {
    const st = p.station;
    if (!st || st.progress < 0.001) return;

    const orbitScale = stationOrbitScale(p, sizeScale, width, height);
    const orbitRx = p.ringRadiusX * 1.45 * orbitScale;
    const orbitRy = p.ringRadiusY * 1.45 * orbitScale;

    // Faint dashed orbit path
    ctx.save();
    ctx.globalAlpha *= st.progress;
    ctx.rotate(stationTilt(p));
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = 'rgba(212, 212, 216, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, orbitRx, orbitRy, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Drawn twice per frame — once for 'back' (before the sphere fill) and
  // once for 'front' (after it) — so only the half matching the station's
  // current position actually renders, giving it real occlusion as it
  // swings behind the planet.
  function drawStationIcon(p, sizeScale, width, height, pass) {
    const st = p.station;
    if (!st || st.progress < 0.001) return;
    if (st.isBack !== (pass === 'back')) return;

    const orbitScale = stationOrbitScale(p, sizeScale, width, height);

    // Station icon: hub + truss + two solar-panel wings, oriented along
    // its direction of travel around its orbit plane
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

  function drawInfoPoints(p, effRadius, focusProgress, time) {
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

      // The card marker stands out from the curiosity markers — a glowing,
      // pulsing accent point that opens the planet's info Card.
      if (pt.isCard) {
        const cardR = 11;
        pt.hitRadius = cardR + 5;
        const pulse = 0.5 + 0.5 * Math.sin(time * 1.6);
        const glowR = cardR * (2.4 + pulse * 1.2);
        const glow = ctx.createRadialGradient(mx, my, 0, mx, my, glowR);
        glow.addColorStop(0, `rgba(255, 201, 74, ${0.4 + pulse * 0.25})`);
        glow.addColorStop(1, 'rgba(255, 201, 74, 0)');
        ctx.beginPath();
        ctx.fillStyle = glow;
        ctx.arc(mx, my, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(mx, my, cardR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 201, 74, 0.95)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Small "card" glyph: two horizontal lines
        ctx.strokeStyle = 'rgba(16, 16, 16, 0.85)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(mx - 4, my - 2);
        ctx.lineTo(mx + 4, my - 2);
        ctx.moveTo(mx - 4, my + 2);
        ctx.lineTo(mx + 4, my + 2);
        ctx.stroke();

        ctx.restore();
        continue;
      }

      pt.hitRadius = markerR + 4;

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
      window.dispatchEvent(new CustomEvent('open-station-lightbox'));
    }
    else if (index === 1) {
      spawnSatellite(p);
      window.dispatchEvent(new CustomEvent('open-star-lightbox'));
    }
    else {
      spawnGlitchPulse(p);
      window.dispatchEvent(new CustomEvent('open-wanderer-lightbox'));
    }
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

  // ------------------------------------------------------------------
  // Black hole easter egg: typing "agujero" anywhere on the page, or
  // clicking #blackHoleBtn (only visible in observe mode), spawns a
  // black hole that pulls in nearby stardust and stays put — no timer.
  // It only goes away when the same trigger is used again to collapse
  // it, or (in observe mode) it's clicked directly on the canvas.
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
      formDuration: reducedMotion ? 20 : 40,
      collapseDuration: reducedMotion ? 12 : 26
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
      const speed = 2.5 + Math.random() * 4.5;
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

  function updateAndDrawBlackHole() {
    const bh = blackHole;
    if (!bh) return;

    bh.t++;
    bh.ringAngle += 0.05;

    let radius = BLACK_HOLE_RADIUS;
    let ringAlpha = 1;

    if (bh.phase === 'forming') {
      const p = Math.min(1, bh.t / bh.formDuration);
      radius = BLACK_HOLE_RADIUS * p;
      ringAlpha = p;
      if (p >= 1) { bh.phase = 'active'; bh.t = 0; }
    } else if (bh.phase === 'active') {
      const pullRadius = BLACK_HOLE_RADIUS * 4;
      for (let i = 0; i < stardust.length; i++) {
        const sd = stardust[i];
        const dx = bh.x - sd.x;
        const dy = bh.y - sd.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < pullRadius) {
          const force = (1 - dist / pullRadius) * 0.6;
          sd.x += (dx / dist) * force;
          sd.y += (dy / dist) * force;
        }
      }
    } else {
      const p = Math.min(1, bh.t / bh.collapseDuration);
      radius = BLACK_HOLE_RADIUS * (1 - p);
      ringAlpha = 1 - p;
      if (p >= 1) {
        spawnBlackHoleFlash(bh.x, bh.y);
        blackHole = null;
        syncBlackHoleBtn();
        return;
      }
    }

    ctx.save();

    const glowR = radius * 3.2;
    if (glowR > 0) {
      const glow = ctx.createRadialGradient(bh.x, bh.y, radius * 0.5, bh.x, bh.y, glowR);
      glow.addColorStop(0, `rgba(245, 245, 247, ${0.5 * ringAlpha})`);
      glow.addColorStop(0.4, `rgba(180, 180, 190, ${0.18 * ringAlpha})`);
      glow.addColorStop(1, 'rgba(180, 180, 190, 0)');
      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.arc(bh.x, bh.y, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer accretion ring, drifting one way
    ctx.save();
    ctx.translate(bh.x, bh.y);
    ctx.rotate(bh.ringAngle);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.9, radius * 0.62, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(245, 245, 247, ${0.55 * ringAlpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Inner accretion ring, drifting the other way — reads as a denser disk
    ctx.save();
    ctx.translate(bh.x, bh.y);
    ctx.rotate(-bh.ringAngle * 1.6 + Math.PI / 3);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.35, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(245, 245, 247, ${0.75 * ringAlpha})`;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.fillStyle = '#000000';
    ctx.arc(bh.x, bh.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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

  // Hit-test clicks against each planet's last-rendered screen position.
  // Planets are only interactive in observe mode (UI hidden via the eye
  // button). Clicking one there just zooms in; the info Card only opens
  // from the standout marker among the scattered curiosity points.
  // Zoomed view is exited only via the dedicated back button, never by
  // clicking elsewhere — that used to also fire on clicks inside the
  // Card itself (e.g. its close button), zooming back out unintentionally.
  window.addEventListener('click', (e) => {
    const observeMode = document.body.classList.contains('ui-hidden');
    if (!observeMode) return;

    if (focusIndex >= 0) {
      const fp = planets[focusIndex];

      // Marker click: the standout "card" marker opens the info Card,
      // any other marker just toggles its expanded caption
      if (fp.infoPoints) {
        for (let j = 0; j < fp.infoPoints.length; j++) {
          const pt = fp.infoPoints[j];
          if (pt.screenX === undefined) continue;
          const mdx = e.clientX - pt.screenX;
          const mdy = e.clientY - pt.screenY;
          if (Math.hypot(mdx, mdy) <= (pt.hitRadius || 13)) {
            if (pt.isCard) triggerPlanetEasterEgg(focusIndex, fp);
            else pt.expanded = !pt.expanded;
            return;
          }
        }
      }
      return;
    }

    // The black hole is only clickable (to collapse it) in observe mode
    if (isPointOnBlackHole(e.clientX, e.clientY)) {
      collapseBlackHole();
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
  });

  // Dedicated back button: the only way to exit a zoomed/focused planet.
  const backBtn = document.getElementById('planetBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (focusIndex >= 0) exitFocus();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && focusIndex >= 0) exitFocus();
  });

  // Hover tooltip + pointer cursor: only meaningful in observe mode, since
  // that's the only state where planets are actually clickable.
  function updateHoverState(mx, my) {
    const observeMode = document.body.classList.contains('ui-hidden');
    let hoverName = null;
    let showPointer = false;

    if (observeMode && focusIndex < 0) {
      if (isPointOnBlackHole(mx, my)) {
        hoverName = 'Agujero negro — clic para colapsar';
        showPointer = true;
      }

      for (let i = 0; i < planets.length && !hoverName; i++) {
        const p = planets[i];
        if (p.px === undefined) continue;
        const dx = mx - p.px;
        const dy = my - p.py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= (p.currentRadius || p.radius) * 1.4) {
          hoverName = p.name;
          showPointer = true;
          break;
        }
      }

      if (!hoverName && cancerBounds &&
        mx >= cancerBounds.x && mx <= cancerBounds.x + cancerBounds.w &&
        my >= cancerBounds.y && my <= cancerBounds.y + cancerBounds.h) {
        hoverName = 'Constelación de Cáncer';
      }
    }

    canvas.style.cursor = showPointer ? 'pointer' : 'default';

    if (!starTooltip) return;
    if (hoverName) {
      starTooltip.textContent = hoverName;
      starTooltip.style.opacity = '1';
      starTooltip.style.transform = `translate(${mx + 16}px, ${my - 12}px)`;
    } else {
      starTooltip.style.opacity = '0';
    }
  }

  // Mouse movement handlers
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    updateHoverState(e.clientX, e.clientY);
  });

  window.addEventListener('mouseleave', () => {
    mouse.targetX = -9999;
    mouse.targetY = -9999;
    canvas.style.cursor = 'default';
    if (starTooltip) starTooltip.style.opacity = '0';
  });

  window.addEventListener('resize', resize);

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

    // 1.5 Draw Cancer Constellation (observe mode only)
    const observeModeActive = document.body.classList.contains('ui-hidden');
    if (observeModeActive) {
      ctx.save();
      ctx.globalAlpha = 1 - dim * 0.85;
      drawCancerConstellation(time);
      ctx.restore();
    } else {
      cancerBounds = null;
    }

    // 1.6 Draw per-section constellations (cross-fade as sections scroll by)
    for (let i = 0; i < SECTION_CONSTELLATIONS.length; i++) {
      const c = SECTION_CONSTELLATIONS[i];
      c.alpha += (c.target - c.alpha) * 0.05;
      if (c.alpha > 0.01) {
        drawSectionConstellation(c, c.alpha * (1 - dim * 0.85), time);
      }
    }

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

      drawStationOrbitPath(p, sizeScale, width, height);
      drawStationIcon(p, sizeScale, width, height, 'back');

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

      drawStationIcon(p, sizeScale, width, height, 'front');

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

      if (i === focusIndex) drawInfoPoints(p, effRadius, focusProgress, time);
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

    // 7. Draw Black Hole ("agujero" keyword easter egg)
    updateAndDrawBlackHole();

    requestAnimationFrame(render);
  }

  resize();
  render();
}
