/**
 * =========================================================================
 * ALPHA MUSCAE STAR LIGHTBOX
 * =========================================================================
 * Small info card for the Musca-constellation planet easter egg. Opens on
 * the 'open-star-lightbox' event dispatched by the universe canvas when
 * that planet is clicked.
 */

export function initStarLightbox() {
  const lightbox = document.getElementById('starLightbox');
  const closeBtn = document.getElementById('starLightboxClose');
  const backdrop = document.getElementById('starLightboxBackdrop');
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

  window.addEventListener('open-star-lightbox', open);
  closeBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });
}
