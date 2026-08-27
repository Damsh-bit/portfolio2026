/**
 * =========================================================================
 * WANDERING PLANET LIGHTBOX
 * =========================================================================
 * Info card for the wandering-planet click easter egg. Opens on the
 * 'open-wanderer-lightbox' event dispatched by the universe canvas when
 * the planet is clicked. Content is invented flavor text for now.
 */

export function initWandererLightbox() {
  const lightbox = document.getElementById('wandererLightbox');
  const closeBtn = document.getElementById('wandererLightboxClose');
  const backdrop = document.getElementById('wandererLightboxBackdrop');
  const card = lightbox ? lightbox.querySelector('.star-card') : null;

  if (!lightbox || !closeBtn || !card) return;

  function isOpen() {
    return lightbox.style.visibility === 'visible';
  }

  function open() {
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

  window.addEventListener('open-wanderer-lightbox', open);
  closeBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });
}
