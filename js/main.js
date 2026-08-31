/**
 * =========================================================================
 * MAIN APPLICATION ENTRY POINT
 * =========================================================================
 * Initializes renderer, canvas background, cursor, modals, and animations.
 */

import { renderPortfolio } from './modules/renderer.js';
import { initUniverseBg } from './modules/universe-bg.js';
import { initSpaceScene } from './modules/space-scene.js';
import { initSaturnScene } from './modules/space-scene-saturn.js';
import { initBlackHoleScene } from './modules/space-scene-blackhole.js';
import { initUfoFleetScene } from './modules/space-scene-ufo.js';
import { initPlanetNav } from './modules/planet-nav.js';
import { initCursor } from './modules/cursor.js';
import { initModal } from './modules/modal.js';
import { initNav } from './modules/nav.js';
import { initAnimations } from './modules/animations.js';
import { initTyping } from './modules/typing.js';
import { initProjectFilters } from './modules/project-filters.js';
import { initUiToggle } from './modules/ui-toggle.js';
import { initStarLightbox } from './modules/star-lightbox.js';
import { initWandererLightbox } from './modules/wanderer-lightbox.js';
import { initExoplanetLightbox } from './modules/exoplanet-lightbox.js';
import { initChatbot } from './modules/chatbot.js';
import { initShipDashboard } from './modules/ship-dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Render all dynamic content from portfolio-data.js
  renderPortfolio();

  // 2. Initialize Universe Canvas Background
  initUniverseBg();

  // 2b. Initialize 3D Space Scene (Three.js Earth — first navigable planet)
  initSpaceScene();

  // 2c. Initialize 3D Space Scene (Three.js Saturn — replaces the 2D gas giant)
  initSaturnScene();

  // 2d. Initialize 3D Space Scene (WebGL black hole shader — "agujero" easter egg)
  initBlackHoleScene();

  // 2e. Initialize 3D Space Scene (UFO fleet — occasional ambient flyby)
  initUfoFleetScene();

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

  // 9. Initialize UI Visibility Toggle (hide interface to view background)
  initUiToggle();

  // 10. Initialize Alpha Muscae Star Lightbox (planet click easter egg)
  initStarLightbox();

  // 11. Initialize Wandering Planet Lightbox (planet click easter egg)
  initWandererLightbox();

  // 11b. Initialize Exoplanet Lightbox (Kepler-186f / TRAPPIST-1e easter eggs)
  initExoplanetLightbox();

  // 12. Initialize Chatbot Widget (automated menu + quote form)
  initChatbot();

  // 13. Initialize Planet Navigation Panel (observe mode: cycle + rotate/zoom)
  initPlanetNav();

  // 14. Initialize Ship Dashboard (minimalist HUD: weather, time, last update)
  initShipDashboard();
});
