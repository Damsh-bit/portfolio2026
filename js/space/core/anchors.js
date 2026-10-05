/**
 * =========================================================================
 * SECTION ANCHORS
 * =========================================================================
 * Each body is parked over a point of its own page section (see
 * config.js). Section boxes move as the page scrolls, so they're read
 * fresh every frame — in one batch, before anything is written to the DOM
 * that frame, so it never forces an extra layout.
 */

export class Anchors {
  constructor() {
    this.entries = new Map();
  }

  track(sectionId) {
    if (this.entries.has(sectionId)) return;
    this.entries.set(sectionId, {
      el: document.getElementById(sectionId),
      left: 0,
      top: 0,
      width: 0,
      height: 0
    });
  }

  update(viewportWidth, viewportHeight) {
    this.entries.forEach((entry) => {
      if (entry.el) {
        const r = entry.el.getBoundingClientRect();
        entry.left = r.left;
        entry.top = r.top;
        entry.width = r.width;
        entry.height = r.height;
      } else {
        entry.left = 0;
        entry.top = 0;
        entry.width = viewportWidth;
        entry.height = viewportHeight;
      }
    });
  }

  /** Screen point (px) at fraction (fx, fy) of the section's current box. */
  point(sectionId, fx, fy, target) {
    const e = this.entries.get(sectionId);
    target.x = e.left + e.width * fx;
    target.y = e.top + e.height * fy;
    return target;
  }
}
