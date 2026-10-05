/**
 * =========================================================================
 * SMALL BODY — shared behavior for Alfa Muscae, El Lucero and TRAPPIST-1e
 * =========================================================================
 * The three bodies that used to be flat 2D gradients on the canvas. They
 * keep everything that made them recognizable, now in 3D:
 *   - their own section anchor and slow vertical float
 *   - the random digital-interference "glitch": a horizontal slice of the
 *     body jumps sideways for a few frames (vertex shader, see chunks.js)
 *   - the inverted-color glitch pulse when their info card is opened
 *   - a ring of curiosity markers + a gold card marker when focused
 *     (interaction/markers.js, text in portfolio-data.js)
 */

import { CelestialBody } from './body.js';
import { glitchUniforms } from '../shaders/chunks.js';
import { FOV } from '../core/math.js';

const HALF_FOV_TAN = Math.tan((FOV * Math.PI) / 360);

export class SmallBody extends CelestialBody {
  constructor(engine, config) {
    super(engine, config);
    this.bobAmplitude = 12;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.hitScale = 1.4; // small targets: forgiving click area, like the 2D ones
    this.extentScale = 3;
    this.idleSpinSpeed = 0.08;

    this.glitch = glitchUniforms();
    this.glitch.uGlitchBand.value = 0.16;
    this._glitchTimer = 5 + Math.random() * 7;
    this._glitchLeft = 0;
  }

  _pxToWorld(px) {
    const d = this.camera.position.z;
    return (px * 2 * d * HALF_FOV_TAN) / Math.max(1, this.engine.height);
  }

  /** Short random slice-shift; `invert` flips the colors too (card egg). */
  startGlitch(seconds, { invert = false, centered = false } = {}) {
    const g = this.glitch;
    g.uGlitch.value = 1;
    g.uGlitchY.value = centered ? 0 : (Math.random() - 0.5) * this.radius * 1.2;
    const px = centered ? 6 : (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 5);
    g.uGlitchShift.value = this._pxToWorld(px);
    g.uInvert.value = invert ? 1 : 0;
    this._glitchLeft = seconds;
  }

  /** The card marker's easter egg; subclasses can add to it. */
  triggerEasterEgg() {
    this.startGlitch(this.engine.reducedMotion ? 0.14 : 0.34, { invert: true, centered: true });
  }

  tick(dt, t, ctx) {
    if (this._glitchLeft > 0) {
      this._glitchLeft -= dt;
      if (this._glitchLeft <= 0) {
        this.glitch.uGlitch.value = 0;
        this.glitch.uInvert.value = 0;
      }
    } else if (!this.engine.reducedMotion) {
      this._glitchTimer -= dt;
      if (this._glitchTimer <= 0) {
        this.startGlitch(0.1 + Math.random() * 0.1);
        this._glitchTimer = 5 + Math.random() * 7;
      }
    }
    this.animate(dt, t, ctx);
  }

  /** Subclass hook (tick is taken by the glitch timing). */
  animate() {}
}
