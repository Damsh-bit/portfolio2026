/**
 * =========================================================================
 * SPACE PAN — free-roam keyboard controls for observe mode
 * =========================================================================
 * A shared pixel offset (panOffset) that every background layer adds to its
 * own on-screen position each frame: the 2D starfield/constellations in
 * universe-bg.js, and the resting position of every 3D body (js/space/).
 * Arrow keys / WASD nudge it, gated to observe mode with nothing focused,
 * since that's the only state where no planet is already claiming the
 * arrow keys (a focused planet uses them to rotate/zoom). No on-screen
 * controls — keyboard-only input plus the quiet text hint in index.html.
 *
 * Sign convention: panOffset.x/y grow while holding right/down. Consumers
 * SUBTRACT panOffset from their own screen-space X/Y — content slides away
 * from the pressed direction, the usual camera-pan feel.
 */

import { onFrame, ease } from './frame-loop.js';

export const panOffset = { x: 0, y: 0 };

const PAN_MAX = 520;
const PAN_SPEED = 780; // px/s while a direction is held
const EASE = 0.08;

let targetX = 0;
let targetY = 0;
const held = new Set();

function clamp(v, max) {
  return Math.max(-max, Math.min(max, v));
}

function isObserveMode() {
  return document.body.classList.contains('ui-hidden');
}

function isFreeToRoam() {
  return isObserveMode() && !document.body.classList.contains('planet-focused');
}

const KEY_DIRS = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right'
};

export function initSpacePan() {
  window.addEventListener('keydown', (e) => {
    const dir = KEY_DIRS[e.key];
    if (!dir || !isFreeToRoam()) return;
    e.preventDefault();
    held.add(dir);
  });
  window.addEventListener('keyup', (e) => {
    const dir = KEY_DIRS[e.key];
    if (dir) held.delete(dir);
  });
  window.addEventListener('blur', () => held.clear());

  // Runs before every visual layer (order 0) so they all read this frame's offset.
  onFrame((dt) => {
    if (!isObserveMode()) {
      // Leaving observe mode entirely always recenters, so the page never
      // stays visually shifted once the normal UI is back.
      held.clear();
      targetX = 0;
      targetY = 0;
    } else if (!isFreeToRoam()) {
      held.clear();
    } else {
      const step = PAN_SPEED * dt;
      if (held.has('up')) targetY = clamp(targetY - step, PAN_MAX);
      if (held.has('down')) targetY = clamp(targetY + step, PAN_MAX);
      if (held.has('left')) targetX = clamp(targetX - step, PAN_MAX);
      if (held.has('right')) targetX = clamp(targetX + step, PAN_MAX);
    }

    panOffset.x = ease(panOffset.x, targetX, EASE, dt);
    panOffset.y = ease(panOffset.y, targetY, EASE, dt);
  }, 0);
}
