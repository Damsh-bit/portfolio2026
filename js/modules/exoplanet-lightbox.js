/**
 * =========================================================================
 * EXOPLANET LIGHTBOX
 * =========================================================================
 * Shared info card for the Kepler-186f / TRAPPIST-1e click easter eggs —
 * one HTML block, content swapped per planet. Opens on the
 * 'open-exoplanet-lightbox' event dispatched by the universe canvas, with
 * the planet's { eyebrow, name, designation, stats, desc } as detail (see
 * the `lightbox` field on those two entries in universe-bg.js).
 */

export function initExoplanetLightbox() {
  const lightbox = document.getElementById('exoplanetLightbox');
  const closeBtn = document.getElementById('exoplanetLightboxClose');
  const backdrop = document.getElementById('exoplanetLightboxBackdrop');
  const card = lightbox ? lightbox.querySelector('.star-card') : null;
  const eyebrowEl = document.getElementById('exoplanetLightboxEyebrow');
  const nameEl = document.getElementById('exoplanetLightboxName');
  const designationEl = document.getElementById('exoplanetLightboxDesignation');
  const statsEl = document.getElementById('exoplanetLightboxStats');
  const descEl = document.getElementById('exoplanetLightboxDesc');

  if (!lightbox || !closeBtn || !card) return;

  function isOpen() {
    return lightbox.style.visibility === 'visible';
  }

  function populate(detail) {
    if (!detail) return;
    if (eyebrowEl) eyebrowEl.textContent = detail.eyebrow || '';
    if (nameEl) nameEl.textContent = detail.name || '';
    if (designationEl) designationEl.textContent = detail.designation || '';
    if (descEl) descEl.textContent = detail.desc || '';
    if (statsEl) {
      statsEl.innerHTML = '';
      (detail.stats || []).forEach(([label, value]) => {
        const row = document.createElement('div');
        const span = document.createElement('span');
        span.textContent = label;
        const strong = document.createElement('strong');
        strong.textContent = value;
        row.appendChild(span);
        row.appendChild(strong);
        statsEl.appendChild(row);
      });
    }
  }

  function open(detail) {
    populate(detail);
    if (isOpen()) return;
    lightbox.style.visibility = 'visible';
    document.body.classList.add('star-lightbox-open');

    gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    gsap.fromTo(card,
      { y: 16, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.45, delay: 0.05, ease: 'power3.out' }
    );
  }

  function close() {
    if (!isOpen()) return;
    gsap.to(lightbox, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        lightbox.style.visibility = 'hidden';
        document.body.classList.remove('star-lightbox-open');
      }
    });
  }

  window.addEventListener('open-exoplanet-lightbox', (e) => open(e.detail));
  closeBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });
}
