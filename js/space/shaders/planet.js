/**
 * =========================================================================
 * TERRESTRIAL PLANET MATERIALS — surface, cloud shell, atmosphere shell
 * =========================================================================
 * Used by Earth and Coruscant. What the old MeshStandardMaterial setup
 * couldn't do:
 *   - city lights only on the night side (they used to glow everywhere,
 *     day side included), fading through a soft terminator
 *   - specular sun glint on water only (ocean mask from the height map, or
 *     a dedicated specular map)
 *   - clouds that drift independently and cast soft shadows on the ground
 *   - a warm twilight band along the terminator
 *   - an atmosphere: thin haze over the limb plus an outer scattering halo
 *     that's bright on the day side and fades out on the night side
 */

import * as THREE from 'three';
import { SPHERE_VERTEX, SPHERE_VARYINGS, OUTPUT_GLSL, glitchUniforms, makeAdditive } from './chunks.js';

const SURFACE_FRAGMENT = /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform sampler2D uHeight;
  uniform sampler2D uSpec;
  uniform sampler2D uClouds;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uAtmoColor;
  uniform vec3 uNightTint;
  uniform float uAmbient;
  uniform float uBump;
  uniform float uSpecPower;
  uniform float uSpecStrength;
  uniform float uUseSpecMap;
  uniform float uNightStrength;
  uniform float uCloudShift;
  uniform float uCloudShadow;
  uniform float uHaze;
  uniform float uOpacity;
  ${SPHERE_VARYINGS}

  // Bump mapping without tangents (Mikkelsen's "unparametrized surfaces"
  // method — same math three.js uses for MeshStandardMaterial.bumpMap).
  vec3 bumpNormal(vec3 n, vec3 pos, vec2 uv) {
    vec2 dSTdx = dFdx(uv);
    vec2 dSTdy = dFdy(uv);
    float h = texture2D(uHeight, uv).r;
    vec2 dH = uBump * vec2(texture2D(uHeight, uv + dSTdx).r - h, texture2D(uHeight, uv + dSTdy).r - h);
    vec3 sx = normalize(dFdx(pos));
    vec3 sy = normalize(dFdy(pos));
    vec3 r1 = cross(sy, n);
    vec3 r2 = cross(n, sx);
    float det = dot(sx, r1);
    vec3 grad = sign(det) * (dH.x * r1 + dH.y * r2);
    return normalize(abs(det) * n - grad);
  }

  void main() {
    vec3 n0 = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    vec3 l = normalize(uSunDir);
    vec3 n = uBump > 0.0 ? bumpNormal(n0, vPosW, vUv) : n0;

    float ndlGeo = dot(n0, l);
    float ndl = max(dot(n, l), 0.0);
    float day = smoothstep(-0.16, 0.24, ndlGeo);

    vec3 albedo = texture2D(uDay, vUv).rgb;

    // Cloud shadows: the same cloud texture the shell above uses, sampled
    // slightly "up-sun" so the shadow sits offset from its cloud.
    float cloud = texture2D(uClouds, vUv + vec2(uCloudShift, 0.0)).r;
    float cloudShadowSample = texture2D(uClouds, vUv + vec2(uCloudShift + 0.003, 0.002)).r;
    float shadow = 1.0 - cloudShadowSample * uCloudShadow;

    vec3 color = albedo * (uSunColor * ndl * shadow + uAmbient);

    // Sun glint, water only.
    // Water: a dedicated specular map, or sea level on the height map AND
    // a blue-dominant day color (so low-lying land isn't mistaken for sea).
    float water = uUseSpecMap > 0.5
      ? texture2D(uSpec, vUv).r
      : (1.0 - smoothstep(0.0, 0.014, texture2D(uHeight, vUv).r)) * smoothstep(0.0, 0.06, albedo.b - albedo.r);
    vec3 h = normalize(l + v);
    float ndh = max(dot(n0, h), 0.0);
    // Tight glint + a faint broad sheen.
    float spec = (pow(ndh, uSpecPower) + pow(ndh, uSpecPower * 0.12) * 0.06) * water * uSpecStrength;
    color += uSunColor * spec * shadow * smoothstep(0.0, 0.25, ndlGeo);

    // City lights: night side only, dimmed under clouds.
    vec3 lights = texture2D(uNight, vUv).rgb * uNightTint * uNightStrength;
    color += lights * (1.0 - day) * (1.0 - cloud * 0.55);

    // Twilight: a warm band hugging the terminator.
    float twilight = exp(-pow(ndlGeo / 0.13, 2.0));
    color += albedo * vec3(1.0, 0.42, 0.18) * twilight * 0.22;

    // Atmospheric haze over the limb, lit side only.
    float fres = pow(1.0 - max(dot(n0, v), 0.0), 2.6);
    float atmoLight = smoothstep(-0.3, 0.55, ndlGeo);
    color = mix(color, uAtmoColor * (0.35 + atmoLight), clamp(fres * atmoLight * uHaze, 0.0, 1.0));

    gl_FragColor = vec4(color, uOpacity);
    ${OUTPUT_GLSL}
  }
