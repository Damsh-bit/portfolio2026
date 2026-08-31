/**
 * =========================================================================
 * 3D SPACE SCENE — Earth (first navigable Three.js planet)
 * =========================================================================
 * Runs as an independent WebGL layer stacked above the existing 2D canvas
 * (js/modules/universe-bg.js), which keeps drawing the starfield, the 3
 * decorative 2D planets, constellations, asteroids and the black hole
 * untouched. This module owns exactly one body: a real GLB Earth model,
 * camera-navigable in observe mode — the camera flies to the planet, the
 * planet itself never moves. Click to focus, drag to spin it on its axis,
 * scroll to zoom in once focused, and click a surface marker for an
 * easter-egg info card.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { portfolioData } from '../data/portfolio-data.js';
import { panOffset } from './space-pan.js';

const MODEL_URL = 'assets/models/earth.glb';
const DRAG_LOCK = 10;

// Anchor point (fraction of the "hero" section's own box, not the
// viewport) Earth idles at — this is what makes it hold its place on the
// page and scroll away like a real body instead of sitting glued to the
// screen forever. See computeIdleOffset() below. Earth is the hero
// section's own body (first stop in the one-planet-per-section scroll —
// see planet-nav.js), parked top-right so it never sits over the
// left-aligned, vertically-centered hero copy.
const ANCHOR_SECTION_ID = 'hero';
const ANCHOR_REL_X = 0.86;
const ANCHOR_REL_Y = 0.24;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export function initSpaceScene() {
  const canvas = document.getElementById('space3d-canvas');
  if (!canvas) return;

  const hotspotsContainer = document.getElementById('earthHotspots');
  const lightbox = document.getElementById('earthLightbox');
  const lightboxBackdrop = document.getElementById('earthLightboxBackdrop');
  const lightboxClose = document.getElementById('earthLightboxClose');
  const lightboxName = document.getElementById('earthLightboxName');
  const lightboxCoords = document.getElementById('earthLightboxCoords');
  const lightboxText = document.getElementById('earthLightboxText');
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
  // near/far are placeholders until the model loads and its real scale is
  // known (glTF units are whatever the source file authored — not
  // guaranteed to be "meters"), then recomputed from its bounding radius.
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(4, 2.2, 5);
  scene.add(sun);

  // The Earth never moves — only the camera dollies toward/away from it.
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  let radius = 1;
  let distWide = 6;
  let distFocusMax = 6;
  let distFocusMin = 2;
  let cameraDist = distWide;
  let cameraDistTarget = distWide;

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
  // scrolls) and turns that into the pixel shift that keeps Earth parked
  // over it — same off-axis-projection trick space-scene-saturn.js uses,
  // just recomputed every frame here instead of once at idle.
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
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ------------------------------------------------------------------
  // Load the (pre-optimized — see assets/models/earth.glb) Earth model
  // ------------------------------------------------------------------
  let modelReady = false;
  const surfaceQuaternion = new THREE.Quaternion();
  const loader = new GLTFLoader();
  loader.load(
    MODEL_URL,
    (gltf) => {
      const model = gltf.scene;

      // Frame everything off the "surface" mesh's OWN bounding sphere, not
      // the combined atmo+surface+cloud one: each of the 3 shells carries
      // its own per-node rotation baked in from the source file, so the
      // combined AABB is much looser than the actual visible planet. Using
      // that inflated radius was the root cause of both the surface
      // hotspots floating in the wrong place (way outside the real sphere)
      // and the focus zoom feeling too far away. Measuring "surface" alone,
      // and doing it BEFORE parenting under earthGroup (so this isn't
      // measured through the group's current rotation), fixes both.
      let surfaceMesh = null;
      model.traverse((obj) => {
        if (obj.isMesh && obj.name === 'surface') surfaceMesh = obj;
      });
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(surfaceMesh || model);
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      radius = sphere.radius || 1;
      model.position.sub(sphere.center); // recenter on the group's own origin

      // The "surface" node carries its own baked rotation from the source
      // file (on top of the standard equirectangular UV unwrap the texture
      // was authored for), so a plain lat/lon -> sphere-point formula lands
      // on the wrong part of the actual texture. Capture that node's local
      // rotation once so hotspot placement can undo it below.
      if (surfaceMesh) surfaceQuaternion.copy(surfaceMesh.quaternion);

      earthGroup.add(model);

      distWide = radius * 6.5; // closer idle framing — Earth is the one dedicated body for the hero section, so it can read bigger
      distFocusMax = radius * 1.9; // click-to-focus: a real close-up, not a modest zoom
      distFocusMin = radius * 1.15; // as far as scroll-zoom can push in past that
      cameraDist = distWide;
      cameraDistTarget = distWide;

      camera.near = Math.max(0.01, radius * 0.01);
      camera.far = radius * 20;
      camera.updateProjectionMatrix();
      frameCamera();

      // Real Earth textures (dropped in assets/, resized/converted to web
      // formats — see the prep step) applied at runtime rather than baked
      // into the .glb: keeps the model file small and avoids further
      // binary glTF surgery. Loader assigns these into material slots
      // below once each image decodes; no need to await it here.
      const texLoader = new THREE.TextureLoader();
      function loadColorTex(url) {
        const tex = texLoader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false; // match the glTF UV convention used by the model's own embedded textures
        return tex;
      }
      function loadDataTex(url) {
        const tex = texLoader.load(url);
        tex.flipY = false;
        return tex;
      }
      const earthColorMap = loadColorTex('assets/models/earth-color.jpg');
      const earthNightMap = loadColorTex('assets/models/earth-nightlights.jpg');
      const earthBumpMap = loadDataTex('assets/models/earth-topography.jpg');
      const earthCloudsMap = loadColorTex('assets/models/earth-clouds.png');

      // The "atmo" and "cloud" shells ship with no texture and an opaque
      // metallic material (an artifact of the Blender -> glTF export — those
      // were almost certainly a procedural glow/fresnel shader in the
      // original file, which glTF's simple PBR model can't represent), AND
      // both meshes share a single material instance (glTF materials are
      // shared by reference) — clone it off for "cloud" so it can get its
      // own texture without also repainting "atmo".
      model.traverse((obj) => {
        if (!obj.isMesh) return;

        if (obj.name === 'surface') {
          // The source file's material carries emissiveFactor = (1,1,1)
          // with no emissive texture — an authoring leftover that
          // additively washed the old fallback texture out to flat white
          // regardless of scene lighting. Repurpose it to drive the real
          // night-lights map instead: mostly-black except the city-light
          // dots, so it now only glows where it should.
          obj.material.map = earthColorMap;
          obj.material.emissive.setRGB(1, 1, 1);
          obj.material.emissiveIntensity = 1;
          obj.material.emissiveMap = earthNightMap;
          obj.material.bumpMap = earthBumpMap;
          obj.material.bumpScale = radius * 0.004;
          obj.material.needsUpdate = true;
        } else if (obj.name === 'cloud') {
          obj.material = obj.material.clone();
          obj.material.map = earthCloudsMap;
          obj.material.transparent = true;
          obj.material.depthWrite = false;
          obj.material.metalness = 0;
          obj.material.roughness = 1;
          obj.material.color.set(0xffffff);
          obj.material.needsUpdate = true;
        } else if (obj.name === 'atmo') {
          obj.material.metalness = 0;
          obj.material.roughness = 1;
          obj.material.transparent = true;
          obj.material.opacity = 0.16;
          obj.material.color.set(0xeef3ff);
          obj.material.depthWrite = false;
        }
      });

      buildHotspotMarkers();
      modelReady = true;
    },
    undefined,
    (err) => {
      console.warn('[space-scene] Earth model failed to load:', err);
    }
  );

  // ------------------------------------------------------------------
  // Rotation state — idle spin, drag-to-rotate with release inertia
  // ------------------------------------------------------------------
  let yaw = 0.4;
  let pitch = 0.15;
  let yawVelocity = 0;
  let pitchVelocity = 0;
  const IDLE_SPEED = reducedMotion ? 0 : 0.0018;

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
    window.dispatchEvent(new CustomEvent('planet-focus-changed', { detail: { system: '3d', name: 'Tierra' } }));
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
    if (e.key === 'Escape' && focused && !isLightboxOpen()) exitFocus();
  });

  // Planet nav panel (planet-nav.js): jump straight to Earth, exit focus,
  // or nudge rotation/zoom by button instead of drag/scroll — same rules
  // as the direct pointer controls (observe mode only, one focus at a time).
  window.addEventListener('nav-focus-planet', (e) => {
    const d = e.detail;
    if (!d || d.system !== '3d') return;
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
    cameraDistTarget = clamp(cameraDistTarget - dir * radius * 0.18, distFocusMin, distFocusMax);
  });

  // ------------------------------------------------------------------
  // Raycasting hit-test against the Earth mesh
  // ------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function hitTestEarth(clientX, clientY) {
    if (!modelReady) return null;
    ndc.x = (clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(earthGroup, true);
    return hits.length ? hits[0] : null;
  }

  // ------------------------------------------------------------------
  // Pointer interaction — click vs. drag, gated to observe mode, same
  // interaction model as the 2D planets in universe-bg.js
  // ------------------------------------------------------------------
  let pointerId = null;
  let dragging = false;
  let dragStartedOnEarth = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;

  const activeTouches = new Map();
  let pinchStartDist = null;

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (!isObserveMode() || !modelReady) return;
    if (!focused && document.body.classList.contains('planet-focused')) return; // a 2D planet is already focused
    if (pointerId !== null) return; // already tracking a gesture

    const hit = hitTestEarth(e.clientX, e.clientY);
    if (!hit) return;

    pointerId = e.pointerId;
    dragging = false;
    dragStartedOnEarth = true;
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

    if (pointerId !== e.pointerId || !dragStartedOnEarth) return;

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
    const wasOnEarth = dragStartedOnEarth;
    pointerId = null;
    dragging = false;
    dragStartedOnEarth = false;

    if (wasOnEarth && !wasDragging && !focused) enterFocus();
  }

  window.addEventListener('pointerup', releasePointer);
  window.addEventListener('pointercancel', releasePointer);

  function updatePinch() {
    const pts = [...activeTouches.values()];
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    if (pinchStartDist !== null && focused && isObserveMode()) {
      const delta = pinchStartDist - dist;
      cameraDistTarget = clamp(cameraDistTarget + delta * 0.01 * radius, distFocusMin, distFocusMax);
    }
    pinchStartDist = dist;
  }

  window.addEventListener(
    'wheel',
    (e) => {
      if (!focused || !isObserveMode()) return;
      e.preventDefault();
      const ZOOM_SPEED = 0.0022;
      cameraDistTarget = clamp(cameraDistTarget + e.deltaY * ZOOM_SPEED * radius, distFocusMin, distFocusMax);
    },
    { passive: false }
  );

  // ------------------------------------------------------------------
  // Surface hotspots — click-to-open easter-egg info cards
  // ------------------------------------------------------------------
  const hotspots = (portfolioData.earthHotspots || []).map((h) => ({
    ...h,
    localPos: null,
    el: null
  }));

  function buildHotspotMarkers() {
    if (!hotspotsContainer) return;
    hotspots.forEach((h) => {
      h.localPos = latLonToVector3(h.lat, h.lon, radius * 1.01).applyQuaternion(surfaceQuaternion);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'earth-hotspot-marker';
      btn.setAttribute('aria-label', h.name);
      btn.addEventListener('click', () => openHotspot(h));
      hotspotsContainer.appendChild(btn);
      h.el = btn;
    });
  }

  function updateHotspots() {
    const show = focused && modelReady;
    for (let i = 0; i < hotspots.length; i++) {
      const h = hotspots[i];
      if (!h.el) continue;

      if (!show) {
        h.el.style.opacity = '0';
        h.el.style.pointerEvents = 'none';
        continue;
      }

      const worldPos = h.localPos.clone().applyMatrix4(earthGroup.matrixWorld);
      const normalWorld = worldPos.clone().normalize();
      const camDir = worldPos.clone().sub(camera.position).normalize();
      const facing = normalWorld.dot(camDir);

      const projected = worldPos.clone().project(camera);
      // Cull with a comfortable margin before the true grazing edge: the
      // rendered mesh is a decimated (non-perfectly-round) approximation of
      // the sphere this math assumes, so points right at the silhouette can
      // otherwise briefly project just outside the visible disk.
      if (facing > -0.22 || projected.z > 1) {
        h.el.style.opacity = '0';
        h.el.style.pointerEvents = 'none';
        continue;
      }

      const sx = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-projected.y * 0.5 + 0.5) * window.innerHeight;
      h.el.style.transform = `translate(${sx}px, ${sy}px)`;
      h.el.style.opacity = '1';
      h.el.style.pointerEvents = 'auto';
    }
  }

  function openHotspot(h) {
    if (lightboxName) lightboxName.textContent = h.title || h.name;
    if (lightboxCoords) {
      lightboxCoords.textContent = `${h.name} · ${h.lat.toFixed(1)}°, ${h.lon.toFixed(1)}°`;
    }
    if (lightboxText) lightboxText.textContent = h.text;
    openLightbox();
  }

  function isLightboxOpen() {
    return !!lightbox && lightbox.style.visibility === 'visible';
  }

  function openLightbox() {
    if (!lightbox || isLightboxOpen()) return;
    lightbox.style.visibility = 'visible';
    document.body.classList.add('star-lightbox-open');
    gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    gsap.fromTo(
      lightbox.querySelector('.star-card'),
      { y: 16, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.45, delay: 0.05, ease: 'power3.out' }
    );
  }

  function closeLightbox() {
    if (!lightbox || !isLightboxOpen()) return;
    gsap.to(lightbox, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        lightbox.style.visibility = 'hidden';
        document.body.classList.remove('star-lightbox-open');
      }
    });
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isLightboxOpen()) closeLightbox();
  });

  // ------------------------------------------------------------------
  // Render loop — frame-based motion (not delta-time), matching the 2D
  // canvas engine's own convention in universe-bg.js.
  // ------------------------------------------------------------------
  function animate() {
    requestAnimationFrame(animate);

    // Observe mode toggled off while focused (e.g. the eye button) — snap
    // back out, mirroring the same safeguard in universe-bg.js.
    if (focused && !isObserveMode()) exitFocus();

    // Track the hero section's current on-screen position every frame
    // (not just on resize) so Earth keeps holding its place as the page
    // scrolls, instead of sitting glued to the same screen spot forever.
    if (!focused) {
      computeIdleOffset();
      // panOffset (space-pan.js) is the observe-mode free-roam input —
      // added on top of the section anchor, not replacing it, so panning
      // away and toggling observe mode off/on snaps cleanly back.
      viewOffsetXTarget = idleOffsetX + panOffset.x;
      viewOffsetYTarget = idleOffsetY + panOffset.y;
    }

    if (!(dragStartedOnEarth && dragging)) {
      yaw += yawVelocity;
      pitch = clamp(pitch + pitchVelocity, -1.3, 1.3);
      yawVelocity *= 0.92;
      pitchVelocity *= 0.92;
      if (Math.abs(yawVelocity) < 0.00005) yawVelocity = 0;
      if (Math.abs(pitchVelocity) < 0.00005) pitchVelocity = 0;

      if (yawVelocity === 0 && pitchVelocity === 0) yaw += IDLE_SPEED;
    }

    earthGroup.rotation.y = yaw;
    earthGroup.rotation.x = pitch;
    // matrixWorld is normally only refreshed inside renderer.render(); since
    // updateHotspots() below reads earthGroup.matrixWorld to place markers
    // BEFORE that render call, it would otherwise use last frame's stale
    // matrix — a one-frame lag that's invisible at idle speed but makes
    // markers visibly detach from the sphere during fast drags.
    earthGroup.updateMatrixWorld(true);

    cameraDist += (cameraDistTarget - cameraDist) * 0.07;
    viewOffsetX += (viewOffsetXTarget - viewOffsetX) * 0.07;
    viewOffsetY += (viewOffsetYTarget - viewOffsetY) * 0.07;
    frameCamera();

    updateHotspots();

    renderer.render(scene, camera);
  }

  animate();
}
