/**
 * =========================================================================
 * MAIN APPLICATION ENTRY POINT
 * =========================================================================
 * Initializes renderer, canvas background, cursor, modals, and animations.
 */

import { renderPortfolio } from './modules/renderer.js';
import { initUniverseBg } from './modules/universe-bg.js';
import { initCursor } from './modules/cursor.js';
import { initModal } from './modules/modal.js';
import { initAnimations } from './modules/animations.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Render all dynamic content from portfolio-data.js
  renderPortfolio();

  // 2. Initialize Universe Canvas Background
  initUniverseBg();

  // 3. Initialize Violet Glow Cursor
  initCursor();

  // 4. Initialize Project Modal Controller
  initModal();

  // 5. Initialize GSAP Entry & Scroll Reveals
  initAnimations();
});
