/**
 * =========================================================================
 * ASSETS — cached texture / model loading for the 3D layer
 * =========================================================================
 * Every texture and model is requested once and shared. Models are plain
 * glTF binaries (no Draco/Meshopt: those decoders need WebAssembly, which
 * the site's Content-Security-Policy doesn't allow) — they were already
 * simplified/quantized offline, see assets/space/CREDITS.md.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ASSET_BASE } from '../config.js';

const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const textureCache = new Map();
const modelCache = new Map();

let maxAnisotropy = 1;

export function setMaxAnisotropy(value) {
  maxAnisotropy = Math.max(1, value || 1);
}

/**
 * @param {string} file       file name inside assets/space/textures/
 * @param {object} [opts]
 * @param {boolean} [opts.color]   true for color (sRGB) data, false for
 *                                 masks/heights (linear)
 * @param {boolean} [opts.wrap]    repeat horizontally (equirectangular maps
 *                                 that get scrolled, e.g. clouds)
 */
export function loadTexture(file, { color = false, wrap = false } = {}) {
  const key = `${file}|${color}|${wrap}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const promise = textureLoader.loadAsync(`${ASSET_BASE}textures/${file}`).then((tex) => {
    tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.anisotropy = Math.min(8, maxAnisotropy);
    if (wrap) tex.wrapS = THREE.RepeatWrapping;
    return tex;
  });
  textureCache.set(key, promise);
  return promise;
}

/** Resolves to a fresh clone of the model's scene (materials are shared). */
export function loadModel(file) {
  if (!modelCache.has(file)) {
    modelCache.set(file, gltfLoader.loadAsync(`${ASSET_BASE}models/${file}`).then((gltf) => gltf.scene));
  }
  return modelCache.get(file).then((scene) => scene.clone(true));
}
