/**
 * =========================================================================
 * POINTER ROUTER — one set of listeners for every 3D body
 * =========================================================================
 * The old modules each attached their own window pointerdown/move/up/wheel
 * listeners and raced each other. Here one router decides which body a
 * gesture belongs to (the focused one first, otherwise the closest hit),
 * then:
 *   click (no drag)  -> focus that body
 *   drag             -> spin it, with inertia on release
 *   wheel / pinch    -> zoom (focused body only)
 *   hover            -> name tooltip + cursor highlight (observe mode)
 *
 * Bodies are only interactive in observe mode (UI hidden), same as before.
 * New: on touch screens, a gesture that starts ON a body no longer scrolls
 * the page underneath it (that used to cancel the drag halfway).
 */

import { claimTooltip } from '../../modules/space-state.js';
import { isObserveMode, isCardOpen } from './focus.js';

const DRAG_THRESHOLD = 8; // px before a press becomes a drag
const UI_SELECTOR = 'button, a, input, textarea, select, .planet-nav, .star-card, .chat-panel, .space-marker, .space-info';

export class PointerRouter {
  constructor(bodies, focus) {
    this.bodies = bodies;
    this.focus = focus;
    this.gesture = null;
    this.touches = new Map();
    this.pinchDistance = null;
    this.mouse = { x: 0, y: 0, moved: false, inside: false };
    this.hoveredBody = null;
    this._bind();
  }

  /** Topmost body under the point: the focused one wins, else the nearest center. */
  pick(x, y) {
    const current = this.focus.current;
    if (current) return current.hitTest(x, y) ? current : null;
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      if (!b.hitTest(x, y)) continue;
      const d = Math.hypot(x - b.screen.x, y - b.screen.y) / Math.max(b.screen.r, 1);
      if (d < bestDist) {
        bestDist = d;
        best = b;
      }
    }
    return best;
  }

  _canInteract(e) {
    if (!isObserveMode() || isCardOpen()) return false;
    const t = e.target;
    return !(t && t.closest && t.closest(UI_SELECTOR));
  }

  _bind() {
    window.addEventListener('pointerdown', (e) => this._down(e));
    window.addEventListener('pointermove', (e) => this._move(e));
    window.addEventListener('pointerup', (e) => this._up(e));
    window.addEventListener('pointercancel', (e) => this._up(e, true));
    window.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
    document.documentElement.addEventListener('mouseleave', () => {
      this.mouse.inside = false;
      this.mouse.moved = true;
    });

    // Touch: claim the gesture (no page scroll / browser zoom) only when it
    // starts on a body, or while pinching a focused one.
    window.addEventListener('touchstart', (e) => {
      if (!this._canInteract(e)) return;
      const t = e.touches[0];
      if ((t && this.pick(t.clientX, t.clientY)) || (e.touches.length > 1 && this.focus.current)) {
        e.preventDefault();
      }
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      if (this.gesture || (this.pinchDistance !== null && this.focus.current)) e.preventDefault();
    }, { passive: false });
  }

  _down(e) {
    if (e.pointerType === 'touch') this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.gesture || !this._canInteract(e)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const body = this.pick(e.clientX, e.clientY);
    if (!body) return;

    this.gesture = {
      body,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      dragging: false
    };
  }

  _move(e) {
    if (e.pointerType === 'mouse') {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.moved = true;
      this.mouse.inside = true;
    }

    if (e.pointerType === 'touch' && this.touches.has(e.pointerId)) {
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.touches.size >= 2) {
        this._pinch();
        return;
      }
    }

    const g = this.gesture;
    if (!g || g.pointerId !== e.pointerId) return;

    if (!g.dragging && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > DRAG_THRESHOLD) {
      g.dragging = true;
      g.body.beginDrag();
      document.body.classList.add('space-dragging');
    }
    if (g.dragging) g.body.dragBy(e.clientX - g.lastX, e.clientY - g.lastY, e.timeStamp);
    g.lastX = e.clientX;
    g.lastY = e.clientY;
  }

  _up(e, cancelled = false) {
    if (e.pointerType === 'touch') {
      this.touches.delete(e.pointerId);
      if (this.touches.size < 2) this.pinchDistance = null;
    }
    const g = this.gesture;
    if (!g || g.pointerId !== e.pointerId) return;
    this.gesture = null;
    document.body.classList.remove('space-dragging');

    if (g.dragging) {
      g.body.endDrag(e.timeStamp);
    } else if (!cancelled && !g.body.focused) {
      this.focus.request(g.body);
    }
  }

  _pinch() {
    const pts = [...this.touches.values()];
    const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    const body = this.focus.current;
    if (this.pinchDistance !== null && body && isObserveMode()) {
      body.zoomBy((d - this.pinchDistance) * 0.006);
    }
    this.pinchDistance = d;
    // A pinch is never also a drag.
    if (this.gesture) {
      if (this.gesture.dragging) this.gesture.body.endDrag(Infinity);
      this.gesture = null;
    }
  }

  _wheel(e) {
    const body = this.focus.current;
    if (!body || !isObserveMode() || isCardOpen()) return;
    e.preventDefault();
    // Normalize line/page deltas to pixels, then ~6 notches across the range.
    const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    body.zoomBy(-px * 0.0017);
  }

  /** Per-frame hover pass (after bodies have updated their screen positions). */
  update() {
    let target = null;
    if (this.mouse.inside && isObserveMode() && !this.focus.current && !this.gesture && !isCardOpen()) {
      target = this.pick(this.mouse.x, this.mouse.y);
    }
    if (target !== this.hoveredBody) {
      if (this.hoveredBody) this.hoveredBody.hovered = false;
      if (target) target.hovered = true;
      this.hoveredBody = target;
      document.body.classList.toggle('space-hover', !!target);
    }
    if (target) {
      claimTooltip('space3d', target.name, this.mouse.x, this.mouse.y);
      this._tooltipClaimed = true;
    } else if (this._tooltipClaimed) {
      claimTooltip('space3d', null);
      this._tooltipClaimed = false;
    }
  }
}
