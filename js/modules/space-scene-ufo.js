/**
 * =========================================================================
 * 3D SPACE SCENE — UFO Fleet (ambient background easter egg)
 * =========================================================================
 * A small formation of real 3D UFOs (see assets/models/ufo.* — extracted
 * and re-optimized from the UFO_PACK.glb / UFO_Textures the user dropped
 * in assets/, the low-poly LOD_3 mesh + downsized PBR maps) drifts across
 * the screen every so often, at a random position, direction and tilt per
 * ship — same spirit as the 2D asteroids/shooting stars in universe-bg.js,
 * but rendered as lit, textured 3D models on their own canvas layer.
 *
 * Uses a static camera at the origin and a fixed-depth-per-fleet frustum
 * conversion (screen-relative position -> world position) rather than the
 * section-anchored view-offset trick space-scene.js/-saturn.js use — UFOs
 * are a transient full-viewport effect, not a body that has to hold a
 * fixed spot on the page.
 */

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const MODEL_URL = 'assets/models/ufo.obj';
const FOV = 50;
const NATIVE_WIDTH = 40; // the extracted mesh's own x-extent (bounding box), in mesh units

export function initUfoFleetScene() {
  const canvas = document.getElementById('space3d-ufo-canvas');
  if (!canvas) return;

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
  const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 1, 400);
  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, -1);

  // Same sun as the other 3D bodies, plus the ships' own emissive window
  // lights do the rest of the "flying at night" read.
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(4, 2.2, 5);
  scene.add(sun);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  function frustumHeightAtDepth(depthAbs) {
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    return 2 * Math.tan(vFOV / 2) * depthAbs;
  }
  function frustumWidthAtDepth(depthAbs) {
    return frustumHeightAtDepth(depthAbs) * camera.aspect;
  }

  // ------------------------------------------------------------------
  // Load the UFO model once; each ship in a fleet clones it (geometry +
  // material shared, only the transform differs — cheap).
  // ------------------------------------------------------------------
  let template = null;
  const loader = new OBJLoader();
  loader.load(
    MODEL_URL,
    (model) => {
      const texLoader = new THREE.TextureLoader();
      const colorMap = texLoader.load('assets/models/ufo-color.jpg');
      colorMap.colorSpace = THREE.SRGBColorSpace;
      const normalMap = texLoader.load('assets/models/ufo-normal.png');
      const metalRoughMap = texLoader.load('assets/models/ufo-metalrough.png');
      const emissiveMap = texLoader.load('assets/models/ufo-emissive.jpg');
      emissiveMap.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap,
        roughnessMap: metalRoughMap,
        metalnessMap: metalRoughMap,
        roughness: 1,
        metalness: 1,
        emissiveMap,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 1.8
      });

      let mesh = null;
      model.traverse((obj) => {
        if (obj.isMesh) mesh = obj;
      });
      if (mesh) {
        mesh.material = material;
        template = mesh;
      }
    },
    undefined,
    (err) => {
      console.warn('[space-scene-ufo] UFO model failed to load:', err);
    }
  );

  // ------------------------------------------------------------------
  // Fleet spawn/lifecycle — mirrors the asteroid/shooting-star cadence
  // pattern in universe-bg.js: an occasional random-interval timer, each
  // ship tracked in screen-relative coordinates so it always crosses the
  // CURRENT viewport edge-to-edge regardless of window size.
  // ------------------------------------------------------------------
  const ships = [];
  const FLEET_INTERVAL_MULT = reducedMotion ? 2.5 : 1; // rarer, not disabled, under reduced motion
  function nextFleetTimer() {
    return (1600 + Math.random() * 3000) * FLEET_INTERVAL_MULT; // ~27-77s at 60fps
  }
  let fleetTimer = nextFleetTimer();

  function spawnFleet() {
    if (!template) return;

    const count = 3 + Math.floor(Math.random() * 4); // 3-6 ships
    const dir = Math.random() > 0.5 ? 1 : -1; // left-to-right or right-to-left
    const depthBase = 55 + Math.random() * 35; // 55-90 units in front of the camera
    const fw = frustumWidthAtDepth(depthBase);
    const baseScale = (fw * 0.05) / NATIVE_WIDTH; // ~5% of screen width at that depth

    const startRelX = dir > 0 ? -0.18 : 1.18;
    const endMarginRelX = dir > 0 ? 1.18 : -0.18;
    const crossSeconds = 16 + Math.random() * 10;
    const relXPerFrame = ((endMarginRelX - startRelX) / (crossSeconds * 60));

    const baseRelY = 0.15 + Math.random() * 0.55;
    const yDriftTarget = (Math.random() - 0.5) * 0.22;

    for (let i = 0; i < count; i++) {
      const mesh = template.clone();
      mesh.material = template.material; // share the material, not just the geometry

      const depth = depthBase + (Math.random() - 0.5) * 20;
      const scale = baseScale * (0.7 + Math.random() * 0.7);
      mesh.scale.setScalar(scale);

      // Different tilt per ship, plus a slow individual spin for life.
      mesh.rotation.z = (Math.random() - 0.5) * 0.9;
      mesh.rotation.x = (Math.random() - 0.5) * 0.35;

      scene.add(mesh);

      ships.push({
        mesh,
        depth,
        relX: startRelX - (i * 0.05 * dir), // staggered formation, trailing behind the lead ship
        relY: baseRelY + (Math.random() - 0.5) * 0.08,
        relXPerFrame,
        yDrift: yDriftTarget / (crossSeconds * 60),
        spinSpeed: (Math.random() - 0.5) * 0.02,
        bob: Math.random() * Math.PI * 2
      });
    }

    fleetTimer = nextFleetTimer();
  }

  function updateFleet() {
    fleetTimer--;
    if (fleetTimer <= 0 && template) spawnFleet();

    for (let i = ships.length - 1; i >= 0; i--) {
      const s = ships[i];
      s.relX += s.relXPerFrame;
      s.relY += s.yDrift;
      s.bob += 0.03;

      const fw = frustumWidthAtDepth(s.depth);
      const fh = frustumHeightAtDepth(s.depth);
      const worldX = (s.relX - 0.5) * fw;
      const worldY = (0.5 - s.relY) * fh + Math.sin(s.bob) * (fh * 0.01);
      s.mesh.position.set(worldX, worldY, -s.depth);
      s.mesh.rotation.y += s.spinSpeed;

      if (s.relX < -0.3 || s.relX > 1.3) {
        scene.remove(s.mesh);
        ships.splice(i, 1);
      }
    }
  }

  // ------------------------------------------------------------------
  // Render loop
  // ------------------------------------------------------------------
  function animate() {
    requestAnimationFrame(animate);
    updateFleet();
    renderer.render(scene, camera);
  }

  animate();
}
