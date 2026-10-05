/**
 * =========================================================================
 * SATURN — work section
 * =========================================================================
 * Replaces the stylized low-poly OBJ (pastel texture atlas) with a
 * realistic build:
 *   - oblate globe (10% flattened, like the real planet) with the Solar
 *     System Scope Saturn map, limb darkening and a soft terminator
 *   - rings from the real radial ring profile (C, B, A rings and the
 *     Cassini division at their true relative radii), lit differently on
 *     the sunlit and unlit faces, with light scattering through them
 *   - shadows both ways, computed analytically in the shaders: the rings
 *     cast their banded shadow on the globe, the globe shadows the rings
 *   - Titan on a slow orbit and NASA's Cassini probe circling the system
 */

import * as THREE from 'three';
import { CelestialBody } from './body.js';
import { loadTexture, loadModel } from '../core/assets.js';
import { SPHERE_VERTEX, SPHERE_VARYINGS, OUTPUT_GLSL, glitchUniforms } from '../shaders/chunks.js';

const RING_INNER = 1.17;
const RING_OUTER = 2.37;
const FLATTENING = 0.902;

const GLOBE_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uRing;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uRingNormal;
  uniform float uRingInner;
  uniform float uRingOuter;
  uniform float uOpacity;
  ${SPHERE_VARYINGS}

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    vec3 l = normalize(uSunDir);
    vec3 albedo = texture2D(uMap, vUv).rgb;

    float ndl = dot(n, l);
    float light = max(ndl, 0.0) * 0.9 + smoothstep(-0.15, 0.3, ndl) * 0.12;

    // Ring shadow: follow the ray toward the sun to the ring plane.
    float ringShadow = 0.0;
    float denom = dot(l, uRingNormal);
    if (abs(denom) > 0.0001) {
      float t = -dot(vPosW, uRingNormal) / denom;
      if (t > 0.0) {
        float r = length(vPosW + l * t);
        float u = (r - uRingInner) / (uRingOuter - uRingInner);
        if (u > 0.0 && u < 1.0) ringShadow = texture2D(uRing, vec2(u, 0.5)).a;
      }
    }

    vec3 color = albedo * uSunColor * light * (1.0 - ringShadow * 0.82) + albedo * 0.01;

    float mu = max(dot(n, v), 0.0);
    color *= 0.5 + 0.5 * pow(mu, 0.4);
    float fres = pow(1.0 - mu, 3.0);
    color += vec3(0.95, 0.83, 0.62) * fres * smoothstep(-0.2, 0.5, ndl) * 0.22;

    gl_FragColor = vec4(color, uOpacity);
    ${OUTPUT_GLSL}
  }
`;

const RING_FRAGMENT = /* glsl */ `
  uniform sampler2D uRing;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uRingInner;
  uniform float uRingOuter;
  uniform float uPlanetRadius;
  uniform float uOpacity;
  ${SPHERE_VARYINGS}

  void main() {
    float r = length(vObjPos.xz);
    float u = (r - uRingInner) / (uRingOuter - uRingInner);
    if (u <= 0.0 || u >= 1.0) discard;
    vec4 tex = texture2D(uRing, vec2(u, 0.5));
    if (tex.a < 0.01) discard;

    vec3 n = normalize(vNormalW);
    vec3 l = normalize(uSunDir);
    vec3 v = normalize(cameraPosition - vPosW);
    float nl = dot(n, l);
    float nv = dot(n, v);
    float litFace = step(0.0, nl * nv);

    vec3 albedo = clamp(tex.rgb * 1.9, 0.0, 1.0);
    // Sunlit face: brighter where the sun is higher over the ring plane.
    vec3 lit = albedo * uSunColor * (0.35 + 0.9 * abs(nl));
    // Unlit face: only light filtering through the thinner parts.
    vec3 back = albedo * uSunColor * (1.0 - tex.a) * 0.9 + albedo * 0.03;
    vec3 color = mix(back, lit, litFace);

    // Forward scattering when looking toward the sun through the rings.
    color += albedo * uSunColor * pow(max(dot(-v, l), 0.0), 6.0) * (1.0 - litFace) * 0.8;

    // The globe's shadow across the rings.
    vec3 toC = -vPosW;
    float proj = dot(toC, l);
    float perp = length(toC - l * proj);
    float inShadow = proj > 0.0 ? 1.0 - smoothstep(uPlanetRadius * 0.96, uPlanetRadius * 1.03, perp) : 0.0;
    color *= 1.0 - inShadow * 0.93;

    gl_FragColor = vec4(color, tex.a * 0.96 * uOpacity);
    ${OUTPUT_GLSL}
  }
