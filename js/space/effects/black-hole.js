/**
 * =========================================================================
 * BLACK HOLE — the "agujero" easter egg, drawn as a lensing shader
 * =========================================================================
 * universe-bg.js still owns the trigger (typing "agujero" / the observe-
 * mode button), the forming/active/collapsing timing, the stardust pull and
 * the click-to-collapse; it publishes the state to spaceState.blackHole and
 * this layer draws it, last, over everything else in the WebGL canvas.
 *
 * Upgrades over the old shader:
 *   - real point-lens mapping (image at θ samples the source at θ − θE²/θ):
 *     background stars smear into arcs and an Einstein ring instead of a
 *     plain radial pinch
 *   - it lenses the 3D bodies too, not only the 2D starfield (the frame's
 *     own WebGL output is copied and warped)
 *   - an inclined, differentially rotating accretion disk with Doppler
 *     beaming, the lensed far side arcing over the shadow, a photon ring
 *   - only a crop around the hole is uploaded each frame (the old version
 *     re-uploaded the whole fullscreen 2D canvas as a texture every frame)
 */

import * as THREE from 'three';
import { spaceState } from '../../modules/space-state.js';
import { NOISE_GLSL } from '../shaders/chunks.js';

const LENS_FACTOR = 5; // lens reach, in horizon radii
const MAX_RADIUS = 85; // universe-bg.js BLACK_HOLE_RADIUS
const CROP = Math.ceil(MAX_RADIUS * LENS_FACTOR * 2) + 8; // css px

