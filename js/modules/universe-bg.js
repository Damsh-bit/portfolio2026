/**
 * =========================================================================
 * UNIVERSE CANVAS ANIMATION ENGINE
 * =========================================================================
 * Minimalist space universe background featuring twinkling starfields,
 * floating glowing planets with ring systems, cosmic dust, and cursor interaction.
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
  const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };

  // Responsive setup
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    createStars();
    createStardust();
    createPlanets();
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
        color: Math.random() > 0.45 ? 'rgba(245, 243, 255, ' : 'rgba(192, 132, 252, '
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
        color: Math.random() > 0.5 ? '#a855f7' : '#c084fc'
      });
    }
  }

  // Create minimalist celestial planets
  function createPlanets() {
    planets = [
      {
        // Violet Gas Giant with subtle ring
        relX: 0.85,
        relY: 0.22,
        radius: 42,
        ringRadiusX: 75,
        ringRadiusY: 18,
        tilt: -0.25,
        colorCore: '#a855f7',
        colorEdge: '#3b0764',
        glowColor: 'rgba(168, 85, 247, 0.25)',
        ringColor: 'rgba(192, 132, 252, 0.4)',
        floatOffset: 0,
        floatSpeed: 0.001
      },
      {
        // Small Distant Violet Orb
        relX: 0.12,
        relY: 0.72,
        radius: 22,
        ringRadiusX: 0,
        ringRadiusY: 0,
        tilt: 0,
        colorCore: '#c084fc',
        colorEdge: '#581c87',
        glowColor: 'rgba(192, 132, 252, 0.2)',
        ringColor: 'transparent',
        floatOffset: Math.PI,
        floatSpeed: 0.0012
      },
      {
        // Deep Space Celestial Sphere
        relX: 0.78,
        relY: 0.85,
        radius: 14,
        ringRadiusX: 28,
        ringRadiusY: 7,
        tilt: 0.4,
        colorCore: '#e9d5ff',
        colorEdge: '#7c3aed',
        glowColor: 'rgba(233, 213, 255, 0.15)',
        ringColor: 'rgba(168, 85, 247, 0.3)',
        floatOffset: Math.PI * 0.5,
        floatSpeed: 0.0008
      }
    ];
  }

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

      ctx.save();
      ctx.translate(px, py);

      // Planet Glow Aura
      const glowGrad = ctx.createRadialGradient(0, 0, p.radius * 0.5, 0, 0, p.radius * 2.5);
      glowGrad.addColorStop(0, p.glowColor);
      glowGrad.addColorStop(1, 'rgba(7, 5, 16, 0)');
      ctx.beginPath();
      ctx.fillStyle = glowGrad;
      ctx.arc(0, 0, p.radius * 2.5, 0, Math.PI * 2);
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
        -p.radius * 0.3,
        -p.radius * 0.3,
        p.radius * 0.1,
        0,
        0,
        p.radius
      );
      planetGrad.addColorStop(0, p.colorCore);
      planetGrad.addColorStop(0.7, p.colorEdge);
      planetGrad.addColorStop(1, '#070510');

      ctx.beginPath();
      ctx.fillStyle = planetGrad;
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

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

          // Connect stardust near cursor with violet laser lines
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.3 * factor})`;
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

    requestAnimationFrame(render);
  }

  resize();
  render();
}
