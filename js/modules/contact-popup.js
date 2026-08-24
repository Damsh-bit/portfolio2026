/**
 * =========================================================================
 * CONTACT POPUP CONTROLLER
 * =========================================================================
 * Opens/closes the no-commitment contact popup triggered by the hero CTAs,
 * using the same GSAP fade/scale-in language as the project modal.
 */

export function initContactPopup() {
  const popup = document.getElementById('contactPopup');
  if (!popup) return;

  const card = popup.querySelector('.popup-card');
  const openTriggers = document.querySelectorAll('[data-open-popup]');
  const closeTriggers = popup.querySelectorAll('[data-popup-close]');

  function openPopup() {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('popup-open');
    popup.setAttribute('aria-hidden', 'false');
    popup.style.visibility = 'visible';

    gsap.fromTo(popup, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    gsap.fromTo(card,
      { y: 24, scale: 0.96, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.45, delay: 0.05, ease: 'power3.out' }
    );
  }

  function closePopup() {
    gsap.to(card, { y: 16, scale: 0.97, opacity: 0, duration: 0.25, ease: 'power2.in' });
    gsap.to(popup, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        popup.style.visibility = 'hidden';
        popup.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        document.body.classList.remove('popup-open');
      }
    });
  }

  openTriggers.forEach((btn) => btn.addEventListener('click', openPopup));
  closeTriggers.forEach((el) => el.addEventListener('click', closePopup));

  popup.addEventListener('click', (e) => {
    if (e.target === popup) closePopup();
  });

  window.addEventListener('keydown', (e) => {
    if (popup.getAttribute('aria-hidden') === 'false' && e.key === 'Escape') closePopup();
  });
}
