/**
 * =========================================================================
 * MARKERS — clickable DOM points projected from the 3D layer
 * =========================================================================
 * Two kinds, both only shown while their body is focused:
 *
 *   surface hotspots   pinned to a lat/lon on the body (Earth): they turn
 *                      with the planet and hide once they rotate away
 *   orbit info points  a ring of markers around a small body's silhouette
 *                      (Alfa Muscae, El Lucero, TRAPPIST-1e): "+" markers
 *                      expand a one-line fact, the gold one opens the
 *                      body's info card. These used to be drawn into the 2D
 *                      canvas and hit-tested by hand; now they're real
 *                      buttons (keyboard + screen reader friendly).
 *
 * All positions are written as transforms after the WebGL frame is drawn.
 */

import * as THREE from 'three';
import { latLonToVector3 } from '../core/math.js';

const ORBIT_GAP = 34; // px between the body's silhouette and its markers
const _v = new THREE.Vector3();
const _n = new THREE.Vector3();
const _toCam = new THREE.Vector3();

export class MarkerLayer {
  constructor(container) {
    this.container = container;
    this.groups = new Map(); // body id -> { body, hotspots: [], points: [] }
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  _group(body) {
    if (!this.groups.has(body.id)) this.groups.set(body.id, { body, hotspots: [], points: [], shown: false });
    return this.groups.get(body.id);
  }

  addHotspots(body, hotspots, onOpen) {
    if (!this.container) return;
    const group = this._group(body);
    hotspots.forEach((h) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'space-marker space-hotspot';
      btn.setAttribute('aria-label', `${h.name}: ${h.title || ''}`.trim());
      btn.addEventListener('click', () => onOpen(h));
      this.container.appendChild(btn);
      group.hotspots.push({
        data: h,
        el: btn,
        local: latLonToVector3(h.lat, h.lon, body.radius * 1.004),
        visible: false
      });
    });
  }

  addOrbitPoints(body, points, onCard) {
    if (!this.container || !points) return;
    const group = this._group(body);
    points.forEach((p) => {
      const rad = (p.angle * Math.PI) / 180;
      const wrap = document.createElement('div');
      wrap.className = 'space-info' + (p.card ? ' is-card' : '');
      if (Math.cos(rad) < 0) wrap.classList.add('is-left');

      const link = document.createElement('span');
      link.className = 'space-info-link';
      link.setAttribute('aria-hidden', 'true');
      // Connector from the marker back toward the body's silhouette.
      wrap.style.setProperty('--link-angle', `${p.angle + 180}deg`);
      wrap.style.setProperty('--link-length', `${ORBIT_GAP - 11}px`);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'space-marker space-info-marker';

      let caption = null;
      if (p.card) {
        btn.setAttribute('aria-label', `Abrir la ficha de ${body.name}`);
        btn.addEventListener('click', () => onCard(body));
      } else {
        caption = document.createElement('span');
        caption.className = 'space-info-caption mono';
        caption.textContent = p.text;
        btn.setAttribute('aria-label', p.text);
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', () => {
          const open = !wrap.classList.contains('is-open');
          wrap.classList.toggle('is-open', open);
          btn.setAttribute('aria-expanded', String(open));
        });
      }

      wrap.appendChild(link);
      wrap.appendChild(btn);
      if (caption) wrap.appendChild(caption);
      this.container.appendChild(wrap);

      group.points.push({ el: wrap, btn, angle: rad, card: !!p.card });
    });
  }

  collapse(bodyId) {
    const group = this.groups.get(bodyId);
    if (!group) return;
    group.points.forEach((p) => {
      p.el.classList.remove('is-open');
      if (!p.card) p.btn.setAttribute('aria-expanded', 'false');
    });
  }

  _setVisible(el, visible) {
    if (visible) {
      if (!el.classList.contains('is-visible')) el.classList.add('is-visible');
    } else if (el.classList.contains('is-visible')) {
      el.classList.remove('is-visible');
    }
  }

  update(focusedBody, width, height) {
    this.groups.forEach((group) => {
      const body = group.body;
      const active = body === focusedBody && body.ready && body.focusMix > 0.55;

      if (!active) {
        if (group.shown) {
          group.hotspots.forEach((h) => this._setVisible(h.el, false));
          group.points.forEach((p) => this._setVisible(p.el, false));
          group.shown = false;
        }
        return;
      }
      group.shown = true;

      // Surface hotspots: project, hide when turned away from the camera.
      for (let i = 0; i < group.hotspots.length; i++) {
        const h = group.hotspots[i];
        _v.copy(h.local).applyMatrix4(body.root.matrixWorld);
        _n.copy(_v).normalize();
        _toCam.copy(body.camera.position).sub(_v).normalize();
        const facing = _n.dot(_toCam);
        _v.project(body.camera);
        const show = facing > 0.22 && _v.z < 1;
        this._setVisible(h.el, show);
        if (show) {
          const x = (_v.x * 0.5 + 0.5) * width;
          const y = (-_v.y * 0.5 + 0.5) * height;
          h.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        }
      }

      // Orbit info points: a ring just outside the silhouette.
      const r = body.screen.r;
      for (let i = 0; i < group.points.length; i++) {
        const p = group.points[i];
        const cos = Math.cos(p.angle);
        const sin = Math.sin(p.angle);
        const x = body.screen.x + cos * (r + ORBIT_GAP);
        const y = body.screen.y + sin * (r + ORBIT_GAP);
        p.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        this._setVisible(p.el, true);
      }
    });
  }
}
