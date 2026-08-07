/**
 * =========================================================================
 * PROJECT MODAL CONTROLLER
 * =========================================================================
 * Handles modal opening/closing and populates detailed project views.
 */

import { portfolioData } from '../data/portfolio-data.js';

export function initModal() {
  const modal = document.getElementById('modal');
  const closeModalBtn = document.getElementById('closeModal');
  const mTitle = document.getElementById('mTitle');
  const mTags = document.getElementById('mTags');
  const mIndex = document.getElementById('mIndex');
  const mThumb = document.getElementById('mThumb');
  const mDesc = document.getElementById('mDesc');
  const mLink = document.getElementById('mLink');

  if (!modal) return;

  function openModal(index) {
    const project = portfolioData.projects[index];
    if (!project) return;

    mTitle.textContent = project.title;
    mIndex.textContent = `${project.index || String(index + 1).padStart(2, '0')} / ${String(portfolioData.projects.length).padStart(2, '0')}`;
    
    // Tags
    mTags.innerHTML = project.tags.map(t => `<span>${t}</span>`).join('');

    // Thumbnail / Image
    if (project.image) {
      mThumb.innerHTML = `<img src="${project.image}" alt="${project.title}">`;
    } else {
      mThumb.innerHTML = `<span>${project.subtitle || 'Agregá tu captura'}</span>`;
    }

    // Description
    mDesc.innerHTML = `
      <p><strong>${project.summary}</strong></p>
      <p>${project.description}</p>
    `;

    // Link
    if (project.link && project.link !== '#') {
      mLink.href = project.link;
      mLink.style.display = 'inline-flex';
      mLink.innerHTML = `Visitar sitio <span class="arrow">→</span>`;
    } else {
      mLink.style.display = 'none';
    }

    // Modal Animation
    document.body.style.overflow = 'hidden';
    modal.style.visibility = 'visible';

    gsap.fromTo(modal, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.4, ease: 'power2.out' }
    );
    gsap.fromTo('.modal-body .inner', 
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

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.visibility === 'visible') {
      closeModal();
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}