const VERTEX = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  uniform vec2 uViewport;
  uniform float uDpr;
  uniform vec2 uCenter;
  uniform float uRadius;
  uniform float uAlpha;
  uniform float uSpin;
  uniform float uTime;
  uniform sampler2D uStars;
  uniform vec2 uStarsOrigin;
  uniform float uStarsSize;
  uniform sampler2D uScene;
  uniform vec2 uSceneOrigin;
  uniform float uSceneSize;
  uniform float uHasScene;
  ${NOISE_GLSL}

  // The page background behind the canvases (css/universe.css .space-ambient
  // over #070707), recomputed here so the lens region blends in seamlessly.
  vec3 pageBackground(vec2 p) {
    vec2 vp = uViewport;
    vec3 c = vec3(7.0 / 255.0);
    float t3 = clamp(length(p - vp * 0.5) / length(vp * 0.5), 0.0, 1.0);
    vec4 g3 = mix(vec4(vec3(10.0 / 255.0), 0.4), vec4(vec3(7.0 / 255.0), 0.95), t3);
    c = mix(c, g3.rgb, g3.a);
    vec2 c2 = vp * vec2(0.85, 0.75);
    float a2 = 0.045 * clamp(1.0 - length(p - c2) / (length(max(c2, vp - c2)) * 0.5), 0.0, 1.0);
    c = mix(c, vec3(180.0, 180.0, 190.0) / 255.0, a2);
    vec2 c1 = vp * vec2(0.15, 0.2);
    float a1 = 0.05 * clamp(1.0 - length(p - c1) / (length(max(c1, vp - c1)) * 0.45), 0.0, 1.0);
    return mix(c, vec3(1.0), a1);
  }

  float inUnit(vec2 uv) {
    return step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  }

  void main() {
    // Work in CSS pixels, top-left origin (same space as the 2D canvas).
    vec2 frag = vec2(gl_FragCoord.x, uViewport.y * uDpr - gl_FragCoord.y) / uDpr;
    vec2 d = frag - uCenter;
    float dist = length(d);
    float rs = max(uRadius, 0.5);
    float lensR = rs * ${LENS_FACTOR.toFixed(1)};
    if (dist > lensR || uAlpha <= 0.001) discard;

    // --- gravitational lensing (point mass)
    float thetaE = rs * 1.45;
    vec2 dir = d / max(dist, 0.001);
    float srcDist = dist - (thetaE * thetaE) / max(dist, 0.001);
    float blend = smoothstep(lensR, lensR * 0.42, dist);
    vec2 src = uCenter + dir * mix(dist, srcDist, blend);

    vec2 suv = (src - uStarsOrigin) / uStarsSize;
    suv.y = 1.0 - suv.y;
    vec4 star = texture2D(uStars, suv) * inUnit(suv);
    vec3 col = mix(pageBackground(src), star.rgb, star.a);

    vec2 fuv = (vec2(src.x, uViewport.y - src.y) * uDpr - uSceneOrigin) / uSceneSize;
    vec4 scene = texture2D(uScene, fuv) * inUnit(fuv) * uHasScene;
    col = col * (1.0 - scene.a) + scene.rgb;

    // Magnification near the Einstein radius.
    col *= 1.0 + blend * 0.7 * exp(-pow((dist - thetaE) / (rs * 0.2), 2.0));

    // --- accretion disk (thin, inclined, rotating)
    float tilt = -0.3;
    float c = cos(tilt);
    float s = sin(tilt);
    vec2 p = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
    float incl = 0.23;
    vec2 q = vec2(p.x, p.y / incl);
    float rr = length(q) / rs;
    float phi = atan(q.y, q.x);
    float rin = 1.65;
    float rout = 4.3;
    float band = smoothstep(rin, rin + 0.3, rr) * (1.0 - smoothstep(rout - 1.4, rout, rr));
    float ang = phi - uSpin * 0.5 - uTime * 1.1 / pow(max(rr, 1.0), 1.5);
    float streak = 0.5 + 0.5 * fbm3(vec3(cos(ang) * rr * 1.4, sin(ang) * rr * 1.4, rr * 1.7));
    float heat = 1.0 - smoothstep(rin, rout, rr);
    float doppler = 1.0 - 0.6 * cos(phi);
    vec3 disk = mix(vec3(1.0, 0.5, 0.2), vec3(1.0, 0.94, 0.85), heat) * streak * doppler * band * (0.5 + 1.5 * heat);

    float shadow = 1.0 - smoothstep(rs * 0.95, rs * 1.02, dist);
    float farSide = step(p.y, 0.0);
    float diskVisible = 1.0 - farSide * shadow;

    // Lensed image of the disk's far side: an arc over the top of the
    // shadow (and a faint one under it).
    float sinUp = p.y / max(dist, 0.001);
    float halo = exp(-pow((dist - rs * 1.3) / (rs * 0.19), 2.0));
    float over = smoothstep(0.15, -0.85, sinUp) + smoothstep(-0.15, 0.85, sinUp) * 0.3;
    float hAng = atan(p.y, p.x) + uTime * 0.45;
    float hStreak = 0.6 + 0.4 * fbm3(vec3(cos(hAng) * 2.2, sin(hAng) * 2.2, uTime * 0.08));
    vec3 lensedDisk = vec3(1.0, 0.85, 0.66) * halo * over * hStreak * (1.0 - 0.45 * cos(atan(p.y, p.x))) * 1.9;

    float photonRing = exp(-pow((dist - rs * 1.05) / (rs * 0.03), 2.0));

    col = mix(col, vec3(0.0), shadow);
    col += lensedDisk * (1.0 - shadow);
    col += vec3(1.0, 0.93, 0.82) * photonRing * 0.85;
    col += disk * diskVisible;

    float alpha = smoothstep(lensR, lensR * 0.78, dist);
    gl_FragColor = vec4(col, alpha * uAlpha);
  }
