/**
 * =========================================================================
 * FORMAT HELPERS
 * =========================================================================
 * Small shared helpers for rendering project data. Anything synced from
 * GitHub (commit messages, AI summaries) goes through escapeHtml before it
 * touches innerHTML.
 */

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "hoy", "ayer", "hace 3 días", "hace 2 semanas", "hace 4 meses"... (calendar days, local time) */
export function relativeDate(iso) {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.round((startOfDay(new Date()) - startOfDay(then)) / 86400000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 14) return `hace ${days} días`;
  if (days < 60) return `hace ${Math.floor(days / 7)} semanas`;
  if (days < 365) return `hace ${Math.floor(days / 30)} meses`;
  const years = Math.floor(days / 365);
  return years === 1 ? 'hace 1 año' : `hace ${years} años`;
}

/** "2026-10-01" (local date from the sync) → "1 oct 2026". */
export function shortDate(ymd) {
  const date = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(date.getTime())) return ymd;
  const parts = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).formatToParts(date);
  const part = (type) => (parts.find((p) => p.type === type) || {}).value || '';
  return `${part('day')} ${part('month').replace('.', '')} ${part('year')}`;
}
