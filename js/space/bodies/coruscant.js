/**
 * =========================================================================
 * CORUSCANT — experience section
 * =========================================================================
 * The city-planet: same terrestrial shader as Earth (shaders/planet.js),
 * fed the Coruscant maps — its amber city grid now only lights up on the
 * night side, across a soft terminator, instead of glowing everywhere.
 *
 * New: orbital traffic. A few thousand lights stream around the planet in
 * inclined lanes (some prograde, some retrograde), animated entirely on
 * the GPU from per-point attributes — brightest over the night side,
 * hidden behind the globe by the depth buffer.
 */

import * as THREE from 'three';
import { CelestialBody } from './body.js';
import { loadTexture } from '../core/assets.js';
import { seededRandom } from '../core/math.js';
import { createSurfaceMaterial, createCloudMaterial, createAtmosphereMaterial } from '../shaders/planet.js';
import { makeAdditive } from '../shaders/chunks.js';

const TRAFFIC_VERTEX = /* glsl */ `
  attribute float aRadius;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aLane;
  attribute float aSize;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform vec3 uSunDir;
  varying float vNight;
  varying float vSize;

  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
  mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

  void main() {
    float a = aPhase + uTime * aSpeed;
    vec3 p = vec3(cos(a), 0.0, sin(a)) * aRadius;
    // position.xy carries each lane's tilt (x) and node (y)
    p = rotZ(position.y) * rotX(position.x) * p;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vNight = 1.0 - smoothstep(-0.2, 0.25, dot(normalize(wp.xyz), normalize(uSunDir)));
    vec4 mv = viewMatrix * wp;
    gl_Position = projectionMatrix * mv;
    vSize = aSize;
    gl_PointSize = clamp(aSize * uPixelRatio * uScale / -mv.z, 1.0, 6.0 * uPixelRatio);
  }
`;

const TRAFFIC_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying float vNight;
  varying float vSize;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = smoothstep(0.5, 0.0, d);
    float intensity = core * core * mix(0.22, 1.0, vNight) * uOpacity;
    vec3 color = mix(vec3(1.0, 0.86, 0.62), vec3(0.75, 0.9, 1.0), step(1.6, vSize)) * intensity * 1.4;
    gl_FragColor = vec4(color, intensity * 0.4);
  }
`;

export default class Coruscant extends CelestialBody {
  constructor(engine, config) {
    super(engine, config);
    this.yaw = -0.5;
    this.pitch = 0.1;
    this.idleSpinSpeed = 0.07;
    this.hitScale = 1.04;
    this.extentScale = 1.3;
    this.traffic = null;
  }

  async build() {
    const [day, night, bump, spec, clouds] = await Promise.all([
      loadTexture('coruscant-day.jpg', { color: true }),
      loadTexture('coruscant-night.jpg', { color: true }),
      loadTexture('coruscant-bump.jpg'),
      loadTexture('coruscant-spec.jpg'),
      loadTexture('coruscant-clouds.jpg', { wrap: true })
    ]);

    const sphere = new THREE.SphereGeometry(1, 128, 64);

    const surface = new THREE.Mesh(sphere, createSurfaceMaterial(this.shared, {
      day,
      night,
      height: bump,
      spec,
      clouds,
      atmoColor: 0x9db4ff,
      nightTint: 0xffb36b,
      nightStrength: 2.4,
      bump: 2.2,
      specPower: 40,
      specStrength: 0.25,
      cloudShadow: 0.3,
      haze: 0.7
    }));
    this.root.add(surface);

    const cloudShell = new THREE.Mesh(sphere, createCloudMaterial(this.shared, {
      clouds,
      density: 0.75,
      tint: 0xe9dccb
    }));
    cloudShell.scale.setScalar(1.01);
    cloudShell.renderOrder = 1;
    this.root.add(cloudShell);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 48),
      createAtmosphereMaterial(this.shared, { color: 0x8fa6ff, intensity: 1.2, power: 1.6 })
    );
    atmosphere.scale.setScalar(1.05);
    atmosphere.renderOrder = 2;
    this.scene.add(atmosphere);

    this.traffic = this._buildTraffic();
    this.root.add(this.traffic);
  }

  _buildTraffic() {
    const rand = seededRandom(1977);
    const LANES = 9;
    const PER_LANE = 260;
    const count = LANES * PER_LANE;
    const lane = new Float32Array(count * 3);
    const radius = new Float32Array(count);
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    const laneId = new Float32Array(count);
    const size = new Float32Array(count);

    let i = 0;
    for (let l = 0; l < LANES; l++) {
      const tiltX = (rand() - 0.5) * 1.6;
      const node = rand() * Math.PI * 2;
      const r = 1.035 + rand() * 0.11;
      const dir = rand() > 0.35 ? 1 : -1;
      const v = (0.05 + rand() * 0.07) * dir;
      for (let k = 0; k < PER_LANE; k++, i++) {
        lane[i * 3] = tiltX;
        lane[i * 3 + 1] = node;
        lane[i * 3 + 2] = 0;
        radius[i] = r + (rand() - 0.5) * 0.008;
        // Convoys: points bunch up along the lane instead of an even ring.
        phase[i] = (k / PER_LANE) * Math.PI * 2 + Math.sin(k * 0.37) * 0.12;
        speed[i] = v * (0.96 + rand() * 0.08);
        laneId[i] = l;
        size[i] = rand() > 0.92 ? 2.0 : 1.1 + rand() * 0.4;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(lane, 3));
    geometry.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
    geometry.setAttribute('aLane', new THREE.BufferAttribute(laneId, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.2);

    this.trafficUniforms = {
      uTime: { value: 0 },
      uOpacity: this.shared.uOpacity,
      uSunDir: this.shared.uSunDir,
      uPixelRatio: { value: 1 },
      uScale: { value: 6 }
    };
    const material = makeAdditive(new THREE.ShaderMaterial({
      uniforms: this.trafficUniforms,
      vertexShader: TRAFFIC_VERTEX,
      fragmentShader: TRAFFIC_FRAGMENT
    }));
    const points = new THREE.Points(geometry, material);
    points.renderOrder = 3;
    return points;
  }

  tick(dt) {
    const slow = this.engine.reducedMotion ? 0.25 : 1;
    this.shared.uCloudShift.value = (this.shared.uCloudShift.value + dt * 0.0025 * slow) % 1;
    if (this.trafficUniforms) {
      this.trafficUniforms.uTime.value += dt * slow;
      this.trafficUniforms.uPixelRatio.value = this.engine.renderer.getPixelRatio();
    }
  }
}
