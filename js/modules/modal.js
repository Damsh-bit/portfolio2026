/**
 * =========================================================================
 * PROJECT MODAL CONTROLLER
 * =========================================================================
 * Handles modal opening/closing, populates detailed project views, and
 * lets you slide between projects (swipe, arrows, or arrow keys) with a
 * GSAP parallax transition — the hero image travels farther and settles
 * slower than the text, giving the swap a sense of depth.
 */

import { portfolioData } from '../data/portfolio-data.js';
import { renderGallery, isLightboxActive } from './gallery.js';

const SWIPE_THRESHOLD = 80;
const DRAG_LOCK = 10;

export function initModal() {
  const modal = document.getElementById('modal');
  const closeModalBtn = document.getElementById('closeModal');
  const modalBody = modal ? modal.querySelector('.modal-body') : null;
  const inner = modal ? modal.querySelector('.modal-body .inner') : null;
  const prevBtn = document.getElementById('mPrev');
  const nextBtn = document.getElementById('mNext');
  const mTitle = document.getElementById('mTitle');
  const mTags = document.getElementById('mTags');
  const mIndex = document.getElementById('mIndex');
  const mThumb = document.getElementById('mThumb');
  const mDesc = document.getElementById('mDesc');
  const mLink = document.getElementById('mLink');
  const mGallery = document.getElementById('mGallery');

  if (!modal || !inner) return;

  let currentIndex = 0;
  let isAnimating = false;

  function getThumbImg() {
    return mThumb.querySelector('img');
  }

  function fillContent(index) {
    const project = portfolioData.projects[index];
    if (!project) return;

    mTitle.textContent = project.title;
    mIndex.textContent = `${project.index || String(index + 1).padStart(2, '0')} / ${String(portfolioData.projects.length).padStart(2, '0')}`;

    mTags.innerHTML = project.tags.map(t => `<span>${t}</span>`).join('');

    if (project.image) {
      mThumb.innerHTML = `<img src="${project.image}" alt="${project.title}">`;
    } else {
      mThumb.innerHTML = `<span>${project.subtitle || 'Agregá tu captura'}</span>`;
    }

    mDesc.innerHTML = `
      <p><strong>${project.summary}</strong></p>
      <p>${project.description}</p>
    `;

    if (project.link && project.link !== '#') {
      mLink.href = project.link;
      mLink.style.display = 'inline-flex';
      mLink.innerHTML = `Visitar sitio <span class="arrow">→</span>`;
    } else {
      mLink.style.display = 'none';
    }

    const galleryImages = (project.gallery && project.gallery.length)
      ? project.gallery
      : (project.image ? [project.image] : []);
    renderGallery(mGallery, galleryImages);
  }

  function openModal(index) {
    currentIndex = index;
    fillContent(index);
    if (modalBody) modalBody.scrollTop = 0;
    gsap.set(inner, { x: 0, opacity: 1 });

    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    modal.style.visibility = 'visible';

    gsap.fromTo(modal,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' }
    );
    gsap.fromTo(inner,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.1, ease: 'power3.out' }
    );
  }

  function closeModal() {
    gsap.to(modal, {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        modal.style.visibility = 'hidden';
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
      }
    });
  }

  /** Slide the current project out, swap content, then slide the next one
   *  in — the hero image moves 1.6x farther and settles slower than the
   *  text container, reading as a parallax layer instead of a flat swap. */
  function goToProject(direction, opts = {}) {
    if (isAnimating) return;
    const total = portfolioData.projects.length;
    const nextIndex = (currentIndex + direction + total) % total;
    const outX = direction > 0 ? -90 : 90;
    const outDuration = opts.outDuration ?? 0.28;

    isAnimating = true;

    const outThumbImg = getThumbImg();
    gsap.to(inner, { x: outX, opacity: 0, duration: outDuration, ease: 'power2.in' });
    if (outThumbImg) {
      gsap.to(outThumbImg, { x: outX * 1.6, duration: outDuration, ease: 'power2.in' });
    }

    gsap.delayedCall(outDuration, () => {
      currentIndex = nextIndex;
      fillContent(nextIndex);
      if (modalBody) modalBody.scrollTop = 0;

      const inX = -outX;
      gsap.set(inner, { x: inX, opacity: 0 });

      const inThumbImg = getThumbImg();
      if (inThumbImg) gsap.set(inThumbImg, { x: inX * 1.6 });

      gsap.to(inner, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });

      if (inThumbImg) {
        gsap.to(inThumbImg, {
          x: 0,
          duration: 0.75,
          ease: 'power3.out',
          onComplete: () => { isAnimating = false; }
        });
      } else {
        gsap.delayedCall(0.5, () => { isAnimating = false; });
      }
    });
  }

  // Event Delegation for Work Cards
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.work-card');
    if (card) {
      const idx = parseInt(card.dataset.project, 10);
      if (!isNaN(idx)) openModal(idx);
    }
  });

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (prevBtn) prevBtn.addEventListener('click', () => goToProject(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToProject(1));

  window.addEventListener('keydown', (e) => {
    if (modal.style.visibility !== 'visible') return;
    if (isLightboxActive()) return;

    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight') goToProject(1);
    if (e.key === 'ArrowLeft') goToProject(-1);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Swipe / drag navigation (pointer events cover touch, mouse & pen)
  if (modalBody) {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let dragX = 0;
    let lockedAxis = null;

    modalBody.addEventListener('pointerdown', (e) => {
      if (isAnimating || isLightboxActive()) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dragX = 0;
      lockedAxis = null;
    });

    modalBody.addEventListener('pointermove', (e) => {
      if (pointerId !== e.pointerId || isAnimating) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (!lockedAxis) {
        if (Math.abs(deltaX) > DRAG_LOCK || Math.abs(deltaY) > DRAG_LOCK) {
          lockedAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
          if (lockedAxis === 'x') modalBody.setPointerCapture(pointerId);
        }
      }
      if (lockedAxis !== 'x') return;

      e.preventDefault();
      dragX = deltaX;
      const damped = dragX * 0.5;

      gsap.set(inner, { x: damped, opacity: 1 - Math.min(Math.abs(damped) / 500, 0.4) });
      const thumbImg = getThumbImg();
      if (thumbImg) gsap.set(thumbImg, { x: damped * 1.5 });
    });

    const releaseDrag = (e) => {
      if (pointerId !== e.pointerId) return;
      const wasDraggingX = lockedAxis === 'x';
      const finalDx = dragX;
      pointerId = null;
      lockedAxis = null;
      dragX = 0;
      if (!wasDraggingX) return;

      if (Math.abs(finalDx) > SWIPE_THRESHOLD) {
        goToProject(finalDx < 0 ? 1 : -1, { outDuration: 0.18 });
      } else {
        gsap.to(inner, { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
        const thumbImg = getThumbImg();
        if (thumbImg) gsap.to(thumbImg, { x: 0, duration: 0.5, ease: 'power3.out' });
      }
    };

    modalBody.addEventListener('pointerup', releaseDrag);
    modalBody.addEventListener('pointercancel', releaseDrag);
  }
}
