/**
 * =========================================================================
 * CELESTIAL BODY — base class for every navigable 3D body
 * =========================================================================
 * Everything the old space-scene*.js files each re-implemented (three
 * near-identical copies) lives here once:
 *
 *   - its own scene + camera. The body never moves: the camera dollies
 *     in/out, and an off-axis projection (camera.setViewOffset) parks the
 *     body over its section anchor — undistorted, wherever it is on screen
 *   - sizes in screen terms (config.js): resting / focused / max-zoom radius
 *     as a fraction of the viewport, recomputed on every resize
 *   - drag-to-rotate with release inertia, idle spin, wheel/pinch zoom
 *     (only while focused), all in real seconds (frame-rate independent)
 *   - fade-in once its assets are ready, dimming while another body is
 *     focused, and screen-space culling so off-screen bodies cost nothing
 *
 * Subclasses implement build() (create meshes, await textures/models) and
 * optionally tick(dt, t, ctx) for their own animation.
 */

import * as THREE from 'three';
import { ease, decay } from '../../modules/frame-loop.js';
import {
  FOV,
  clamp,
  lerp,
  distanceForScreenRadius,
  screenRadiusAtDistance
} from '../core/math.js';
import { SUN_DIRECTION } from '../config.js';

const ROTATE_PER_PX = 0.006; // radians of spin per dragged pixel
const PITCH_LIMIT = 1.3;
const INERTIA = 0.92; // per-60fps-frame velocity retention after release
const FOCUS_EASE = 0.065;
const DIMMED_OPACITY = 0.1;

export class CelestialBody {
  constructor(engine, config) {
    this.engine = engine;
    this.config = config;
    this.id = config.id;
    this.name = config.name;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 100);
    this.root = new THREE.Group(); // receives the user's yaw/pitch
    this.scene.add(this.root);

    // Tunables subclasses override in their constructor.
    this.radius = 1; // world radius of the main sphere
    this.hitScale = 1.05; // click/hover radius, multiple of the silhouette
    this.extentScale = 1.4; // culling extent (rings, glow), multiple of the silhouette
    this.idleSpinSpeed = 0.1; // rad/s while untouched
    this.bobAmplitude = 0; // px of slow vertical float at rest
    this.bobPhase = 0;
    this.yaw = 0;
    this.pitch = 0;

    this.yawVelocity = 0; // rad/s
    this.pitchVelocity = 0;
    this.dragging = false;

    this.focused = false;
    this.focusMix = 0; // 0 = resting at anchor, 1 = centered close-up
    this.zoom = 0; // 0 = focus distance, 1 = max zoom
    this.zoomTarget = 0;
    this.hover = 0;
    this.hovered = false;

    this.opacity = 0;
    this.ready = false;
    this.failed = false;
    this._loading = null;
    this._standardMaterials = [];

    this.screen = { x: -9999, y: -9999, r: 0, visible: false };
    this._anchor = { x: 0, y: 0 };

