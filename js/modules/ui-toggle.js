/**
 * =========================================================================
 * UI VISIBILITY TOGGLE
 * =========================================================================
 * Lets visitors hide the entire interface layer to appreciate the
 * universe canvas background undisturbed. Escape restores the UI.
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
    body.classList.add('ui-toggle-hint-dismissed');
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && body.classList.contains('ui-hidden')) {
      setHidden(false);
    }
  });
}
