/**
 * =========================================================================
 * SPACE CONFIG — the 3D bodies, in page-scroll order
 * =========================================================================
 * Pure data (no Three.js import): the planet nav panel reads this list to
 * build its dots, so it works — and degrades cleanly — even before (or
 * without) the WebGL layer.
 *
 * One body per page section, each parked over its own section's box:
 *   anchor.x / anchor.y   fraction of THAT section's box (not the viewport),
 *                         so the body holds its place on the page and
 *                         scrolls away with it like a real object
 *   size.idle             on-screen radius at rest, as a fraction of the
 *                         viewport's reference size (see core/math.js)
 *   size.focus            on-screen radius once clicked/focused
 *   size.zoom             closest the wheel/pinch zoom can get
 *
 * Editable text (captions, cards) lives in js/data/portfolio-data.js.
 */

export const BODIES = [
  {
    id: 'earth',
    name: 'Tierra',
    sectionId: 'hero',
    anchor: { x: 0.86, y: 0.24 },
    size: { idle: 0.105, focus: 0.36, zoom: 0.72 },
    load: () => import('./bodies/earth.js')
  },
  {
    id: 'saturn',
    name: 'Saturno',
    sectionId: 'work',
    // Near the very top of "work" (before the project grid starts, which
    // fills the section's full width with opaque cards).
    anchor: { x: 0.87, y: 0.05 },
    size: { idle: 0.12, focus: 0.21, zoom: 0.42 },
    load: () => import('./bodies/saturn.js')
  },
  {
    id: 'alfa-muscae',
    name: 'Alfa Muscae',
    sectionId: 'industries',
    anchor: { x: 0.88, y: 0.09 },
    size: { idle: 0.036, focus: 0.27, zoom: 0.5 },
    load: () => import('./bodies/alfa-muscae.js')
  },
  {
    id: 'coruscant',
    name: 'Coruscant',
    sectionId: 'experience',
    anchor: { x: 0.1, y: 0.06 },
    size: { idle: 0.16, focus: 0.36, zoom: 0.72 },
    load: () => import('./bodies/coruscant.js')
  },
  {
    id: 'el-lucero',
    name: 'El Lucero',
    sectionId: 'about',
    anchor: { x: 0.9, y: 0.15 },
    size: { idle: 0.027, focus: 0.24, zoom: 0.5 },
    load: () => import('./bodies/el-lucero.js')
  },
  {
    id: 'trappist-1e',
    name: 'TRAPPIST-1e',
    sectionId: 'contact',
    anchor: { x: 0.85, y: 0.22 },
    size: { idle: 0.03, focus: 0.3, zoom: 0.6 },
    load: () => import('./bodies/trappist.js')
  }
];

// One sun for every scene (direction the light comes FROM, in camera
// space: upper-right, slightly in front) so all bodies read as lit by the
// same star.
export const SUN_DIRECTION = [4, 2.2, 5];

export const ASSET_BASE = 'assets/space/';
