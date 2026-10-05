/**
 * Small math helpers shared by the 3D layer.
 */

import * as THREE from 'three';

// Vertical field of view every body camera uses. Narrow-ish on purpose:
// less fisheye stretch on close-ups than the old 45°.
export const FOV = 35;
const HALF_FOV_TAN = Math.tan(THREE.MathUtils.degToRad(FOV) / 2);

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Reference length body sizes are expressed against: the viewport height,
 * capped on tall portrait phones so planets don't swallow the screen width.
 */
export function referenceSize(width, height) {
  return Math.min(height, width * 1.25);
}

/**
 * Camera distance at which a sphere of `radius` shows a silhouette of
 * `px` pixels (radius) on a viewport `height` pixels tall.
 */
export function distanceForScreenRadius(radius, px, height) {
  const tanA = (px / (height / 2)) * HALF_FOV_TAN;
  return radius / Math.sin(Math.atan(tanA));
}

/** Inverse of distanceForScreenRadius: on-screen silhouette radius in px. */
export function screenRadiusAtDistance(radius, distance, height) {
  if (distance <= radius) return height;
  return ((height / 2) * Math.tan(Math.asin(radius / distance))) / HALF_FOV_TAN;
}

/**
 * Latitude/longitude (degrees) to a point on a THREE.SphereGeometry of
 * `radius` — matches its default equirectangular UV layout exactly, so a
 * marker lands on the same spot of the texture it describes.
 */
export function latLonToVector3(lat, lon, radius, target = new THREE.Vector3()) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return target.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Seeded PRNG (mulberry32) — stable procedural layouts across reloads. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
