/**
 * =========================================================================
 * 3D SPACE SCENE — Saturn (second navigable Three.js planet)
 * =========================================================================
 * Same treatment as space-scene.js's Earth: a real textured model,
 * camera-navigable in observe mode (click to focus, drag to spin, scroll to
 * zoom once focused). Runs on its own canvas/scene/camera/renderer, fully
 * independent from Earth's — this is what lets Saturn sit idle in its own
 * section via an off-axis camera projection, tweening back to dead-center
 * on focus, without that idle offset also dragging Earth's own framing
 * around since they don't share a camera.
 */

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { panOffset } from './space-pan.js';

const MODEL_URL = 'assets/models/saturn.obj';

// Anchor point (fraction of the "work" section's own box, not the
// viewport) Saturn idles at — the second stop in the one-planet-per-section
// scroll (see planet-nav.js), tied to its own section so Saturn holds its
// place on the page and scrolls away like a real body instead of sitting
// glued to the screen forever.
const ANCHOR_SECTION_ID = 'work';
const ANCHOR_REL_X = 0.87;
// Near the very top of "work" (its own section-head sits around rel 0.06-0.09,
// well before the grid of project cards starts) — the grid itself fills the
// section's full width, so this is the one spot on the way down that isn't
// behind opaque cards.
const ANCHOR_REL_Y = 0.05;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function initSaturnScene() {
  const canvas = document.getElementById('space3d-saturn-canvas');
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

  // Same sun as Earth's scene (same values), so both navigable planets read
  // as lit by one consistent light source.
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(4, 2.2, 5);
  scene.add(sun);

  // Saturn never moves — the camera dollies for focus, and an off-axis
  // projection (camera.setViewOffset) is what parks it in the corner at
  // idle without actually moving the model off scene-origin.
  const saturnGroup = new THREE.Group();
  scene.add(saturnGroup);

  let sphereRadius = 1; // Saturn's own body — drives focus-zoom distances
  let fullRadius = 3.3; // whole ringed system — drives wide framing/clipping
  let distWide = 10;
  let distFocusMax = 2.6;
  let distFocusMin = 1.5;
  let cameraDist = distWide;
  let cameraDistTarget = distWide;

  let idleOffsetX = 0;
  let idleOffsetY = 0;
  let viewOffsetX = 0;
  let viewOffsetY = 0;
  let viewOffsetXTarget = 0;
  let viewOffsetYTarget = 0;

  // Declared early (not with the rest of the focus state below) because
  // resize(), called immediately below, already needs to read it.
  let focused = false;

  const anchorEl = document.getElementById(ANCHOR_SECTION_ID);

  // Reads the anchor section's CURRENT on-screen box (it moves as the page
  // scrolls) and turns that into the pixel shift that keeps Saturn parked
  // over it. Called every frame in animate() below, not just on resize.
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
  frameCamera();

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    computeIdleOffset();
    if (!focused) {
      viewOffsetXTarget = idleOffsetX;
      viewOffsetYTarget = idleOffsetY;
    }
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ------------------------------------------------------------------
  // Load the Saturn + ring + moon model (see assets/models/ prep step)
  // ------------------------------------------------------------------
  let modelReady = false;
  const loader = new OBJLoader();
  loader.load(
    MODEL_URL,
    (model) => {
      let sphereMesh = null;
      model.traverse((obj) => {
        if (obj.isMesh && /saturn/i.test(obj.material?.name || obj.name || '')) sphereMesh = obj;
      });
      model.updateMatrixWorld(true);

      const fullBox = new THREE.Box3().setFromObject(model);
      fullRadius = fullBox.getBoundingSphere(new THREE.Sphere()).radius || 3.3;

      if (sphereMesh) {
        const sphereBox = new THREE.Box3().setFromObject(sphereMesh);
        sphereRadius = sphereBox.getBoundingSphere(new THREE.Sphere()).radius || 1;
      } else {
        sphereRadius = fullRadius / 3;
      }

      saturnGroup.add(model);

      distWide = fullRadius * 2.5; // closer idle framing — Saturn is the one dedicated body for the work section, so it can read bigger
      distFocusMax = sphereRadius * 2.6; // click-to-focus: close on the planet, rings still framing it
      distFocusMin = sphereRadius * 1.5; // as far as scroll-zoom can push in past that
      cameraDist = distWide;
      cameraDistTarget = distWide;

      camera.near = Math.max(0.01, sphereRadius * 0.01);
      camera.far = fullRadius * 20;
      camera.updateProjectionMatrix();
      frameCamera();

      const texLoader = new THREE.TextureLoader();
      function loadColorTex(url) {
        const tex = texLoader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      }
      function loadDataTex(url) {
        return texLoader.load(url);
      }

      const saturnColor = loadColorTex('assets/models/saturn-color.jpg');
      const saturnRoughness = loadDataTex('assets/models/saturn-roughness.jpg');
      const saturnMetallic = loadDataTex('assets/models/saturn-metallic.jpg');
      const saturnNormal = loadDataTex('assets/models/saturn-normal.png');
      const saturnHeight = loadDataTex('assets/models/saturn-height.jpg');

      const ringsColor = loadColorTex('assets/models/rings-color.png');
      const ringsRoughness = loadDataTex('assets/models/rings-roughness.jpg');
      const ringsMetallic = loadDataTex('assets/models/rings-metallic.jpg');
      const ringsNormal = loadDataTex('assets/models/rings-normal.png');
      const ringsHeight = loadDataTex('assets/models/rings-height.jpg');

      const moonColor = loadColorTex('assets/models/moon-color.jpg');
      const moonRoughness = loadDataTex('assets/models/moon-roughness.jpg');
      const moonMetallic = loadDataTex('assets/models/moon-metallic.jpg');
      const moonNormal = loadDataTex('assets/models/moon-normal.png');
      const moonHeight = loadDataTex('assets/models/moon-height.jpg');

      model.traverse((obj) => {
        if (!obj.isMesh) return;
        const key = (obj.material?.name || obj.name || '').toLowerCase();

        if (key.includes('ring')) {
          obj.material = new THREE.MeshStandardMaterial({
            map: ringsColor,
            roughnessMap: ringsRoughness,
            metalnessMap: ringsMetallic,
            normalMap: ringsNormal,
            bumpMap: ringsHeight,
            bumpScale: fullRadius * 0.004,
            roughness: 1,
            metalness: 1,
            transparent: true,
            alphaTest: 0.15,
            depthWrite: false,
            side: THREE.DoubleSide
          });
        } else if (key.includes('moon')) {
          obj.material = new THREE.MeshStandardMaterial({
            map: moonColor,
            roughnessMap: moonRoughness,
            metalnessMap: moonMetallic,
            normalMap: moonNormal,
            bumpMap: moonHeight,
            bumpScale: sphereRadius * 0.01,
            roughness: 1,
            metalness: 1
          });
        } else {
          // Saturn's own sphere (also the fallback for anything unmatched)
          obj.material = new THREE.MeshStandardMaterial({
            map: saturnColor,
            roughnessMap: saturnRoughness,
            metalnessMap: saturnMetallic,
            normalMap: saturnNormal,
            bumpMap: saturnHeight,
            bumpScale: sphereRadius * 0.004,
            roughness: 1,
            metalness: 1
          });
        }
      });

      modelReady = true;
    },
    undefined,
    (err) => {
      console.warn('[space-scene-saturn] Saturn model failed to load:', err);
    }
  );

  // ------------------------------------------------------------------
  // Rotation state — idle spin, drag-to-rotate with release inertia
  // ------------------------------------------------------------------
  let yaw = -0.3;
  let pitch = 0.2;
  let yawVelocity = 0;
  let pitchVelocity = 0;
  const IDLE_SPEED = reducedMotion ? 0 : 0.0006;

  // ------------------------------------------------------------------
  // Focus state — camera dollies + un-shifts to center; the planet itself
  // never moves
  // ------------------------------------------------------------------

  function enterFocus() {
    if (focused) return;
    focused = true;
    document.body.classList.add('planet-focused');
    cameraDistTarget = distFocusMax;
    viewOffsetXTarget = 0;
    viewOffsetYTarget = 0;
    window.dispatchEvent(new CustomEvent('planet-focus-changed', { detail: { system: 'saturn', name: 'Gigante Gaseoso' } }));
  }

  function exitFocus() {
    if (!focused) return;
    focused = false;
    cameraDistTarget = distWide;
    viewOffsetXTarget = idleOffsetX;
    viewOffsetYTarget = idleOffsetY;
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
    if (!d || d.system !== 'saturn') return;
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
    cameraDistTarget = clamp(cameraDistTarget - dir * sphereRadius * 0.18, distFocusMin, distFocusMax);
  });

  // ------------------------------------------------------------------
  // Raycasting hit-test against Saturn — NDC math is computed the normal
  // (unshifted) way, and still lands correctly on the visually-offset
  // planet because the offset is baked into the projection matrix itself
  // via camera.setViewOffset, not into the model's position.
  // ------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function hitTestSaturn(clientX, clientY) {
    if (!modelReady) return null;
    ndc.x = (clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(saturnGroup, true);
    return hits.length ? hits[0] : null;
  }

  // ------------------------------------------------------------------
  // Pointer interaction — click vs. drag, gated to observe mode, same
  // interaction model as space-scene.js's Earth
  // ------------------------------------------------------------------
  const DRAG_LOCK = 10;
  let pointerId = null;
  let dragging = false;
  let dragStartedOnSaturn = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;

  const activeTouches = new Map();
  let pinchStartDist = null;

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (!isObserveMode() || !modelReady) return;
    if (!focused && document.body.classList.contains('planet-focused')) return; // something else is already focused
    if (pointerId !== null) return;

    const hit = hitTestSaturn(e.clientX, e.clientY);
    if (!hit) return;

    pointerId = e.pointerId;
    dragging = false;
    dragStartedOnSaturn = true;
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

    if (pointerId !== e.pointerId || !dragStartedOnSaturn) return;

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
    const wasOnSaturn = dragStartedOnSaturn;
    pointerId = null;
    dragging = false;
    dragStartedOnSaturn = false;

    if (wasOnSaturn && !wasDragging && !focused) enterFocus();
  }

  window.addEventListener('pointerup', releasePointer);
  window.addEventListener('pointercancel', releasePointer);

  function updatePinch() {
    const pts = [...activeTouches.values()];
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    if (pinchStartDist !== null && focused && isObserveMode()) {
      const delta = pinchStartDist - dist;
      cameraDistTarget = clamp(cameraDistTarget + delta * 0.01 * sphereRadius, distFocusMin, distFocusMax);
    }
    pinchStartDist = dist;
  }

  window.addEventListener(
    'wheel',
    (e) => {
      if (!focused || !isObserveMode()) return;
      e.preventDefault();
      const ZOOM_SPEED = 0.0022;
      cameraDistTarget = clamp(cameraDistTarget + e.deltaY * ZOOM_SPEED * sphereRadius, distFocusMin, distFocusMax);
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

    // Track the "work" section's current on-screen position every frame
    // (not just on resize) so Saturn keeps holding its place as the page
    // scrolls, instead of sitting glued to the same screen spot forever.
    if (!focused) {
      computeIdleOffset();
      // panOffset (space-pan.js) is the observe-mode free-roam input —
      // added on top of the section anchor, not replacing it, so panning
      // away and toggling observe mode off/on snaps cleanly back.
      viewOffsetXTarget = idleOffsetX + panOffset.x;
      viewOffsetYTarget = idleOffsetY + panOffset.y;
    }

    if (!(dragStartedOnSaturn && dragging)) {
      yaw += yawVelocity;
      pitch = clamp(pitch + pitchVelocity, -1.3, 1.3);
      yawVelocity *= 0.92;
      pitchVelocity *= 0.92;
      if (Math.abs(yawVelocity) < 0.00005) yawVelocity = 0;
      if (Math.abs(pitchVelocity) < 0.00005) pitchVelocity = 0;

      if (yawVelocity === 0 && pitchVelocity === 0) yaw += IDLE_SPEED;
    }

    saturnGroup.rotation.y = yaw;
    saturnGroup.rotation.x = pitch;

    cameraDist += (cameraDistTarget - cameraDist) * 0.07;
    viewOffsetX += (viewOffsetXTarget - viewOffsetX) * 0.07;
    viewOffsetY += (viewOffsetYTarget - viewOffsetY) * 0.07;
    frameCamera();

    renderer.render(scene, camera);
  }

  animate();
}
