/**
 * =========================================================================
 * JUSTIFIED PROJECT GALLERY & LIGHTBOX
 * =========================================================================
 * Lays out project screenshots in justified rows (Flickr/Google Photos
 * style) instead of a fixed grid, and opens a fullscreen lightbox with
 * prev/next navigation on click. Add more screenshots to a project by
 * pushing image paths into its `gallery` array in portfolio-data.js —
 * layout and lightbox scale automatically.
 *
 * On mouse devices each thumbnail also works as a magnifier: hovering
 * zooms into the screenshot and moving the cursor pans across it.
 */

import { onFrame, ease } from './frame-loop.js';

const GAP = 8;
const MIN_ASPECT = 0.5; // clamp very tall full-page screenshots so they don't collapse into slivers

const ZOOM = 2.5;        // hover magnification over the thumbnail
const ZOOM_MIN = 1.6;    // floor for small screenshots that hit their native resolution early
const ZOOM_EASE = 0.2;   // per-frame ease (tuned at 60 fps) toward the cursor and zoom level
const ZOOM_EDGE = 0.1;   // the outer 10% of the tile already reaches the image's edge
const ZOOM_REST = { x: 0.5, y: 0, s: 1 }; // matches the thumbnail's object-position: top center

const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let lightboxEl = null;
let currentImages = [];
let currentIndex = 0;

export function renderGallery(container, images) {
  if (!container) return;

  container.innerHTML = '';

  if (container._resizeObs) {
    container._resizeObs.disconnect();
    container._resizeObs = null;
  }

  const wrapEl = container.closest('.m-gallery-wrap');

  if (!images || !images.length) {
    if (wrapEl) wrapEl.style.display = 'none';
    return;
  }
  if (wrapEl) wrapEl.style.display = '';

  const row = document.createElement('div');
  row.className = 'justified-gallery';
  container.appendChild(row);

  const items = images.map((src) => {
    const fig = document.createElement('figure');
    fig.className = 'g-item';

    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';

    fig.appendChild(img);
    row.appendChild(fig);

    return { el: fig, img, aspect: 1.5 };
  });

  const relayout = () => layoutJustified(row, items);

  items.forEach((item) => {
    const onReady = () => {
      if (item.img.naturalWidth && item.img.naturalHeight) {
        item.aspect = Math.max(item.img.naturalWidth / item.img.naturalHeight, MIN_ASPECT);
      }
      relayout();
    };
    if (item.img.complete && item.img.naturalWidth) {
      onReady();
    } else {
      item.img.addEventListener('load', onReady, { once: true });
    }
  });

  items.forEach((item, idx) => {
    item.el.addEventListener('click', () => openLightbox(images, idx));
    attachHoverZoom(item);
  });

  relayout();

  const ro = new ResizeObserver(() => relayout());
  ro.observe(row);
  container._resizeObs = ro;
}

/** Justified row layout: full rows stretch to fill width, the trailing
 *  incomplete row keeps its natural target height instead of stretching. */
function layoutJustified(row, items) {
  const containerWidth = row.clientWidth;
  if (!containerWidth) return;

  const targetHeight = window.innerWidth < 640 ? 150 : 240;
  const maxHeight = targetHeight * 1.7;

  let bucket = [];
  let aspectSum = 0;
  const rows = [];

  items.forEach((item) => {
    bucket.push(item);
    aspectSum += item.aspect;
    const widthAtTarget = aspectSum * targetHeight + (bucket.length - 1) * GAP;
    if (widthAtTarget >= containerWidth) {
      rows.push({ items: bucket, aspectSum });
      bucket = [];
      aspectSum = 0;
    }
  });
  if (bucket.length) rows.push({ items: bucket, aspectSum, incomplete: true });

  rows.forEach((r) => {
    const totalGap = (r.items.length - 1) * GAP;
    let height = r.incomplete
      ? targetHeight
      : (containerWidth - totalGap) / r.aspectSum;
    height = Math.min(height, maxHeight);

    r.items.forEach((item) => {
      item.el.style.height = `${height}px`;
      item.el.style.width = `${item.aspect * height}px`;
    });
  });
}

/* ---------- Hover zoom ---------- */

/** Magnifier: a second copy of the screenshot, scaled up and panned so the
 *  cursor position maps onto the *whole* image, including what the
 *  thumbnail's object-fit: cover crops away (the bottom of full-page
 *  captures). It starts and ends on the exact thumbnail framing, so
 *  entering and leaving read as one continuous zoom. */
