/**
 * =========================================================================
 * ALFA MUSCAE — industries section
 * =========================================================================
 * α Mus, a blue-white B2 subgiant and a Beta Cephei variable (it really
 * pulses). Was a gray 2D disc; now a star:
 *   - boiling granulation (two fBm noise octaves drifting at different
 *     speeds) with limb darkening and a blue fringe
 *   - an animated corona with soft rays, slowly "breathing" like the old
 *     2D halo did
 *   - its card marker's easter egg — "a tiny satellite wakes up, orbits a
 *     couple of times, then fades" — is now NASA's generic 1U CubeSat,
 *     lit by the star itself and passing behind it
 * Musca's stick figure is still drawn around it by the 2D canvas.
 */

import * as THREE from 'three';
import { SmallBody } from './small-body.js';
import { loadModel } from '../core/assets.js';
import { SPHERE_VERTEX, SPHERE_VARYINGS, NOISE_GLSL, OUTPUT_GLSL } from '../shaders/chunks.js';
import { createGlow } from '../shaders/glow.js';

const STAR_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  uniform float uInvert;
  uniform float uOpacity;
  ${SPHERE_VARYINGS}
  ${NOISE_GLSL}

  void main() {
    vec3 p = normalize(vObjPos);
    float t = uTime;
    float n1 = fbm(p * 2.6 + vec3(0.0, t * 0.035, t * 0.02));
    float n2 = fbm3(p * 9.0 + vec3(t * 0.06, -t * 0.04, 0.0) + n1 * 0.8);
    float cells = 0.5 + 0.5 * (0.65 * n1 + 0.35 * n2);

    vec3 v = normalize(cameraPosition - vPosW);
    float mu = clamp(dot(normalize(vNormalW), v), 0.0, 1.0);
    float limb = 0.42 + 0.58 * pow(mu, 0.5);

    // Granulation: darker blue lanes between brighter, whiter cells.
    float c = smoothstep(0.25, 0.75, cells);
    vec3 color = mix(vec3(0.22, 0.36, 0.95), vec3(0.62, 0.76, 1.0), c);
    color = mix(color, vec3(0.95, 0.97, 1.0), smoothstep(0.62, 0.95, cells));
    color *= limb * (0.95 + 0.22 * uPulse);
    color += vec3(0.2, 0.35, 1.0) * pow(1.0 - mu, 2.2) * 0.45;
    color = mix(color, vec3(1.1) - color * 0.9, uInvert);

    gl_FragColor = vec4(color, uOpacity);
    ${OUTPUT_GLSL}
  }
`;

export default class AlfaMuscae extends SmallBody {
  constructor(engine, config) {
    super(engine, config);
    this.idleSpinSpeed = 0.05;
    this.extentScale = 3.2;
    this.pulse = { value: 0 };
    this.satellite = null;
    this.satelliteOrbit = null;
    this.satelliteMaterials = [];
    this.satelliteRun = null;
  }

  async build() {
    const star = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 48),
      new THREE.ShaderMaterial({
        uniforms: {
          ...this.glitch,
          uTime: this.shared.uTime,
          uOpacity: this.shared.uOpacity,
          uPulse: this.pulse
        },
        vertexShader: SPHERE_VERTEX,
        fragmentShader: STAR_FRAGMENT,
        transparent: true
      })
    );
    this.root.add(star);

    this.corona = createGlow(this.shared, { color: 0xa9c0ff, extent: 4.5, intensity: 0.42, falloff: 2.8, rays: 0.55 });
    this.corona.material.uniforms.uPulse = this.pulse;
    this.scene.add(this.corona);

    // The star lights its own props.
    const light = new THREE.PointLight(0xdfe8ff, 3.5, 0, 0);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.08));
    this.scene.environment = this.engine.getEnvironment();
    this.scene.environmentIntensity = 0.3;

    try {
      const sat = await loadModel('cubesat.glb');
      sat.scale.setScalar(0.22);
      sat.position.set(2.2, 0, 0);
      sat.traverse((o) => {
        if (!o.isMesh) return;
        o.material = o.material.clone();
        o.material.transparent = true;
        o.material.opacity = 0;
        this.satelliteMaterials.push(o.material);
      });
      sat.visible = false;
      this.satelliteOrbit = new THREE.Group();
      this.satelliteOrbit.add(sat);
      const plane = new THREE.Group();
      plane.rotation.set(0.45, 0, 0.3);
      plane.add(this.satelliteOrbit);
      this.scene.add(plane); // not under root: keeps orbiting steadily while the star is dragged
      this.satellite = sat;
    } catch (err) {
      console.warn('[space] CubeSat model unavailable:', err);
    }
  }

  cardEvent() {
    return { event: 'open-star-lightbox' };
  }

  triggerEasterEgg() {
    if (!this.satellite) return;
    const life = this.engine.reducedMotion ? 1.2 : 4;
    this.satelliteRun = { t: 0, life };
    this.satelliteOrbit.rotation.y = 0;
    this.satellite.visible = true;
  }

  animate(dt, t) {
    this.pulse.value = 0.5 + 0.5 * Math.sin(t * 0.35);

    const run = this.satelliteRun;
    if (!run) return;
    run.t += dt;
    this.satelliteOrbit.rotation.y += dt * (this.engine.reducedMotion ? 1.5 : 4.8);
    this.satellite.rotation.x += dt * 0.6;
    const fadeOut = Math.min(0.67, run.life * 0.3);
    const fade = Math.min(1, run.t / 0.3) * Math.min(1, Math.max(0, (run.life - run.t) / fadeOut));
    for (let i = 0; i < this.satelliteMaterials.length; i++) {
      this.satelliteMaterials[i].opacity = fade * this.opacity;
    }
    if (run.t >= run.life) {
      this.satellite.visible = false;
      this.satelliteRun = null;
    }
  }
}
