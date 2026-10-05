/**
 * =========================================================================
 * EARTH — hero section
 * =========================================================================
 * A plain UV sphere with the real Earth maps (day, night lights,
 * topography, clouds) instead of the old 4.4 MB glTF: no baked node
 * rotations to undo, so lat/lon hotspots land exactly where they should,
 * and the whole look is driven by the terrestrial shader set in
 * shaders/planet.js (day/night terminator, ocean glint, cloud shadows,
 * atmosphere).
 *
 * Extras: the International Space Station (NASA model) on a 51.6° orbit,
 * and the clickable surface hotspots from portfolio-data.js.
 */

import * as THREE from 'three';
import { CelestialBody } from './body.js';
import { loadTexture, loadModel } from '../core/assets.js';
import { createSurfaceMaterial, createCloudMaterial, createAtmosphereMaterial } from '../shaders/planet.js';

export default class Earth extends CelestialBody {
  constructor(engine, config) {
    super(engine, config);
    this.yaw = 0.4;
    this.pitch = 0.15;
    this.idleSpinSpeed = 0.1;
    this.hitScale = 1.04;
    this.extentScale = 1.25;
    this.issOrbit = null;
  }

  async build() {
    // 4K day map on desktops; 2K on phones/tablets and low-memory devices
    // (a fifth of the download, a quarter of the GPU memory).
    const small = this.engine.isTouch || (navigator.deviceMemory || 8) <= 4;
    const [day, night, height, clouds] = await Promise.all([
      loadTexture(small ? 'earth-day-2k.jpg' : 'earth-day.jpg', { color: true }),
      loadTexture('earth-night.jpg', { color: true }),
      loadTexture('earth-topo.jpg'),
      loadTexture('earth-clouds.jpg', { wrap: true })
    ]);

    const sphere = new THREE.SphereGeometry(1, 128, 64);

    const surface = new THREE.Mesh(sphere, createSurfaceMaterial(this.shared, {
      day,
      night,
      height,
      clouds,
      atmoColor: 0x5d9cff,
      nightTint: 0xffc98a,
      nightStrength: 1.8,
      bump: 1.6,
      specPower: 160,
      specStrength: 0.38
    }));
    surface.renderOrder = 0;
    this.root.add(surface);

    const cloudShell = new THREE.Mesh(sphere, createCloudMaterial(this.shared, { clouds, density: 0.95 }));
    cloudShell.scale.setScalar(1.008);
    cloudShell.renderOrder = 1;
    this.root.add(cloudShell);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 48),
      createAtmosphereMaterial(this.shared, { color: 0x4f8dff, intensity: 1.5, power: 1.4 })
    );
    atmosphere.scale.setScalar(1.045);
    atmosphere.renderOrder = 2;
    this.scene.add(atmosphere); // not under root: it's symmetric, no need to spin

    // ISS — optional garnish: the planet is ready even if this fails.
    try {
      const iss = await loadModel('iss.glb');
      iss.scale.setScalar(0.05);
      iss.position.set(1.16, 0, 0);
      iss.rotation.set(0.3, 0, 0.2);
      this.trackObject(iss);
      // inclined plane -> spinning carrier -> station
      const plane = new THREE.Group();
      plane.rotation.z = THREE.MathUtils.degToRad(51.6);
      const carrier = new THREE.Group();
      carrier.rotation.y = 0.8;
      carrier.add(iss);
      plane.add(carrier);
      this.root.add(plane);
      this.issOrbit = carrier;
      this.addPropLighting({ sunIntensity: 2.4, ambient: 0.08 });
    } catch (err) {
      console.warn('[space] ISS model unavailable:', err);
    }
  }

  tick(dt) {
    const slow = this.engine.reducedMotion ? 0.25 : 1;
    // Clouds drift a touch faster than the ground turns.
    this.shared.uCloudShift.value = (this.shared.uCloudShift.value + dt * 0.0035 * slow) % 1;
    if (this.issOrbit) this.issOrbit.rotation.y += dt * 0.32 * slow;
  }
}