function attachHoverZoom({ el, img }) {
  const lens = document.createElement('img');
  lens.className = 'g-zoom';
  lens.alt = '';
  lens.setAttribute('aria-hidden', 'true');
  el.appendChild(lens);

  const cur = { ...ZOOM_REST };
  const target = { ...ZOOM_REST };
  let box = null;
  let stopFrame = null;
  let hovering = false;

  const render = () => {
    const { w, h, bw, bh } = box;
    const tx = -(bw * cur.s - w) * cur.x;
    const ty = -(bh * cur.s - h) * cur.y;
    lens.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${cur.s})`;
  };

  const aim = (e) => {
    const r = el.getBoundingClientRect();
    const map = (v) => Math.min(Math.max((v - ZOOM_EDGE) / (1 - 2 * ZOOM_EDGE), 0), 1);
    target.x = map((e.clientX - r.left) / r.width);
    target.y = map((e.clientY - r.top) / r.height);
  };

  const step = (dt) => {
    // Gallery re-rendered (project swap) while hovered: no mouseleave will come.
    if (!el.isConnected) hovering = false;

    let settled = true;
    for (const key of ['x', 'y', 's']) {
      cur[key] = reducedMotion.matches ? target[key] : ease(cur[key], target[key], ZOOM_EASE, dt);
      if (Math.abs(cur[key] - target[key]) > 0.001) settled = false;
    }
    render();

    if (settled && !hovering) {
      el.classList.remove('is-zooming');
      stopFrame();
      stopFrame = null;
    }
  };

  el.addEventListener('mouseenter', (e) => {
    if (!canHover.matches || !img.naturalWidth) return;
    hovering = true;

    // Size the lens to the thumbnail's "cover" box; zoom is applied as scale.
    const w = el.clientWidth;
    const h = el.clientHeight;
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    box = { w, h, bw: img.naturalWidth * base, bh: img.naturalHeight * base };
    lens.style.width = `${box.bw}px`;
    lens.style.height = `${box.bh}px`;
    if (!lens.src) lens.src = img.currentSrc || img.src;

    // Past native resolution a screenshot only gets blurrier.
    target.s = Math.max(ZOOM_MIN, Math.min(ZOOM, 1 / base));
    aim(e);

    render();
    el.classList.add('is-zooming');
    if (!stopFrame) stopFrame = onFrame(step);
  });

  el.addEventListener('mousemove', (e) => {
    if (hovering) aim(e);
  });

  el.addEventListener('mouseleave', () => {
    if (!hovering) return;
    hovering = false;
    Object.assign(target, ZOOM_REST);
  });
}

/* ---------- Lightbox ---------- */

function ensureLightbox() {
  if (lightboxEl) return lightboxEl;

  lightboxEl = document.createElement('div');
  lightboxEl.className = 'lightbox';
  lightboxEl.innerHTML = `
    <button type="button" class="lb-close" aria-label="Cerrar">×</button>
    <button type="button" class="lb-prev" aria-label="Anterior">‹</button>
    <img class="lb-img" alt="">
    <button type="button" class="lb-next" aria-label="Siguiente">›</button>
    <span class="lb-count mono"></span>
  `;
  document.body.appendChild(lightboxEl);

  lightboxEl.querySelector('.lb-close').addEventListener('click', closeLightbox);
  lightboxEl.querySelector('.lb-prev').addEventListener('click', (e) => {
    e.stopPropagation();
    showLightbox(currentIndex - 1);
  });
  lightboxEl.querySelector('.lb-next').addEventListener('click', (e) => {
    e.stopPropagation();
    showLightbox(currentIndex + 1);
  });
  lightboxEl.addEventListener('click', (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });
  window.addEventListener('keydown', (e) => {
    if (!lightboxEl.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showLightbox(currentIndex - 1);
    if (e.key === 'ArrowRight') showLightbox(currentIndex + 1);
  });

  return lightboxEl;
}

function showLightbox(index) {
  const len = currentImages.length;
  currentIndex = (index + len) % len;

  const img = lightboxEl.querySelector('.lb-img');
  const nextSrc = currentImages[currentIndex];

  if (typeof gsap !== 'undefined') {
    gsap.to(img, {
      opacity: 0,
      duration: 0.15,
      onComplete: () => {
        img.src = nextSrc;
        gsap.to(img, { opacity: 1, duration: 0.25 });
      }
    });
  } else {
    img.src = nextSrc;
  }

  lightboxEl.querySelector('.lb-count').textContent = `${currentIndex + 1} / ${len}`;

  const showNav = len > 1;
  lightboxEl.querySelector('.lb-prev').style.display = showNav ? '' : 'none';
  lightboxEl.querySelector('.lb-next').style.display = showNav ? '' : 'none';
}

function openLightbox(images, index) {
  ensureLightbox();
  currentImages = images;
  showLightbox(index);
  lightboxEl.classList.add('active');
  document.body.classList.add('lightbox-open');
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove('active');
  document.body.classList.remove('lightbox-open');
}

export function isLightboxActive() {
  return !!(lightboxEl && lightboxEl.classList.contains('active'));
}
