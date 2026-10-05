/**
 * =========================================================================
 * ASTEROID FLYBYS
 * =========================================================================
 * Same cadence and path as the old 2D polygons (one rock every ~25-55 s,
 * drifting across the screen from either side), now real 3D bodies: the
 * NASA shape model of asteroid Bennu (1999 RQ36), squashed/stretched per
 * spawn so no two look alike, tumbling on a random axis and lit by the
 * same sun as the planets. Screen-space, so independent of scroll/pan.
 * Off under prefers-reduced-motion, same as before.
 */

import * as THREE from 'three';
import { loadModel } from '../core/assets.js';
import { SUN_DIRECTION } from '../config.js';

const CAMERA_DISTANCE = 10;
const FOV = 35;

export class AsteroidField {
  constructor(engine) {
    this.engine = engine;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
    this.camera.position.set(0, 0, CAMERA_DISTANCE);
    this.rocks = [];
    this.template = null;
    this.timer = 6 + Math.random() * 10; // first one fairly soon
    this.opacity = 1;

    const sun = new THREE.DirectionalLight(0xffffff, 2.6);
    sun.position.set(...SUN_DIRECTION).multiplyScalar(10);
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0x9aa0b0, 0.18));

    this.material = new THREE.MeshStandardMaterial({
      color: 0x8d8780,
      roughness: 0.95,
      metalness: 0,
      flatShading: true,
      transparent: true
    });

    if (!engine.reducedMotion) {
      loadModel('bennu.glb')
        .then((model) => {
          let geometry = null;
          model.traverse((o) => {
            if (o.isMesh && !geometry) geometry = o.geometry;
          });
          this.template = geometry;
          // Compile the rock shader now, not on the first flyby.
          const probe = new THREE.Mesh(geometry, this.material);
          this.scene.add(probe);
          return engine.compile(this.scene, this.camera).then(() => this.scene.remove(probe));
        })
        .catch((err) => console.warn('[space] asteroid model unavailable:', err));
    }
  }

  _worldPerPixel(height) {
    return (2 * CAMERA_DISTANCE * Math.tan(THREE.MathUtils.degToRad(FOV) / 2)) / height;
  }

  _spawn(width, height) {
    const fromLeft = Math.random() > 0.5;
    const radiusPx = 8 + Math.random() * 8;
    const speed = 55 + Math.random() * 45; // px/s (the old 0.9-1.6 px/frame)

    const mesh = new THREE.Mesh(this.template, this.material);
    // Per-rock proportions, so every flyby is a different-looking rock.
    const shape = new THREE.Vector3(
      0.8 + Math.random() * 0.5,
      0.65 + Math.random() * 0.45,
      0.8 + Math.random() * 0.4
    );
    mesh.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
    this.scene.add(mesh);

    this.rocks.push({
      mesh,
      x: fromLeft ? -80 : width + 80,
      y: height * (0.08 + Math.random() * 0.55),
      vx: (fromLeft ? 1 : -1) * speed,
      vy: (Math.random() - 0.5) * 18,
      radiusPx,
      shape,
      axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      spin: (Math.random() - 0.5) * 1.6
    });
  }

  update(dt, t, ctx, dim) {
    const { width: w, height: h } = ctx;

    if (this.template && !this.engine.reducedMotion) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this._spawn(w, h);
        this.timer = 25 + Math.random() * 30;
      }
    }

    // Faded while a planet is focused, like the rest of the background.
    this.opacity = 1 - dim * 0.85;
    this.material.opacity = this.opacity;

    const wpp = this._worldPerPixel(h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.mesh.rotateOnAxis(r.axis, r.spin * dt);
      r.mesh.position.set((r.x - w / 2) * wpp, -(r.y - h / 2) * wpp, 0);
      r.mesh.scale.copy(r.shape).multiplyScalar(r.radiusPx * wpp);

      if (r.x < -140 || r.x > w + 140 || r.y < -140 || r.y > h + 140) {
        this.scene.remove(r.mesh);
        this.rocks.splice(i, 1);
      }
    }
  }

  isRenderable() {
    return this.rocks.length > 0 && this.opacity > 0.01;
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }
}
