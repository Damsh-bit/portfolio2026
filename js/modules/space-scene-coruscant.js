/**
 * =========================================================================
 * 3D SPACE SCENE — Coruscant (third navigable Three.js planet)
 * =========================================================================
 * Same treatment as space-scene.js's Earth — click to focus, drag to spin,
 * scroll to zoom once focused — but built from a plain sphere instead of a
 * loaded model: there's no custom mesh for this one, just a color/bump/
 * specular/night-lights/clouds texture set (see the prep step in
 * assets/models/coruscant-*), so a THREE.SphereGeometry stands in for the
 * "surface" and a second, slightly larger sphere for the "cloud" shell —
 * the same two-layer structure Earth's glTF ships with, just built by hand.
 * Runs on its own canvas/scene/camera/renderer, independent from the other
 * bodies, for the same reason space-scene-saturn.js does.
 */

import * as THREE from 'three';
import { panOffset } from './space-pan.js';

const RADIUS = 1;

// Anchor point (fraction of the "experience" section's own box, not the
// viewport) Coruscant idles at — the third stop in the one-planet-per-
// section scroll (see planet-nav.js), tied to its own section so it holds
// its place on the page and scrolls away like a real body instead of
// sitting glued to the screen forever.
const ANCHOR_SECTION_ID = 'experience';
const ANCHOR_REL_X = 0.1;
const ANCHOR_REL_Y = 0.06;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function initCoruscantScene() {
  const canvas = document.getElementById('space3d-coruscant-canvas');
  if (!canvas) return;

  const backBtn = document.getElementById('planetBackBtn');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) {
    return; // WebGL unavailable — the 2D canvas keeps working regardless
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);

  // Same sun as the other 3D bodies, so every navigable planet reads as lit
  // by one consistent light source.
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(4, 2.2, 5);
  scene.add(sun);

  // Coruscant never moves — only the camera dollies toward/away from it.
  const planetGroup = new THREE.Group();
  scene.add(planetGroup);

  const distWide = RADIUS * 6.5; // closer idle framing — Coruscant is the one dedicated body for the experience section, so it can read bigger
  const distFocusMax = RADIUS * 1.9; // click-to-focus: a real close-up, not a modest zoom
  const distFocusMin = RADIUS * 1.15; // as far as scroll-zoom can push in past that
  let cameraDist = distWide;
  let cameraDistTarget = distWide;

  camera.near = RADIUS * 0.01;
  camera.far = RADIUS * 20;

  // Declared early (not with the rest of the focus state below) because
  // resize()/frameCamera(), called immediately below, already need it.
  let focused = false;

  const anchorEl = document.getElementById(ANCHOR_SECTION_ID);
  let idleOffsetX = 0;
  let idleOffsetY = 0;
  let viewOffsetX = 0;
  let viewOffsetY = 0;
  let viewOffsetXTarget = 0;
  let viewOffsetYTarget = 0;

  // Reads the anchor section's CURRENT on-screen box (it moves as the page
  // scrolls) and turns that into the pixel shift that keeps Coruscant
  // parked over it — same off-axis-projection trick space-scene.js uses.
  function computeIdleOffset() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let targetPxX = w * ANCHOR_REL_X;
    let targetPxY = h * ANCHOR_REL_Y;
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      targetPxX = rect.left + rect.width * ANCHOR_REL_X;
      targetPxY = rect.top + rect.height * ANCHOR_REL_Y;
    }
    idleOffsetX = w * 0.5 - targetPxX;
    idleOffsetY = h * 0.5 - targetPxY;
  }

  function frameCamera() {
    camera.position.set(0, 0, cameraDist);
    camera.lookAt(0, 0, 0);
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.setViewOffset(w, h, viewOffsetX, viewOffsetY, w, h);
  }
  computeIdleOffset();
  viewOffsetX = viewOffsetXTarget = idleOffsetX;
  viewOffsetY = viewOffsetYTarget = idleOffsetY;
  camera.updateProjectionMatrix();
  frameCamera();

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ------------------------------------------------------------------
  // Build the sphere — surface + a slightly larger transparent cloud shell,
  // textures applied once each image decodes (no need to await it here).
  // ------------------------------------------------------------------
  const texLoader = new THREE.TextureLoader();
  function loadColorTex(url) {
    const tex = texLoader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  function loadDataTex(url) {
    return texLoader.load(url);
  }

  const colorMap = loadColorTex('assets/models/coruscant-color.jpg');
  const nightMap = loadColorTex('assets/models/coruscant-nightlights.jpg');
  const bumpMap = loadDataTex('assets/models/coruscant-bump.jpg');
  const roughnessMap = loadDataTex('assets/models/coruscant-specular.jpg');
  const cloudsMap = loadColorTex('assets/models/coruscant-clouds.png');

  const surfaceGeometry = new THREE.SphereGeometry(RADIUS, 64, 64);
  const surfaceMaterial = new THREE.MeshStandardMaterial({
    map: colorMap,
    bumpMap,
    bumpScale: RADIUS * 0.004,
    roughnessMap,
    roughness: 1,
    metalness: 0,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: nightMap,
    emissiveIntensity: 1
  });
  const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
  planetGroup.add(surface);

  const cloudGeometry = new THREE.SphereGeometry(RADIUS * 1.012, 64, 64);
  const cloudMaterial = new THREE.MeshStandardMaterial({
    map: cloudsMap,
    transparent: true,
    depthWrite: false,
    roughness: 1,
    metalness: 0
  });
  const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
  planetGroup.add(clouds);

  const modelReady = true;

  // ------------------------------------------------------------------
  // Rotation state — idle spin, drag-to-rotate with release inertia
  // ------------------------------------------------------------------
  let yaw = -0.5;
  let pitch = 0.1;
  let yawVelocity = 0;
  let pitchVelocity = 0;
  const IDLE_SPEED = reducedMotion ? 0 : 0.0012;

  // ------------------------------------------------------------------
  // Focus state — camera flies to the planet; the planet stays put
  // ------------------------------------------------------------------

  function enterFocus() {
    if (focused) return;
    focused = true;
    document.body.classList.add('planet-focused');
    cameraDistTarget = distFocusMax;
    viewOffsetXTarget = 0;
    viewOffsetYTarget = 0;
    window.dispatchEvent(new CustomEvent('planet-focus-changed', { detail: { system: 'coruscant', name: 'Coruscant' } }));
  }

  function exitFocus() {
    if (!focused) return;
    focused = false;
    cameraDistTarget = distWide;
    document.body.classList.remove('planet-focused');
    window.dispatchEvent(new CustomEvent('planet-focus-changed', { detail: null }));
  }

  function isObserveMode() {
    return document.body.classList.contains('ui-hidden');
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (focused) exitFocus();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && focused) exitFocus();
  });

  // Planet nav panel (planet-nav.js)
  window.addEventListener('nav-focus-planet', (e) => {
    const d = e.detail;
    if (!d || d.system !== 'coruscant') return;
    if (!isObserveMode() || !modelReady) return;
    if (!focused && document.body.classList.contains('planet-focused')) return;
    enterFocus();
  });

  window.addEventListener('nav-exit-focus', () => {
    if (focused) exitFocus();
  });

  window.addEventListener('nav-rotate', (e) => {
    if (!focused) return;
    yawVelocity = (e.detail && e.detail.dir < 0 ? -1 : 1) * 0.05;
  });

  window.addEventListener('nav-zoom', (e) => {
    if (!focused) return;
    const dir = e.detail && e.detail.dir < 0 ? -1 : 1;
    cameraDistTarget = clamp(cameraDistTarget - dir * RADIUS * 0.18, distFocusMin, distFocusMax);
  });

  // ------------------------------------------------------------------
  // Raycasting hit-test against Coruscant
  // ------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function hitTestCoruscant(clientX, clientY) {
    ndc.x = (clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(planetGroup, true);
    return hits.length ? hits[0] : null;
  }

  // ------------------------------------------------------------------
  // Pointer interaction — click vs. drag, gated to observe mode, same
  // interaction model as space-scene.js's Earth
  // ------------------------------------------------------------------
  const DRAG_LOCK = 10;
  let pointerId = null;
  let dragging = false;
  let dragStartedOnPlanet = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;

  const activeTouches = new Map();
  let pinchStartDist = null;

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (!isObserveMode()) return;
    if (!focused && document.body.classList.contains('planet-focused')) return; // something else is already focused
    if (pointerId !== null) return;

    const hit = hitTestCoruscant(e.clientX, e.clientY);
    if (!hit) return;

    pointerId = e.pointerId;
    dragging = false;
    dragStartedOnPlanet = true;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
  });

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' && activeTouches.has(e.pointerId)) {
      activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activeTouches.size >= 2) {
      updatePinch();
      return;
    }

    if (pointerId !== e.pointerId || !dragStartedOnPlanet) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const totalDx = e.clientX - startX;
    const totalDy = e.clientY - startY;

    if (!dragging && Math.hypot(totalDx, totalDy) > DRAG_LOCK) dragging = true;

    if (dragging) {
      const ROT_SPEED = 0.006;
      yaw += dx * ROT_SPEED;
      pitch = clamp(pitch + dy * ROT_SPEED, -1.3, 1.3);
      yawVelocity = dx * ROT_SPEED;
      pitchVelocity = dy * ROT_SPEED;
    }

    lastX = e.clientX;
    lastY = e.clientY;
  });

  function releasePointer(e) {
    if (e.pointerType === 'touch') {
      activeTouches.delete(e.pointerId);
      if (activeTouches.size < 2) pinchStartDist = null;
    }
    if (pointerId !== e.pointerId) return;

    const wasDragging = dragging;
    const wasOnPlanet = dragStartedOnPlanet;
    pointerId = null;
    dragging = false;
    dragStartedOnPlanet = false;

    if (wasOnPlanet && !wasDragging && !focused) enterFocus();
  }

  window.addEventListener('pointerup', releasePointer);
  window.addEventListener('pointercancel', releasePointer);

  function updatePinch() {
    const pts = [...activeTouches.values()];
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    if (pinchStartDist !== null && focused && isObserveMode()) {
      const delta = pinchStartDist - dist;
      cameraDistTarget = clamp(cameraDistTarget + delta * 0.01 * RADIUS, distFocusMin, distFocusMax);
    }
    pinchStartDist = dist;
  }

  window.addEventListener(
    'wheel',
    (e) => {
      if (!focused || !isObserveMode()) return;
      e.preventDefault();
      const ZOOM_SPEED = 0.0022;
      cameraDistTarget = clamp(cameraDistTarget + e.deltaY * ZOOM_SPEED * RADIUS, distFocusMin, distFocusMax);
    },
    { passive: false }
  );

  // ------------------------------------------------------------------
  // Render loop — frame-based motion, matching the 2D canvas engine's own
  // convention in universe-bg.js and space-scene.js
  // ------------------------------------------------------------------
  function animate() {
    requestAnimationFrame(animate);

    if (focused && !isObserveMode()) exitFocus();

    // Track the "experience" section's current on-screen position every
    // frame (not just on resize) so Coruscant keeps holding its place as
    // the page scrolls, instead of sitting glued to the same screen spot
    // forever.
    if (!focused) {
      computeIdleOffset();
      // panOffset (space-pan.js) is the observe-mode free-roam input —
      // added on top of the section anchor, not replacing it, so panning
      // away and toggling observe mode off/on snaps cleanly back.
      viewOffsetXTarget = idleOffsetX + panOffset.x;
      viewOffsetYTarget = idleOffsetY + panOffset.y;
    }

    if (!(dragStartedOnPlanet && dragging)) {
      yaw += yawVelocity;
      pitch = clamp(pitch + pitchVelocity, -1.3, 1.3);
      yawVelocity *= 0.92;
      pitchVelocity *= 0.92;
      if (Math.abs(yawVelocity) < 0.00005) yawVelocity = 0;
      if (Math.abs(pitchVelocity) < 0.00005) pitchVelocity = 0;

      if (yawVelocity === 0 && pitchVelocity === 0) yaw += IDLE_SPEED;
    }

    planetGroup.rotation.y = yaw;
    planetGroup.rotation.x = pitch;

    cameraDist += (cameraDistTarget - cameraDist) * 0.07;
    viewOffsetX += (viewOffsetXTarget - viewOffsetX) * 0.07;
    viewOffsetY += (viewOffsetYTarget - viewOffsetY) * 0.07;
    frameCamera();

    renderer.render(scene, camera);
  }

  animate();
}