    // Uniforms shared by reference across every material of this body.
    this.shared = {
      uSunDir: { value: new THREE.Vector3(...SUN_DIRECTION).normalize() },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uCloudShift: { value: 0 }
    };
  }

  /** Subclass hook: create meshes. May be async (textures/models). */
  async build() {}

  /** Subclass hook: per-frame animation, after the base update. */
  tick() {}

  /** Subclass hook: focus entered/left. */
  onFocusChange() {}

  ensureLoaded() {
    if (!this._loading) {
      this._loading = (async () => {
        try {
          await this.build();
          await this.engine.compile(this.scene, this.camera);
          this.ready = true;
        } catch (err) {
          this.failed = true;
          console.warn(`[space] ${this.id} failed to load:`, err);
        }
      })();
    }
    return this._loading;
  }

  /** Registers a regular three.js material so it follows the body's fade/dim. */
  trackMaterial(material) {
    material.transparent = true;
    material.userData.baseOpacity = material.opacity;
    this._standardMaterials.push(material);
    return material;
  }

  /** Tracks every material under `object` (e.g. a loaded NASA model). */
  trackObject(object) {
    object.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => this.trackMaterial(m));
    });
  }

  /** Lights + image-based reflections for the regular-material props (probes, moons). */
  addPropLighting({ sunIntensity = 2.2, ambient = 0.12, sunColor = 0xffffff, envIntensity = 0.35 } = {}) {
    const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
    sun.position.copy(this.shared.uSunDir.value).multiplyScalar(20);
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0xffffff, ambient));
    this.scene.environment = this.engine.getEnvironment();
    this.scene.environmentIntensity = envIntensity;
  }

  setFocused(focused) {
    if (this.focused === focused) return;
    this.focused = focused;
    this.zoomTarget = 0;
    this.onFocusChange(focused);
  }

  // ---------------------------------------------------------------------
  // Gestures (called by interaction/pointer.js and the nav panel)
  // ---------------------------------------------------------------------

  beginDrag() {
    this.dragging = true;
    this.yawVelocity = 0;
    this.pitchVelocity = 0;
    this._dragSamples = [];
  }

  /** `time` is the pointer event's timeStamp (ms). */
  dragBy(dx, dy, time) {
    this.yaw += dx * ROTATE_PER_PX;
    this.pitch = clamp(this.pitch + dy * ROTATE_PER_PX, -PITCH_LIMIT, PITCH_LIMIT);
    const samples = this._dragSamples;
    samples.push({ time, yaw: this.yaw, pitch: this.pitch });
    while (samples.length > 2 && time - samples[0].time > 120) samples.shift();
  }

  /**
   * Release velocity = rotation over the last ~120 ms of real time (not per
   * event), clamped — so a flick feels the same on a 125 Hz or a 1000 Hz
   * mouse, and a burst of events can't fling the planet around wildly.
   */
  endDrag(time) {
    this.dragging = false;
    const samples = this._dragSamples || [];
    this._dragSamples = [];
    const last = samples[samples.length - 1];
    if (!last || time - last.time > 80 || samples.length < 2) return; // held still: no flick
    const first = samples[0];
    const span = Math.max((last.time - first.time) / 1000, 1 / 60);
    const MAX = 8; // rad/s
    this.yawVelocity = clamp((last.yaw - first.yaw) / span, -MAX, MAX);
    this.pitchVelocity = clamp((last.pitch - first.pitch) / span, -MAX, MAX);
  }

  nudgeRotation(direction) {
    this.yawVelocity = direction * 3; // rad/s, decays like a released drag
  }

  zoomBy(delta) {
    if (!this.focused) return;
    this.zoomTarget = clamp(this.zoomTarget + delta, 0, 1);
  }

  hitTest(x, y) {
    if (!this.ready || !this.screen.visible || this.opacity < 0.2) return false;
    const r = Math.max(this.screen.r * this.hitScale, 14);
    const dx = x - this.screen.x;
    const dy = y - this.screen.y;
    return dx * dx + dy * dy <= r * r;
  }

  // ---------------------------------------------------------------------
  // Frame update
  // ---------------------------------------------------------------------

  update(dt, t, ctx) {
    const { width: w, height: h, reference, anchors, pan, focusId, reducedMotion } = ctx;

    // Keep publishing the resting anchor even before load, so the 2D
    // canvas can place things around it (e.g. Musca's lines).
    anchors.point(this.config.sectionId, this.config.anchor.x, this.config.anchor.y, this._anchor);
    const bob = this.bobAmplitude && !reducedMotion ? Math.sin(t * 0.12 + this.bobPhase) * this.bobAmplitude : 0;
    const restX = this._anchor.x - pan.x;
    const restY = this._anchor.y - pan.y + bob;

    if (!this.ready) {
      this.screen.x = restX;
      this.screen.y = restY;
      this.screen.r = this.config.size.idle * reference;
      this.screen.visible = false;
      return;
    }

    // --- focus / zoom easing
    this.focusMix = ease(this.focusMix, this.focused ? 1 : 0, FOCUS_EASE, dt);
    if (Math.abs(this.focusMix - (this.focused ? 1 : 0)) < 0.0005) this.focusMix = this.focused ? 1 : 0;
    this.zoom = ease(this.zoom, this.zoomTarget, 0.12, dt);
    this.hover = ease(this.hover, this.hovered && !this.focused ? 1 : 0, 0.12, dt);

    const size = this.config.size;
    const R = this.radius;
    const dRest = distanceForScreenRadius(R, size.idle * reference * (1 + this.hover * 0.04), h);
    const dFocus = distanceForScreenRadius(R, size.focus * reference, h);
    const dZoom = distanceForScreenRadius(R, size.zoom * reference, h);
    const dFocused = Math.exp(lerp(Math.log(dFocus), Math.log(dZoom), this.zoom));
    // Dolly in log space: the approach reads as a steady flight rather than
    // crawling the last stretch.
    const distance = Math.exp(lerp(Math.log(dRest), Math.log(dFocused), this.focusMix));

    // Center: section anchor at rest, viewport center when focused.
    const s = this.focusMix * this.focusMix * (3 - 2 * this.focusMix);
    const cx = lerp(restX, w / 2, s);
    const cy = lerp(restY, h / 2, s);

    const cam = this.camera;
    cam.aspect = w / h;
    cam.near = Math.max(0.005, (distance - R * this.extentScale * 2) * 0.5);
    cam.far = distance + R * 12;
    cam.position.set(0, 0, distance);
    cam.setViewOffset(w, h, w / 2 - cx, h / 2 - cy, w, h); // also updates the projection

    // --- rotation: drag inertia, then idle spin
    if (!this.dragging) {
      this.yaw += this.yawVelocity * dt;
      this.pitch = clamp(this.pitch + this.pitchVelocity * dt, -PITCH_LIMIT, PITCH_LIMIT);
      this.yawVelocity = decay(this.yawVelocity, INERTIA, dt);
      this.pitchVelocity = decay(this.pitchVelocity, INERTIA, dt);
      if (Math.abs(this.yawVelocity) < 0.003) this.yawVelocity = 0;
      if (Math.abs(this.pitchVelocity) < 0.003) this.pitchVelocity = 0;
      if (!this.yawVelocity && !this.pitchVelocity && !reducedMotion) this.idleSpin(dt);
    }
    this.root.rotation.set(this.pitch, this.yaw, 0);
    this.root.updateMatrixWorld(true);

    // --- fade in on load, dim while another body is focused
    const target = focusId && focusId !== this.id ? DIMMED_OPACITY : 1;
    this.opacity = ease(this.opacity, target, 0.05, dt);
    this.shared.uOpacity.value = this.opacity;
    for (let i = 0; i < this._standardMaterials.length; i++) {
      const m = this._standardMaterials[i];
      m.opacity = m.userData.baseOpacity * this.opacity;
    }

    // --- screen footprint (published + used for culling/hit tests)
    const r = screenRadiusAtDistance(R, distance, h);
    this.screen.x = cx;
    this.screen.y = cy;
    this.screen.r = r;
    const ext = r * this.extentScale + 24;
    this.screen.visible =
      this.opacity > 0.004 && cx + ext > 0 && cx - ext < w && cy + ext > 0 && cy - ext < h;

    this.shared.uTime.value = t;
    this.tick(dt, t, ctx);
  }

  /** Default idle motion: slow spin about the vertical axis. */
  idleSpin(dt) {
    this.yaw += this.idleSpinSpeed * dt;
  }

  isRenderable() {
    return this.ready && this.screen.visible;
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }
}
