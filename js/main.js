/**
 * =========================================================================
 * MAIN APPLICATION ENTRY POINT
 * =========================================================================
 * Initializes renderer, canvas background, cursor, modals, and animations.
 *
 * The Three.js layer (js/space/) is loaded with a dynamic import AFTER the
 * page content is rendered: it pulls Three.js from a CDN, and a static
 * import would make the whole site (content included) depend on that CDN
 * answering. Now the portfolio always renders; the 3D bodies join in when
 * they're ready, or quietly stay away if WebGL/the network isn't there.
 */

import { loadProjects } from './modules/projects-store.js';
import { renderPortfolio } from './modules/renderer.js';
import { initUniverseBg } from './modules/universe-bg.js';
import { initPlanetNav } from './modules/planet-nav.js';
import { initSpacePan } from './modules/space-pan.js';
import { initCursor } from './modules/cursor.js';
import { initModal } from './modules/modal.js';
import { initNav } from './modules/nav.js';
import { initAnimations } from './modules/animations.js';
import { initTyping } from './modules/typing.js';
import { initUiToggle } from './modules/ui-toggle.js';
import { initSpaceCards } from './modules/space-cards.js';
import { initChatbot } from './modules/chatbot.js';
import { initShipDashboard } from './modules/ship-dashboard.js';

// Personal projects live in a static JSON synced from GitHub — start the
// fetch now so it's usually done by the time the DOM is ready.
const projectsReady = loadProjects();

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render all dynamic content (portfolio-data.js + synced personal projects)
  await projectsReady;
  renderPortfolio();

  // 2. Initialize Universe Canvas Background (2D starfield, constellations,
  //    shooting stars, black hole state)
  initUniverseBg();

  // 2b. 3D layer (Three.js): Earth, Saturn, Alfa Muscae, Coruscant,
  //     El Lucero, TRAPPIST-1e, asteroid flybys and the black hole shader
  import('./space/index.js')
    .then((space) => space.initSpace())
    .then((ok) => {
      if (!ok) document.body.classList.add('no-space3d');
    })
    .catch((err) => {
      console.warn('[space] 3D layer unavailable:', err);
      document.body.classList.add('no-space3d');
    });

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

  // 9. Initialize UI Visibility Toggle (hide interface to view background)
  initUiToggle();

  // 10. Initialize the 3D bodies' info cards (Alfa Muscae, El Lucero,
  //     TRAPPIST-1e, Earth hotspots)
  initSpaceCards();

  // 11. Initialize Chatbot Widget (automated menu + quote form)
  initChatbot();

  // 12. Initialize Planet Navigation Panel (observe mode: cycle + rotate/zoom)
  initPlanetNav();

  // 13. Initialize Space Pan Controls (observe mode: free-roam the background)
  initSpacePan();

  // 14. Initialize Ship Dashboard (minimalist HUD: weather, time, last update)
  initShipDashboard();
});
