/**
 * Camera-facing glow / corona sprite (additive), with optional animated
 * rays. Every body camera looks straight down -Z without rotating, so a
 * plain quad facing +Z, kept OUT of the body's rotating group, is always
 * a billboard — no per-frame quaternion copy needed.
 *
 * The quad sits at the body's center: the half behind the sphere is
 * depth-tested away, so the glow only shows around the silhouette.
 */

import * as THREE from 'three';
import { NOISE_GLSL, makeAdditive } from './chunks.js';

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv * 2.0 - 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uExtent;     // quad half-size, in body radii
  uniform float uIntensity;
  uniform float uFalloff;
  uniform float uRays;
  uniform float uPulse;
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  ${NOISE_GLSL}

  void main() {
    float r = length(vUv) * uExtent;           // distance from center, in radii
    if (r < 0.98) discard;
    float d = r - 1.0;
    float glow = exp(-d * uFalloff) * 0.9 + 0.18 / (r * r);
    float rays = 0.0;
    if (uRays > 0.0) {
      float a = atan(vUv.y, vUv.x);
      vec2 dir = vec2(cos(a), sin(a));
      float n = snoise(vec3(dir * 2.6, uTime * 0.06));
      float n2 = snoise(vec3(dir * 7.0, uTime * 0.11 + 4.0));
      rays = pow(max(n * 0.65 + n2 * 0.35, 0.0), 1.6) * exp(-d * uFalloff * 0.45) * uRays;
    }
    float fade = 1.0 - smoothstep(uExtent * 0.55, uExtent, r);
    float strength = (glow + rays) * fade * uIntensity * (1.0 + uPulse * 0.45) * uOpacity;
    vec3 color = uColor * strength;
    gl_FragColor = vec4(color, min(strength, 1.0) * 0.35);
  }
`;

export function createGlow(shared, { color, extent = 5, intensity = 1, falloff = 2, rays = 0, radius = 1 }) {
  const material = makeAdditive(new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uExtent: { value: extent },
      uIntensity: { value: intensity },
      uFalloff: { value: falloff },
      uRays: { value: rays },
      uPulse: { value: 0 },
      uTime: shared.uTime,
      uOpacity: shared.uOpacity
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT
  }));
  const size = radius * extent * 2;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.renderOrder = 10;
  return mesh;
}
