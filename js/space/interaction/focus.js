/**
 * =========================================================================
 * FOCUS CONTROLLER — the one source of truth for "which body is zoomed"
 * =========================================================================
 * Before, each planet module tracked its own `focused` flag and guarded
 * against the others through a shared body class. Now a single controller
 * owns it:
 *
 *   request(body)   focus a body (switching straight from another one);
 *                   if its assets aren't loaded yet, they start loading and
 *                   the focus lands as soon as they're ready
 *   exit()          back out to the resting view
 *
 * It keeps the same public contract the rest of the site relies on:
 *   - body.planet-focused class while something is focused (CSS: back
 *     button, hides the black-hole button / pan hint / ship HUD)
 *   - 'planet-focus-changed' CustomEvent ({ id, name } or null)
 *   - listens to the nav panel's 'nav-focus-planet' / 'nav-exit-focus' /
 *     'nav-rotate' / 'nav-zoom' events
 *
 * Escape now steps back one level at a time: an open info card closes
 * first (its own module handles that), then the focused planet, then — in
 * ui-toggle.js — observe mode itself.
 */

import { ease } from '../../modules/frame-loop.js';

export function isObserveMode() {
  return document.body.classList.contains('ui-hidden');
}

export function isCardOpen() {
  return document.body.classList.contains('star-lightbox-open');
}

export class FocusController {
  constructor(bodies) {
    this.bodies = bodies;
    this.current = null;
    this.pending = null;
    this.dim = 0;
    this._bind();
  }

  byId(id) {
    return this.bodies.find((b) => b.id === id) || null;
  }

  request(body) {
    if (!body || !isObserveMode() || body.failed) return;
    if (!body.ready) {
      this.pending = body;
      this._dispatchLoading(body);
      body.ensureLoaded();
      return;
    }
    this.pending = null;
    this.enter(body);
  }

  enter(body) {
    if (this.current === body) return;
    if (this.current) this.current.setFocused(false);
    this.current = body;
    body.setFocused(true);
    document.body.classList.add('planet-focused');
    window.dispatchEvent(new CustomEvent('planet-focus-changed', { detail: { id: body.id, name: body.name } }));
  }

  exit() {
    this.pending = null;
    if (!this.current) return;
    this.current.setFocused(false);
    this.current = null;
    document.body.classList.remove('planet-focused');
    window.dispatchEvent(new CustomEvent('planet-focus-changed', { detail: null }));
  }

  update(dt) {
    // Observe mode switched off (eye button / Escape) while zoomed: back out.
    if (this.current && !isObserveMode()) this.exit();
    if (this.pending && this.pending.ready) {
      const body = this.pending;
      this.pending = null;
      if (isObserveMode()) this.enter(body);
    }
    if (this.pending && this.pending.failed) this.pending = null;
    this.dim = ease(this.dim, this.current ? 1 : 0, 0.09, dt);
    if (this.dim < 0.001) this.dim = 0;
  }

  _dispatchLoading(body) {
    window.dispatchEvent(new CustomEvent('planet-loading', { detail: { id: body.id } }));
  }

  _bind() {
    const backBtn = document.getElementById('planetBackBtn');
    if (backBtn) backBtn.addEventListener('click', () => this.exit());

    window.addEventListener('nav-focus-planet', (e) => {
      const id = e.detail && (e.detail.id || e.detail.system);
      this.request(this.byId(id));
    });
    window.addEventListener('nav-exit-focus', () => this.exit());
    window.addEventListener('nav-rotate', (e) => {
      if (this.current) this.current.nudgeRotation(e.detail && e.detail.dir < 0 ? -1 : 1);
    });
    window.addEventListener('nav-zoom', (e) => {
      if (this.current) this.current.zoomBy(e.detail && e.detail.dir < 0 ? -0.15 : 0.15);
    });

    window.addEventListener('keydown', (e) => {
      if (!this.current || isCardOpen()) return;
      switch (e.key) {
        case 'Escape':
          this.exit();
          break;
        case 'ArrowLeft':
          this.current.nudgeRotation(-1);
          e.preventDefault();
          break;
        case 'ArrowRight':
          this.current.nudgeRotation(1);
          e.preventDefault();
          break;
        case 'ArrowUp':
        case '+':
        case '=':
          this.current.zoomBy(0.15);
          e.preventDefault();
          break;
        case 'ArrowDown':
        case '-':
          this.current.zoomBy(-0.15);
          e.preventDefault();
          break;
        default:
      }
    });
  }
}
