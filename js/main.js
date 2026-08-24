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
import { initNav } from './modules/nav.js';
import { initAnimations } from './modules/animations.js';
import { initTyping } from './modules/typing.js';
import { initProjectFilters } from './modules/project-filters.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Render all dynamic content from portfolio-data.js
  renderPortfolio();

  // 2. Initialize Universe Canvas Background
  initUniverseBg();

  // 3. Initialize Monochrome Glow Cursor
  initCursor();

  // 4. Initialize Project Modal Controller
  initModal();

  // 5. Initialize Mobile Navigation
  initNav();

  // 6. Initialize GSAP Entry & Scroll Reveals
  initAnimations();

  // 7. Initialize Typewriter Title Animations
  initTyping();

  // 8. Initialize Project Grid Filters
  initProjectFilters();
});
