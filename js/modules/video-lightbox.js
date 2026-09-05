/**
 * =========================================================================
 * VIDEO LIGHTBOX
 * =========================================================================
 * Fullscreen overlay that plays a project's demo video large, muted,
 * looping. Reuses the `.lightbox` chrome (backdrop, close button) from
 * gallery.js's image lightbox for a consistent feel.
 */

let lightboxEl = null;

function ensureLightbox() {
  if (lightboxEl) return lightboxEl;

  lightboxEl = document.createElement('div');
  lightboxEl.className = 'lightbox video-lightbox';
  lightboxEl.innerHTML = `
    <button type="button" class="lb-close" aria-label="Cerrar">×</button>
    <video class="lb-video" loop muted playsinline autoplay controls></video>
  `;
  document.body.appendChild(lightboxEl);

  lightboxEl.querySelector('.lb-close').addEventListener('click', closeVideoLightbox);
  lightboxEl.addEventListener('click', (e) => {
    if (e.target === lightboxEl) closeVideoLightbox();
  });
  window.addEventListener('keydown', (e) => {
    if (!lightboxEl.classList.contains('active')) return;
    if (e.key === 'Escape') closeVideoLightbox();
  });

  return lightboxEl;
}

export function openVideoLightbox(src) {
  ensureLightbox();
  const video = lightboxEl.querySelector('.lb-video');

  if (video.getAttribute('src') !== src) {
    video.setAttribute('src', src);
  }
  video.currentTime = 0;
  video.play().catch(() => {});

  lightboxEl.classList.add('active');
  document.body.classList.add('lightbox-open');
}

export function closeVideoLightbox() {
  if (!lightboxEl) return;
  const video = lightboxEl.querySelector('.lb-video');
  video.pause();

  lightboxEl.classList.remove('active');
  document.body.classList.remove('lightbox-open');
}
