/**
 * =========================================================================
 * TRAPPIST-1e — contact section
 * =========================================================================
 * A rocky, Earth-sized world around an ultra-cool red dwarf. Fully
 * procedural (no textures): oceans, continents, polar ice and drifting
 * clouds come from 3D noise evaluated on the sphere, lit by the dim
 * orange-red light of its star, with the pale-blue atmosphere the 2D
 * version was colored after.
 *
 * NASA's Spitzer Space Telescope — which found it in 2017 — keeps watch
 * from a slow orbit.
 */

import * as THREE from 'three';
import { SmallBody } from './small-body.js';
import { loadModel } from '../core/assets.js';
import { SPHERE_VERTEX, SPHERE_VARYINGS, NOISE_GLSL, OUTPUT_GLSL } from '../shaders/chunks.js';
import { createAtmosphereMaterial } from '../shaders/planet.js';

const SUN_COLOR = 0xffc49a; // TRAPPIST-1: an M8 dwarf, ~2,550 K

const SURFACE_FRAGMENT = /* glsl */ `
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uAtmoColor;
  uniform float uTime;
  uniform float uInvert;
  uniform float uOpacity;
  ${SPHERE_VARYINGS}
  ${NOISE_GLSL}

  void main() {
    vec3 p = normalize(vObjPos);
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    vec3 l = normalize(uSunDir);

    float detail = fbm3(p * 6.0);
    float h = fbm(p * 1.6 + vec3(3.1, 0.0, 1.7)) + detail * 0.15;
    float land = smoothstep(0.07, 0.11, h);
    float ice = smoothstep(0.7, 0.82, abs(p.y) + detail * 0.1 - h * 0.1);

    vec3 ocean = mix(vec3(0.012, 0.04, 0.09), vec3(0.03, 0.11, 0.19), smoothstep(-0.3, 0.06, h));
    vec3 ground = mix(vec3(0.28, 0.24, 0.2), vec3(0.47, 0.42, 0.36), smoothstep(0.1, 0.45, h + detail * 0.3));
    ground = mix(ground, vec3(0.19, 0.18, 0.16), smoothstep(0.0, 0.3, fbm3(p * 12.0)) * 0.5);
    vec3 albedo = mix(ocean, ground, land);
    albedo = mix(albedo, vec3(0.8, 0.86, 0.92), ice);

    // Clouds: stretched along latitude into thin bands, slowly drifting.
    vec3 cp = vec3(p.x, p.y * 2.2, p.z) * 2.6 + vec3(uTime * 0.012, 0.0, uTime * 0.008);
    float clouds = smoothstep(0.16, 0.55, fbm(cp + detail * 0.6)) * 0.85;

    float ndl = dot(n, l);
    float diff = max(ndl, 0.0);
    vec3 color = albedo * uSunColor * diff * (1.0 - clouds * 0.3);

    vec3 hv = normalize(l + v);
    color += uSunColor * pow(max(dot(n, hv), 0.0), 90.0) * (1.0 - land) * (1.0 - ice) * 0.45;
    color = mix(color, vec3(0.92, 0.92, 0.94) * uSunColor * (diff * 0.95 + 0.015), clouds * 0.8);

    float mu = max(dot(n, v), 0.0);
    color += uAtmoColor * pow(1.0 - mu, 2.5) * (0.12 + smoothstep(-0.3, 0.5, ndl)) * 0.75;
    color += albedo * 0.012;

    color = mix(color, vec3(1.0) - color, uInvert);
    gl_FragColor = vec4(color, uOpacity);
    ${OUTPUT_GLSL}
  }
`;

export default class Trappist extends SmallBody {
  constructor(engine, config) {
    super(engine, config);
    this.yaw = 1.1;
    this.pitch = 0.25;
    this.idleSpinSpeed = 0.09;
    this.extentScale = 2.6;
    this.spitzerOrbit = null;
  }

  async build() {
    const sunColor = new THREE.Color(SUN_COLOR).multiplyScalar(1.8);

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 48),
      new THREE.ShaderMaterial({
        uniforms: {
          ...this.glitch,
          uSunDir: this.shared.uSunDir,
          uSunColor: { value: sunColor },
          uAtmoColor: { value: new THREE.Color(0x8fb3c9) },
          uTime: this.shared.uTime,
          uOpacity: this.shared.uOpacity
        },
        vertexShader: SPHERE_VERTEX,
        fragmentShader: SURFACE_FRAGMENT,
        transparent: true
      })
    );
    this.root.add(globe);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 32),
      createAtmosphereMaterial(this.shared, { color: 0x9cc4dd, intensity: 1.3, power: 1.5 })
    );
    atmosphere.material.uniforms.uGlitch = this.glitch.uGlitch;
    atmosphere.material.uniforms.uGlitchY = this.glitch.uGlitchY;
    atmosphere.material.uniforms.uGlitchShift = this.glitch.uGlitchShift;
    atmosphere.material.uniforms.uGlitchBand = this.glitch.uGlitchBand;
    atmosphere.scale.setScalar(1.06);
    atmosphere.renderOrder = 2;
    this.scene.add(atmosphere);

    this.addPropLighting({ sunIntensity: 2.4, ambient: 0.06, sunColor: SUN_COLOR });

    try {
      const spitzer = await loadModel('spitzer.glb');
      spitzer.scale.setScalar(0.24);
      spitzer.position.set(2.1, 0, 0);
      spitzer.rotation.set(0.3, 0, -0.5);
      this.trackObject(spitzer);
      this.spitzerOrbit = new THREE.Group();
      this.spitzerOrbit.add(spitzer);
      const plane = new THREE.Group();
      plane.rotation.set(-0.35, 0, 0.25);
      plane.add(this.spitzerOrbit);
      this.scene.add(plane);
    } catch (err) {
      console.warn('[space] Spitzer model unavailable:', err);
    }
  }

  cardEvent(data) {
    const card = data.exoplanetCards && data.exoplanetCards['trappist-1e'];
    return { event: 'open-exoplanet-lightbox', detail: card };
  }

  animate(dt) {
    if (this.spitzerOrbit) this.spitzerOrbit.rotation.y += dt * (this.engine.reducedMotion ? 0.05 : 0.18);
  }
}
