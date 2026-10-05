/**
 * =========================================================================
 * SPACE INFO CARDS — the easter-egg cards opened from the 3D bodies
 * =========================================================================
 * One factory for the four docked cards (they used to be three copy-pasted
 * modules plus a fourth copy inside the old Earth scene):
 *
 *   #starLightbox       Alfa Muscae        'open-star-lightbox'
 *   #wandererLightbox   El Lucero          'open-wanderer-lightbox'
 *   #exoplanetLightbox  TRAPPIST-1e        'open-exoplanet-lightbox' ({ eyebrow, name, designation, stats, desc })
 *   #earthLightbox      Earth hotspots     'open-earth-lightbox'     ({ name, title, lat, lon, text })
 *
 * Shared behavior: GSAP fade/slide in, close button / backdrop / Escape,
 * and body.star-lightbox-open while visible (other modules use it to know
 * a card is up — e.g. Escape closes the card before leaving the planet).
 */

function createCard(id, eventName, populate) {
  const lightbox = document.getElementById(id);
  if (!lightbox) return;
  const card = lightbox.querySelector('.star-card');
  const closeBtn = document.getElementById(`${id}Close`);
  const backdrop = document.getElementById(`${id}Backdrop`);
  if (!card) return;

  let lastFocus = null;

  const isOpen = () => lightbox.style.visibility === 'visible';

  function open(detail) {
    if (populate) populate(detail);
    if (isOpen()) return;
    lastFocus = document.activeElement;
    lightbox.style.visibility = 'visible';
    document.body.classList.add('star-lightbox-open');
    gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    gsap.fromTo(card,
      { y: 16, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.45, delay: 0.05, ease: 'power3.out' }
    );
    if (closeBtn) closeBtn.focus({ preventScroll: true });
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
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      }
    });
  }

  window.addEventListener(eventName, (e) => open(e.detail));
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '';
}

export function initSpaceCards() {
  createCard('starLightbox', 'open-star-lightbox');
  createCard('wandererLightbox', 'open-wanderer-lightbox');

  createCard('exoplanetLightbox', 'open-exoplanet-lightbox', (d) => {
    if (!d) return;
    setText('exoplanetLightboxEyebrow', d.eyebrow);
    setText('exoplanetLightboxName', d.name);
    setText('exoplanetLightboxDesignation', d.designation);
    setText('exoplanetLightboxDesc', d.desc);
    const stats = document.getElementById('exoplanetLightboxStats');
    if (stats) {
      stats.replaceChildren(...(d.stats || []).map(([label, value]) => {
        const row = document.createElement('div');
        const span = document.createElement('span');
        span.textContent = label;
        const strong = document.createElement('strong');
        strong.textContent = value;
        row.append(span, strong);
        return row;
      }));
    }
  });

  createCard('earthLightbox', 'open-earth-lightbox', (h) => {
    if (!h) return;
    setText('earthLightboxName', h.title || h.name);
    setText('earthLightboxCoords', `${h.name} · ${h.lat.toFixed(1)}°, ${h.lon.toFixed(1)}°`);
    setText('earthLightboxText', h.text);
  });
}
