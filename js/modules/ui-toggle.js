/**
 * =========================================================================
 * UI VISIBILITY TOGGLE
 * =========================================================================
 * Lets visitors hide the entire interface layer to appreciate the
 * universe background undisturbed ("observe mode", body.ui-hidden).
 *
 * Escape restores the UI — but only as the LAST step back: an open info
 * card closes first, then a focused planet, and only then observe mode.
 * This listener runs in the capture phase so it sees the state from
 * before the card/planet handlers react to the same key press.
 */

export function initUiToggle() {
  const btn = document.getElementById('uiToggle');
  if (!btn) return;

  const body = document.body;

  function setHidden(hidden) {
    body.classList.toggle('ui-hidden', hidden);
    btn.setAttribute('aria-pressed', String(hidden));
    btn.setAttribute('aria-label', hidden ? 'Mostrar interfaz' : 'Ocultar interfaz');
  }

  btn.addEventListener('click', () => {
    setHidden(!body.classList.contains('ui-hidden'));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !body.classList.contains('ui-hidden')) return;
    if (body.classList.contains('star-lightbox-open') || body.classList.contains('planet-focused')) return;
    setHidden(false);
  }, { capture: true });
}
