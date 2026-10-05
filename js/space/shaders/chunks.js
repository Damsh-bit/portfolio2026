/**
 * Shared GLSL snippets + material helpers for the 3D layer.
 */

import * as THREE from 'three';

/**
 * 3D simplex noise + fBm (Ashima Arts / Stefan Gustavson, MIT license,
 * https://github.com/ashima/webgl-noise).
 */
export const NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float fbm(vec3 p) {
    float f = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      f += a * snoise(p);
      p = p * 2.03 + vec3(17.1, -3.7, 9.2);
      a *= 0.5;
    }
    return f;
  }

  float fbm3(vec3 p) {
    float f = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      f += a * snoise(p);
      p = p * 2.03 + vec3(17.1, -3.7, 9.2);
      a *= 0.5;
    }
    return f;
  }
`;

/**
 * Standard varyings for lit spheres: world position/normal, object-space
 * position (stable coordinates for procedural noise), uv.
 *
 * Also carries the "glitch" slice-shift used by the three small bodies
 * (a horizontal band of the sphere jumps sideways for a few frames — the
 * same digital-interference effect the old 2D planets had).
 */
export const SPHERE_VERTEX = /* glsl */ `
  uniform float uGlitch;
  uniform float uGlitchY;
  uniform float uGlitchShift;
  uniform float uGlitchBand;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vObjPos;

  void main() {
    vUv = uv;
    vObjPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 mv = viewMatrix * wp;
    if (uGlitch > 0.5 && abs(mv.y - uGlitchY) < uGlitchBand) mv.x += uGlitchShift;
    gl_Position = projectionMatrix * mv;
  }
`;

export const SPHERE_VARYINGS = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vObjPos;
`;

/** Default glitch uniforms (inactive). */
export function glitchUniforms() {
  return {
    uGlitch: { value: 0 },
    uGlitchY: { value: 0 },
    uGlitchShift: { value: 0 },
    uGlitchBand: { value: 0.15 },
    uInvert: { value: 0 }
  };
}

/**
 * Additive blending that also behaves on a TRANSPARENT canvas: color is
 * added, alpha only grows a little — so a glow adds light over the 2D
 * starfield behind the WebGL canvas instead of painting an opaque disc.
 * Shaders using it must output premultiplied color (rgb already scaled).
 */
export function makeAdditive(material) {
  material.transparent = true;
  material.depthWrite = false;
  material.blending = THREE.CustomBlending;
  material.blendEquation = THREE.AddEquation;
  material.blendSrc = THREE.OneFactor;
  material.blendDst = THREE.OneFactor;
  material.blendSrcAlpha = THREE.OneFactor;
  material.blendDstAlpha = THREE.OneFactor;
  return material;
}

/** Fragment epilogue: tone mapping + output color space (sRGB). */
export const OUTPUT_GLSL = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;
