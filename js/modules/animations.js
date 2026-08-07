/**
 * =========================================================================
 * GSAP ANIMATIONS & SCROLL REVEALS
 * =========================================================================
 * Manages hero entrance timeline and smooth scroll triggers.
 */

export function initAnimations() {
  if (typeof gsap === 'undefined') return;

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero Section Intro Animation
  if (!reduced) {
    gsap.set('.hero-title .line span', { yPercent: 110 });
    gsap.set('.eyebrow span', { yPercent: 110 });

    const tl = gsap.timeline({ delay: 0.15 });

    tl.to('.eyebrow span', { 
      yPercent: 0, 
      duration: 0.8, 
      ease: 'power4.out' 
    })
    .to('.hero-title .line span', { 
      yPercent: 0, 
      duration: 1.0, 
      stagger: 0.12, 
      ease: 'power4.out' 
    }, '-=0.4')
    .from('.hero-foot > div', { 
      opacity: 0, 
      y: 16, 
      duration: 0.8, 
      stagger: 0.1, 
      ease: 'power2.out' 
    }, '-=0.5')
    .from('.scroll-cue', { 
      opacity: 0, 
      duration: 0.8 
    }, '-=0.6');
  } else {
    gsap.set('.hero-title .line span, .eyebrow span', { yPercent: 0 });
  }

  // Scroll Reveals for Sections and Items
  if (!reduced && typeof ScrollTrigger !== 'undefined') {
    document.querySelectorAll('.reveal').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%'
        }
      });
    });

    gsap.utils.toArray('.work-card').forEach((card, i) => {
      gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: i * 0.08,
        scrollTrigger: {
          trigger: card,
          start: 'top 92%'
        }
      });
    });

    gsap.utils.toArray('.exp-row').forEach((row, i) => {
      gsap.to(row, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: 'power3.out',
        delay: i * 0.06,
        scrollTrigger: {
          trigger: row,
          start: 'top 92%'
        }
      });
    });
  } else {
    document.querySelectorAll('.reveal, .work-card, .exp-row').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }
}
