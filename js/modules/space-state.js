/**
 * =========================================================================
 * SPACE STATE — the contract between the 2D canvas and the 3D layer
 * =========================================================================
 * A plain shared object (no Three.js import, so the 2D canvas can read it
 * even if WebGL never loads):
 *
 *   webgl       true once the Three.js layer is up and rendering
 *   focus       which body is focused (id) and an eased 0..1 "dim" factor
 *               the 2D canvas uses to fade the starfield behind it
 *   bodies      per-body screen position, written by js/space/ every frame
 *               (the 2D canvas draws Musca's stick figure around Alfa
 *               Muscae's live position, for example)
 *   blackHole   the black hole's state, written by universe-bg.js (which
 *               owns its trigger/timing/stardust pull) and drawn by the
 *               WebGL lensing shader in js/space/effects/black-hole.js
 *
 * It also arbitrates the shared hover tooltip (#starTooltip): both layers
 * can claim it, the 3D layer wins ties.
 */

export const spaceState = {
  webgl: false,
  focus: { id: null, dim: 0 },
  bodies: {},
  blackHole: null
};

const TOOLTIP_PRIORITY = { space3d: 2, canvas2d: 1 };
const claims = new Map();
let tooltipEl = null;

/**
 * Shows `text` next to (x, y) on behalf of `owner`, or releases that owner's
 * claim when `text` is null. The highest-priority active claim is shown.
 */
export function claimTooltip(owner, text, x = 0, y = 0) {
  if (text) claims.set(owner, { text, x, y });
  else claims.delete(owner);

  if (!tooltipEl) tooltipEl = document.getElementById('starTooltip');
  if (!tooltipEl) return;

  let best = null;
  let bestPriority = -1;
  claims.forEach((claim, key) => {
    const p = TOOLTIP_PRIORITY[key] || 0;
    if (p > bestPriority) {
      best = claim;
      bestPriority = p;
    }
  });

  if (best) {
    if (tooltipEl.textContent !== best.text) tooltipEl.textContent = best.text;
    tooltipEl.style.transform = `translate(${best.x + 16}px, ${best.y - 12}px)`;
    tooltipEl.style.opacity = '1';
  } else {
    tooltipEl.style.opacity = '0';
  }
}