`;

const CLOUD_FRAGMENT = /* glsl */ `
  uniform sampler2D uClouds;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uCloudTint;
  uniform float uCloudShift;
  uniform float uDensity;
  uniform float uOpacity;
  ${SPHERE_VARYINGS}

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 l = normalize(uSunDir);
    vec3 v = normalize(cameraPosition - vPosW);
    float c = texture2D(uClouds, vUv + vec2(uCloudShift, 0.0)).r * uDensity;
    float ndl = dot(n, l);
    float lit = max(ndl, 0.0);
    vec3 color = uCloudTint * (uSunColor * lit * 1.05 + 0.025);
    float twilight = exp(-pow(ndl / 0.16, 2.0));
    color = mix(color, color * vec3(1.0, 0.55, 0.35) + vec3(0.12, 0.04, 0.0), twilight * 0.6);
    // Thin out toward the limb so the shell doesn't show a hard edge.
    float edge = smoothstep(0.0, 0.25, dot(n, v));
    gl_FragColor = vec4(color, c * edge * uOpacity);
    ${OUTPUT_GLSL}
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 uSunDir;
  uniform vec3 uAtmoColor;
  uniform float uIntensity;
  uniform float uPower;
  uniform float uOpacity;
  ${SPHERE_VARYINGS}

  void main() {
    // Rendered on the back faces of a slightly larger sphere: the visible
    // part is the ring between the planet's limb and the shell's edge.
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    vec3 l = normalize(uSunDir);
    float facing = clamp(-dot(n, v), 0.0, 1.0); // 0 at the outer edge
    float rim = pow(smoothstep(0.0, 0.45, facing), uPower) * (1.0 - smoothstep(0.45, 0.9, facing) * 0.6);
    float sun = smoothstep(-0.45, 0.6, dot(n, l));
    vec3 color = uAtmoColor * rim * (0.05 + sun) * uIntensity * uOpacity;
    gl_FragColor = vec4(color, max(color.r, max(color.g, color.b)) * 0.5);
  }
`;

const SPHERE_DEFAULTS = () => ({
  ...glitchUniforms()
});

export function createSurfaceMaterial(shared, opts) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...SPHERE_DEFAULTS(),
      uSunDir: shared.uSunDir,
      uOpacity: shared.uOpacity,
      uCloudShift: shared.uCloudShift,
      uDay: { value: opts.day },
      uNight: { value: opts.night },
      uHeight: { value: opts.height },
      uSpec: { value: opts.spec || opts.height },
      uClouds: { value: opts.clouds },
      uSunColor: { value: new THREE.Color(opts.sunColor ?? 0xffffff).multiplyScalar(opts.sunIntensity ?? 1.6) },
      uAtmoColor: { value: new THREE.Color(opts.atmoColor ?? 0x6fa8ff) },
      uNightTint: { value: new THREE.Color(opts.nightTint ?? 0xffd9a0) },
      uAmbient: { value: opts.ambient ?? 0.015 },
      uBump: { value: opts.bump ?? 1.2 },
      uSpecPower: { value: opts.specPower ?? 60 },
      uSpecStrength: { value: opts.specStrength ?? 0.6 },
      uUseSpecMap: { value: opts.spec ? 1 : 0 },
      uNightStrength: { value: opts.nightStrength ?? 1.6 },
      uCloudShadow: { value: opts.cloudShadow ?? 0.45 },
      uHaze: { value: opts.haze ?? 0.85 }
    },
    vertexShader: SPHERE_VERTEX,
    fragmentShader: SURFACE_FRAGMENT,
    transparent: true
  });
}

export function createCloudMaterial(shared, opts) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...SPHERE_DEFAULTS(),
      uSunDir: shared.uSunDir,
      uOpacity: shared.uOpacity,
      uCloudShift: shared.uCloudShift,
      uClouds: { value: opts.clouds },
      uSunColor: { value: new THREE.Color(opts.sunColor ?? 0xffffff).multiplyScalar(opts.sunIntensity ?? 1.6) },
      uCloudTint: { value: new THREE.Color(opts.tint ?? 0xffffff) },
      uDensity: { value: opts.density ?? 1 }
    },
    vertexShader: SPHERE_VERTEX,
    fragmentShader: CLOUD_FRAGMENT,
    transparent: true,
    depthWrite: false
  });
}

export function createAtmosphereMaterial(shared, opts) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...SPHERE_DEFAULTS(),
      uSunDir: shared.uSunDir,
      uOpacity: shared.uOpacity,
      uAtmoColor: { value: new THREE.Color(opts.color ?? 0x6fa8ff) },
      uIntensity: { value: opts.intensity ?? 1.4 },
      uPower: { value: opts.power ?? 1.6 }
    },
    vertexShader: SPHERE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    side: THREE.BackSide
  });
  return makeAdditive(material);
}
