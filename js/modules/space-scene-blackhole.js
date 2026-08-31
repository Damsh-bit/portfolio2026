/**
 * =========================================================================
 * 3D SPACE SCENE — Black Hole (the "agujero" easter egg, now real WebGL)
 * =========================================================================
 * The keyword/button trigger, spawn position, forming/active/collapsing
 * timing, and the stardust pull all still live in universe-bg.js exactly
 * as before (see updateBlackHole() there) — this module owns only the
 * visual: a single fullscreen shader quad, on its own canvas layered above
 * every other layer, driven purely by the 'blackhole-state' CustomEvent
 * that module broadcasts each frame.
 *
 * The shader draws a black core, a soft glow, two counter-rotating
 * accretion-ring bands (the same structure the old 2D version stroked with
 * ctx.ellipse, now smooth and glowing), and a cheap real-time lensing
 * approximation: it samples the actual starfield canvas (bg-canvas) as a
 * live texture and warps it radially in a band just outside the event
 * horizon, so real stars visibly bend around it instead of a fixed texture.
 */

import * as THREE from 'three';

const VERTEX_SHADER = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 uResolution;
  uniform vec2 uCenter;
  uniform float uRadius;
  uniform float uRingAlpha;
  uniform float uAngle;
  uniform sampler2D uStarTex;
  uniform float uHasStars;

  float ringBand(vec2 d, float angle, float rx, float ry, float thickness) {
    float c = cos(-angle);
    float s = sin(-angle);
    vec2 p = vec2(d.x * c - d.y * s, d.x * s + d.y * c);
    float e = sqrt((p.x * p.x) / (rx * rx) + (p.y * p.y) / (ry * ry));
    return smoothstep(thickness, 0.0, abs(e - 1.0));
  }

  void main() {
    if (uRingAlpha <= 0.001 || uRadius <= 0.001) discard;

    vec2 uv = gl_FragCoord.xy;
    vec2 d = uv - uCenter;
    float dist = length(d);
    float r = max(uRadius, 0.001);

    // Real-time lensing approximation: pull the live starfield texture
    // toward the center within an annulus just outside the horizon.
    vec2 fragUV = gl_FragCoord.xy / uResolution;
    float lensStrength = smoothstep(r * 4.5, r * 1.05, dist) * smoothstep(r * 0.95, r * 1.35, dist);
    vec2 warpDir = dist > 0.001 ? d / dist : vec2(0.0);
    vec2 warpedUV = fragUV - warpDir * (lensStrength * r * 1.6 / uResolution.x);
    vec3 starColor = uHasStars > 0.5 ? texture2D(uStarTex, clamp(warpedUV, 0.0, 1.0)).rgb : vec3(0.0);

    float core = 1.0 - smoothstep(r * 0.92, r, dist);
    float glow = smoothstep(r * 3.2, r * 0.6, dist) * 0.5;
    float ring1 = ringBand(d, uAngle, r * 1.9, r * 0.62, 0.16);
    float ring2 = ringBand(d, -uAngle * 1.6 + 1.0472, r * 1.35, r * 0.4, 0.12);

    vec3 white = vec3(0.96, 0.96, 0.97);
    vec3 color = starColor * lensStrength;
    color += white * glow;
    color += white * (ring1 + ring2);
    color = mix(color, vec3(0.0), core);

    float alpha = clamp(core + glow + ring1 + ring2 + lensStrength * 0.7, 0.0, 1.0) * uRingAlpha;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function initBlackHoleScene() {
  const canvas = document.getElementById('space3d-blackhole-canvas');
  const bgCanvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  } catch (e) {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearAlpha(0);

  const scene = new THREE.Scene();
  // The vertex shader ignores this camera entirely (it outputs clip-space
  // position directly) — an orthographic camera is used only so
  // WebGLRenderer's frustum culling doesn't discard the fullscreen quad.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let starTexture = null;
  if (bgCanvas) {
    starTexture = new THREE.CanvasTexture(bgCanvas);
    starTexture.minFilter = THREE.LinearFilter;
    starTexture.magFilter = THREE.LinearFilter;
  }

  const uniforms = {
    uResolution: { value: new THREE.Vector2(1, 1) },
    uCenter: { value: new THREE.Vector2(0, 0) },
    uRadius: { value: 0 },
    uRingAlpha: { value: 0 },
    uAngle: { value: 0 },
    uStarTex: { value: starTexture },
    uHasStars: { value: starTexture ? 1 : 0 }
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    const dpr = renderer.getPixelRatio();
    uniforms.uResolution.value.set(w * dpr, h * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  let state = null;
  window.addEventListener('blackhole-state', (e) => {
    state = e.detail;
  });

  function animate() {
    requestAnimationFrame(animate);

    if (state) {
      const dpr = renderer.getPixelRatio();
      uniforms.uCenter.value.set(state.x * dpr, window.innerHeight * dpr - state.y * dpr);
      uniforms.uRadius.value = state.radius * dpr;
      uniforms.uRingAlpha.value = state.ringAlpha;
      uniforms.uAngle.value = state.angle;
    } else {
      uniforms.uRingAlpha.value = 0;
      uniforms.uRadius.value = 0;
    }

    if (starTexture && state && state.ringAlpha > 0) starTexture.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();
}
