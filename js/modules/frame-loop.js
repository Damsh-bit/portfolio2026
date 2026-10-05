/**
 * =========================================================================
 * FRAME LOOP — one requestAnimationFrame for every animated layer
 * =========================================================================
 * The 2D starfield (universe-bg.js), the keyboard space-pan and the whole
 * Three.js layer (js/space/) all subscribe here instead of each running
 * their own rAF loop. That gives them:
 *   - a deterministic order every frame (lower `order` runs first), so the
 *     3D bodies publish their screen positions before the 2D canvas reads
 *     them (no one-frame lag between a star and its constellation lines);
 *   - one shared delta time in seconds, so motion runs at the same speed
 *     on a 60 Hz laptop and a 144 Hz monitor;
 *   - isolation: a subscriber that throws is logged and skipped for that
 *     frame instead of silently killing every other animation on the page.
 */

const subscribers = [];
let rafId = 0;
let lastTime = 0;
let elapsed = 0;

// Long gaps (tab in background, debugger pause) are clamped so nothing
// "teleports" when the page comes back.
const MAX_DT = 1 / 15;

function tick(now) {
  rafId = requestAnimationFrame(tick);

  const dt = lastTime ? Math.min((now - lastTime) / 1000, MAX_DT) : 1 / 60;
  lastTime = now;
  elapsed += dt;

  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i].fn(dt, elapsed);
    } catch (err) {
      console.error('[frame-loop]', err);
    }
  }
}

/**
 * Registers `fn(dt, elapsed)` to run every frame. Returns an unsubscribe
 * function.
 */
export function onFrame(fn, order = 0) {
  const entry = { fn, order };
  subscribers.push(entry);
  subscribers.sort((a, b) => a.order - b.order);
  if (!rafId) rafId = requestAnimationFrame(tick);

  return () => {
    const i = subscribers.indexOf(entry);
    if (i >= 0) subscribers.splice(i, 1);
  };
}

/**
 * Runs `count` frames synchronously (debug/testing only: lets a test
 * harness advance animations when the tab isn't painting).
 */
export function stepFrames(count = 1, dt = 1 / 60) {
  for (let n = 0; n < count; n++) {
    elapsed += dt;
    for (let i = 0; i < subscribers.length; i++) {
      try {
        subscribers[i].fn(dt, elapsed);
      } catch (err) {
        console.error('[frame-loop]', err);
      }
    }
  }
}

/**
 * Frame-rate independent version of `value += (target - value) * factor`,
 * where `factor` is the per-frame ease the code was tuned with at 60 fps.
 */
export function ease(value, target, factor, dt) {
  return value + (target - value) * (1 - Math.pow(1 - factor, dt * 60));
}

/** Frame-rate independent version of `value *= factor` (per 60 fps frame). */
export function decay(value, factor, dt) {
  return value * Math.pow(factor, dt * 60);
}
