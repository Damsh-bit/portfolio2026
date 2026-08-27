/**
 * =========================================================================
 * JUSTIFIED PROJECT GALLERY & LIGHTBOX
 * =========================================================================
 * Lays out project screenshots in justified rows (Flickr/Google Photos
 * style) instead of a fixed grid, and opens a fullscreen lightbox with
 * prev/next navigation on click. Add more screenshots to a project by
 * pushing image paths into its `gallery` array in portfolio-data.js —
 * layout and lightbox scale automatically.
 */

const GAP = 8;
const MIN_ASPECT = 0.5; // clamp very tall full-page screenshots so they don't collapse into slivers

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
