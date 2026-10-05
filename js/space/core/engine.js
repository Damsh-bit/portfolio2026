/**
 * =========================================================================
 * ENGINE — the single WebGL renderer behind every 3D body and effect
 * =========================================================================
 * The old setup ran four WebGLRenderers (Earth, Saturn, Coruscant, black
 * hole), each on its own fullscreen canvas with its own render loop. Now
 * there is exactly one context and one canvas: every layer keeps its own
 * scene + camera (that's what lets each body sit at its own section anchor
 * through an off-axis projection), and they're all drawn into the same
 * framebuffer, back to front, with a depth clear between layers.
 *
 * It also owns:
 *   - resize handling (ignoring the mobile URL-bar height jitter that used
 *     to reallocate every drawing buffer while scrolling)
 *   - adaptive resolution: if frames stay slow, the pixel ratio steps down
 *   - skipping the GPU entirely while nothing 3D is on screen
 *   - WebGL context loss / restore
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const SLOW_FRAME = 1 / 42; // seconds
const SLOW_WINDOW = 2.5; // seconds of sustained slowness before stepping down

export class Engine {
  constructor(canvas) {
    // Throws if WebGL is unavailable — the caller treats that as "no 3D".
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    const r = this.renderer;
    r.setClearColor(0x000000, 0);
    r.autoClear = false;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1;

    this.canvas = canvas;
    this.width = 0;
    this.height = 0;
    this.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.pixelRatio = this.maxPixelRatio;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isTouch = window.matchMedia('(pointer: coarse)').matches;
    this.contextLost = false;
    this.environment = null;

    this._slowFor = 0;
    this._frameAvg = 1 / 60;
    this._wasEmpty = false;

    this.resize(true);
    window.addEventListener('resize', () => this.resize(false));

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.contextLost = true;
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.contextLost = false;
    });
  }

  get maxAnisotropy() {
    return this.renderer.capabilities.getMaxAnisotropy();
  }

  resize(force) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // On phones the URL bar slides in/out while scrolling, firing resize
    // with a slightly different height each time. Keep the (taller)
    // buffer instead of reallocating it on every scroll gesture.
    if (!force && this.isTouch && w === this.width && h <= this.height && this.height - h < 160) {
      return;
    }
    this.width = w;
    this.height = h;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(w, h);
  }

  /** Shared image-based light for the NASA models (planets use their own shaders). */
  getEnvironment() {
    if (!this.environment) {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    }
    return this.environment;
  }

  /** Compiles a scene's shaders off the critical path (parallel compile where supported). */
  compile(scene, camera) {
    return this.renderer.compileAsync(scene, camera).catch(() => {});
  }

  _adaptResolution(dt) {
    this._frameAvg += (dt - this._frameAvg) * 0.05;
    if (this._frameAvg > SLOW_FRAME && this.pixelRatio > 1) {
      this._slowFor += dt;
      if (this._slowFor > SLOW_WINDOW) {
        this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height);
        this._slowFor = 0;
        this._frameAvg = 1 / 60;
      }
    } else {
      this._slowFor = Math.max(0, this._slowFor - dt);
    }
  }

  /**
   * Draws every renderable layer (objects with isRenderable() / render(renderer)),
   * in order, into the one framebuffer.
   */
  render(layers, dt, anyActiveWork) {
    if (this.contextLost) return;

    const r = this.renderer;
    let drawn = 0;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (!layer.isRenderable()) continue;
      if (drawn === 0) r.clear();
      else r.clearDepth();
      layer.render(r);
      drawn++;
    }

    if (drawn === 0) {
      // Nothing 3D on screen: clear once, then leave the GPU alone.
      if (!this._wasEmpty) r.clear();
      this._wasEmpty = true;
      return;
    }

    this._wasEmpty = false;
    if (anyActiveWork) this._adaptResolution(dt);
  }
}