`;

export default class Saturn extends CelestialBody {
  constructor(engine, config) {
    super(engine, config);
    this.yaw = -0.3;
    this.pitch = 0.2;
    this.hitScale = 1.65;
    this.extentScale = 3.6;
    this.globe = null;
    this.titanOrbit = null;
    this.cassiniOrbit = null;
    this.ringNormal = new THREE.Vector3(0, 1, 0);
  }

  async build() {
    const [map, ring] = await Promise.all([
      loadTexture('saturn.jpg', { color: true }),
      loadTexture('saturn-ring.png', { color: true })
    ]);
    ring.wrapS = THREE.ClampToEdgeWrapping;

    const sunColor = new THREE.Color(0xfff6ea).multiplyScalar(1.7);
    const common = {
      ...glitchUniforms(),
      uSunDir: this.shared.uSunDir,
      uOpacity: this.shared.uOpacity,
      uSunColor: { value: sunColor },
      uRing: { value: ring },
      uRingInner: { value: RING_INNER },
      uRingOuter: { value: RING_OUTER }
    };

    // Axial tilt (26.7°) lives on its own group so the user's yaw/pitch on
    // the root turns the whole system, rings included.
    const tilt = new THREE.Group();
    tilt.rotation.set(0.12, 0, THREE.MathUtils.degToRad(26.7));
    this.root.add(tilt);
    this.tilt = tilt;

    const globeGeometry = new THREE.SphereGeometry(1, 128, 64);
    globeGeometry.scale(1, FLATTENING, 1);
    this.uRingNormal = { value: this.ringNormal };
    this.globe = new THREE.Mesh(globeGeometry, new THREE.ShaderMaterial({
      uniforms: { ...common, uMap: { value: map }, uRingNormal: this.uRingNormal },
      vertexShader: SPHERE_VERTEX,
      fragmentShader: GLOBE_FRAGMENT,
      transparent: true
    }));
    this.globe.renderOrder = 0;
    tilt.add(this.globe);

    const ringGeometry = new THREE.RingGeometry(RING_INNER, RING_OUTER, 256, 4);
    ringGeometry.rotateX(-Math.PI / 2);
    const rings = new THREE.Mesh(ringGeometry, new THREE.ShaderMaterial({
      uniforms: { ...common, uPlanetRadius: { value: 1 } },
      vertexShader: SPHERE_VERTEX,
      fragmentShader: RING_FRAGMENT,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    }));
    rings.renderOrder = 1;
    tilt.add(rings);

    // Titan: hazy orange moon, inclined orbit outside the rings.
    const titan = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 32, 16),
      this.trackMaterial(new THREE.MeshStandardMaterial({ color: 0xd19a55, roughness: 1, metalness: 0 }))
    );
    titan.position.set(3.25, 0, 0);
    this.titanOrbit = new THREE.Group();
    this.titanOrbit.rotation.y = 2.2;
    this.titanOrbit.add(titan);
    const titanPlane = new THREE.Group();
    titanPlane.rotation.z = 0.06;
    titanPlane.add(this.titanOrbit);
    tilt.add(titanPlane);

    this.addPropLighting({ sunIntensity: 2.6, ambient: 0.05, sunColor: 0xfff6ea });

    try {
      const cassini = await loadModel('cassini.glb');
      cassini.scale.setScalar(0.085);
      cassini.position.set(2.75, 0, 0);
      cassini.rotation.set(0.4, 1.2, 0);
      this.trackObject(cassini);
      cassini.traverse((o) => {
        if (o.isMesh) {
          o.material.metalness = 0.35;
          o.material.roughness = 0.45;
          o.material.color.set(0xd9d6cf);
        }
      });
      this.cassiniOrbit = new THREE.Group();
      this.cassiniOrbit.add(cassini);
      const cassiniPlane = new THREE.Group();
      cassiniPlane.rotation.set(0.32, 0, 0.2);
      cassiniPlane.add(this.cassiniOrbit);
      tilt.add(cassiniPlane);
    } catch (err) {
      console.warn('[space] Cassini model unavailable:', err);
    }
  }

  // At rest the system holds its pose (turning the whole tilted system
  // would make the rings wobble); the globe and the moons move on their own.
  idleSpin() {}

  tick(dt) {
    const slow = this.engine.reducedMotion ? 0.25 : 1;
    this.globe.rotation.y += dt * 0.12 * slow;
    this.titanOrbit.rotation.y += dt * 0.09 * slow;
    if (this.cassiniOrbit) this.cassiniOrbit.rotation.y -= dt * 0.22 * slow;
    this.ringNormal.set(0, 1, 0).transformDirection(this.tilt.matrixWorld);
  }
}
