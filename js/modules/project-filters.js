/**
 * =========================================================================
 * PROJECT GRID FILTERS
 * =========================================================================
 * Toggles visibility of .work-card items by their data-type ("trabajo" /
 * "personal") based on the active filter button, and keeps the section
 * count in sync with what's actually visible.
 */

export function initProjectFilters() {
  const filterBar = document.getElementById('workFilters');
  const grid = document.getElementById('workGrid');
  const countEl = document.getElementById('workCount');

  if (!filterBar || !grid) return;

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    filterBar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    const cards = grid.querySelectorAll('.work-card');
    let visible = 0;

    cards.forEach((card) => {
      const match = filter === 'all' || card.dataset.type === filter;
      card.classList.toggle('is-hidden', !match);
      if (match) visible++;
    });

    if (countEl) countEl.textContent = `(${String(visible).padStart(2, '0')})`;
  });
}
