/**
 * =========================================================================
 * EL LUCERO — about section
 * =========================================================================
 * Hannah's planet. A rogue world that drifted frozen and dark until it
 * started to shine with its own light — so that's how it's lit: only a
 * faint, cold glint of distant starlight from outside, and a warm, steady
 * glow from within that seeps through the thinner ice (the darker regions
 * of its frozen surface) and haloes its edge. It keeps the tilted ring the
 * 2D version had.
 */

import * as THREE from 'three';
import { SmallBody } from './small-body.js';
import { loadTexture } from '../core/assets.js';
import { SPHERE_VERTEX, SPHERE_VARYINGS, NOISE_GLSL, OUTPUT_GLSL } from '../shaders/chunks.js';
import { createGlow } from '../shaders/glow.js';

const WARM = 0xffc58a;

const SURFACE_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uSunDir;
  uniform vec3 uWarm;
  uniform float uTime;
  uniform float uPulse;
  uniform float uInvert;
  uniform float uOpacity;
  ${SPHERE_VARYINGS}
  ${NOISE_GLSL}

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    vec3 l = normalize(uSunDir);
    vec3 ice = texture2D(uMap, vUv).rgb;
    float lum = dot(ice, vec3(0.299, 0.587, 0.114));
    float ndl = max(dot(n, l), 0.0);
    float mu = max(dot(n, v), 0.0);

    // Distant starlight: cold, faint.
    vec3 color = ice * vec3(0.8, 0.88, 1.0) * (0.16 + 0.6 * ndl);

    // Its own light: through the thinner ice, a slow living flicker.
    float thin = smoothstep(0.6, 0.22, lum);
    float flicker = 0.82 + 0.18 * snoise(normalize(vObjPos) * 3.0 + uTime * 0.12);
    color += uWarm * thin * flicker * (0.75 + 0.25 * uPulse) * 0.85;

    // Light scattered inside the ice: warm body glow, stronger face-on.
    color += uWarm * ice * (0.2 + 0.3 * mu) * (0.85 + 0.15 * uPulse);
    color += uWarm * pow(1.0 - mu, 3.0) * 0.55;

    color = mix(color, vec3(1.0) - color, uInvert);
    gl_FragColor = vec4(color, uOpacity);
    ${OUTPUT_GLSL}
  }
`;

const RING_FRAGMENT = /* glsl */ `
  uniform vec3 uWarm;
  uniform float uInner;
  uniform float uOuter;
  uniform float uOpacity;
  ${SPHERE_VARYINGS}
  ${NOISE_GLSL}

  void main() {
    float r = length(vObjPos.xz);
    float u = (r - uInner) / (uOuter - uInner);
    if (u <= 0.0 || u >= 1.0) discard;
    float bands = 0.5 + 0.5 * snoise(vec3(u * 14.0, 0.0, 3.0));
    float fine = 0.5 + 0.5 * snoise(vec3(u * 38.0, 1.0, 0.0));
    float edge = smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.82, 1.0, u));
    float alpha = (0.16 + 0.3 * bands * (0.75 + 0.25 * fine)) * edge;
    // Lit by the planet itself: warmer and brighter toward it.
    vec3 color = mix(vec3(0.86, 0.87, 0.9), uWarm, 0.35 * (1.0 - u)) * (1.25 - 0.55 * u);
    gl_FragColor = vec4(color, alpha * uOpacity);
    ${OUTPUT_GLSL}
  }
`;

export default class ElLucero extends SmallBody {
  constructor(engine, config) {
    super(engine, config);
    this.yaw = 0;
    this.pitch = 0;
    this.idleSpinSpeed = 0.12;
    this.extentScale = 3;
    this.pulse = { value: 0 };
  }

  async build() {
    const map = await loadTexture('lucero-ice.jpg', { color: true });
    const warm = { value: new THREE.Color(WARM) };

    this.globe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 48),
      new THREE.ShaderMaterial({
        uniforms: {
          ...this.glitch,
          uMap: { value: map },
          uSunDir: this.shared.uSunDir,
          uWarm: warm,
          uTime: this.shared.uTime,
          uPulse: this.pulse,
          uOpacity: this.shared.uOpacity
        },
        vertexShader: SPHERE_VERTEX,
        fragmentShader: SURFACE_FRAGMENT,
        transparent: true
      })
    );
    this.root.add(this.globe);

    // Ring: same apparent shape as the 2D one (≈4:1 ellipse, tilted ~23°).
    const tilt = new THREE.Group();
    tilt.rotation.set(Math.asin(0.25), 0, -0.4, 'ZYX');
    const ringGeometry = new THREE.RingGeometry(1.45, 2.05, 192, 2);
    ringGeometry.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(ringGeometry, new THREE.ShaderMaterial({
      uniforms: {
        ...this.glitch,
        uWarm: warm,
        uInner: { value: 1.45 },
        uOuter: { value: 2.05 },
        uOpacity: this.shared.uOpacity
      },
      vertexShader: SPHERE_VERTEX,
      fragmentShader: RING_FRAGMENT,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    }));
    ring.renderOrder = 1;
    tilt.add(ring);
    this.root.add(tilt);

    this.halo = createGlow(this.shared, { color: WARM, extent: 4.5, intensity: 0.4, falloff: 2.4 });
    this.halo.material.uniforms.uPulse = this.pulse;
    this.scene.add(this.halo);
  }

  // Spin the globe on its own axis, so the ring keeps its pose.
  idleSpin(dt) {
    if (this.globe) this.globe.rotation.y += this.idleSpinSpeed * dt;
  }

  cardEvent() {
    return { event: 'open-wanderer-lightbox' };
  }

  animate(dt, t) {
    // A warm, steady signal: a slow breath rather than a blink.
    this.pulse.value = 0.5 + 0.5 * Math.sin(t * 0.6);
  }
}