`;

export class BlackHole {
  constructor(engine, bgCanvas) {
    this.engine = engine;
    this.bgCanvas = bgCanvas;
    this.active = false;

    this.crop = document.createElement('canvas');
    this.crop.width = CROP;
    this.crop.height = CROP;
    this.cropCtx = this.crop.getContext('2d');
    this.starsTexture = new THREE.CanvasTexture(this.crop);
    this.starsTexture.minFilter = THREE.LinearFilter;
    this.starsTexture.generateMipmaps = false;

    this.sceneTexture = null;
    this._sceneTexSize = 0;
    this._sceneOrigin = new THREE.Vector2();

    this.uniforms = {
      uViewport: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: 1 },
      uCenter: { value: new THREE.Vector2() },
      uRadius: { value: 0 },
      uAlpha: { value: 0 },
      uSpin: { value: 0 },
      uTime: { value: 0 },
      uStars: { value: this.starsTexture },
      uStarsOrigin: { value: new THREE.Vector2() },
      uStarsSize: { value: CROP },
      uScene: { value: null },
      uSceneOrigin: { value: new THREE.Vector2() },
      uSceneSize: { value: 1 },
      uHasScene: { value: 0 }
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    quad.frustumCulled = false;
    this.scene = new THREE.Scene();
    this.scene.add(quad);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  /** Compile the (fairly big) lensing shader ahead of the first "agujero". */
  precompile() {
    return this.engine.compile(this.scene, this.camera);
  }

  update(dt, t, ctx) {
    const s = spaceState.blackHole;
    this.active = !!(s && s.ringAlpha > 0.001 && s.radius > 0.5);
    if (!this.active) return;

    const u = this.uniforms;
    const dpr = this.engine.renderer.getPixelRatio();
    u.uViewport.value.set(ctx.width, ctx.height);
    u.uDpr.value = dpr;
    u.uCenter.value.set(s.x, s.y);
    u.uRadius.value = s.radius;
    u.uAlpha.value = s.ringAlpha;
    u.uSpin.value = s.angle;
    u.uTime.value = this.engine.reducedMotion ? t * 0.3 : t;

    // Crop of the 2D starfield around the hole.
    const ox = Math.round(s.x - CROP / 2);
    const oy = Math.round(s.y - CROP / 2);
    u.uStarsOrigin.value.set(ox, oy);
    const c = this.cropCtx;
    c.clearRect(0, 0, CROP, CROP);
    if (this.bgCanvas && this.bgCanvas.width > 0) {
      const sx = Math.max(0, ox);
      const sy = Math.max(0, oy);
      const sw = Math.min(this.bgCanvas.width, ox + CROP) - sx;
      const sh = Math.min(this.bgCanvas.height, oy + CROP) - sy;
      if (sw > 0 && sh > 0) c.drawImage(this.bgCanvas, sx, sy, sw, sh, sx - ox, sy - oy, sw, sh);
    }
    this.starsTexture.needsUpdate = true;

    // Where (in device pixels, bottom-left origin) the 3D-layer crop starts.
    const size = Math.ceil(CROP * dpr);
    if (size !== this._sceneTexSize) {
      if (this.sceneTexture) this.sceneTexture.dispose();
      this.sceneTexture = new THREE.FramebufferTexture(size, size);
      this.sceneTexture.minFilter = THREE.LinearFilter;
      this.sceneTexture.magFilter = THREE.LinearFilter;
      this._sceneTexSize = size;
      u.uScene.value = this.sceneTexture;
      u.uSceneSize.value = size;
    }
    this._sceneOrigin.set(
      Math.round(ox * dpr),
      Math.round((ctx.height - (oy + CROP)) * dpr)
    );
    u.uSceneOrigin.value.copy(this._sceneOrigin);
  }

  isRenderable() {
    return this.active;
  }

  render(renderer) {
    // Grab what the bodies just drew around the hole so it can be lensed.
    // WebGL defines pixels read from outside the framebuffer as transparent
    // black, so a crop hanging off the screen edge is fine.
    renderer.copyFramebufferToTexture(this.sceneTexture, this._sceneOrigin);
    this.uniforms.uHasScene.value = 1;
    renderer.render(this.scene, this.camera);
  }
}
