/* Page-level collection controls. The existing market module owns public data. */
(() => {
  const root = document.querySelector('.explore-page');
  if (!root) return;
  const results = document.querySelector('#marketResults');
  const search = document.querySelector('#liveMarketSearch');
  const clear = document.querySelector('[data-explore-clear]');
  const savedOnly = document.querySelector('#marketWatchOnly');
  const browse = document.querySelector('[data-market-browse]');
  const watchlist = document.querySelector('[data-market-watchlist]');
  const views = [...document.querySelectorAll('[data-market-view]')];
  const motion = document.querySelector('[data-explore-motion]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function view(value) {
    results.classList.toggle('compact', value === 'compact');
    views.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.marketView === value)));
  }
  let savedView = 'grid';
  try { if (localStorage.getItem('nucExploreView') === 'compact') savedView = 'compact'; } catch {}
  view(savedView);
  views.forEach(button => button.addEventListener('click', () => {
    view(button.dataset.marketView);
    try { localStorage.setItem('nucExploreView', button.dataset.marketView); } catch {}
  }));
  function scope() {
    browse.setAttribute('aria-pressed', String(!savedOnly.checked));
    watchlist.setAttribute('aria-pressed', String(savedOnly.checked));
    clear.hidden = !search.value;
  }
  browse.addEventListener('click', () => {
    document.querySelector('[data-launchpad][aria-pressed="true"]').click();
    scope();
  });
  document.querySelector('[data-explore-open-saved]').addEventListener('click', () => watchlist.click());
  results.addEventListener('click', event => {
    if (event.target.closest('[data-explore-reset-filters]')) document.querySelector('[data-launchpad="all"]').click();
    if (event.target.closest('[data-explore-retry]')) document.querySelector('[data-market-refresh]').click();
  });
  clear.addEventListener('click', () => { search.value = ''; search.dispatchEvent(new Event('input', { bubbles: true })); search.focus(); });
  root.addEventListener('input', scope);
  root.addEventListener('change', scope);
  root.addEventListener('click', () => queueMicrotask(scope));
  document.querySelector('#liveMarketForm').addEventListener('submit', () => queueMicrotask(scope));
  scope();

  function motionState() {
    const paused = Boolean(window.NUC_DOTS?.isPaused());
    motion.disabled = reduced.matches;
    motion.setAttribute('aria-pressed', String(paused || reduced.matches));
    motion.textContent = reduced.matches ? 'MOTION REDUCED' : paused ? 'RESUME MOTION ↗' : 'PAUSE MOTION Ⅱ';
  }
  motion.addEventListener('click', () => { window.NUC_DOTS?.setPaused(!window.NUC_DOTS.isPaused()); motionState(); });
  reduced.addEventListener('change', motionState);
  motionState();
})();
