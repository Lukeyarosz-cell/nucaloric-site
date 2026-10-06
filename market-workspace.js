/* Explore modules share one market observation and one saved-pool list. */
(() => {
  const root = document.querySelector('.market-workspace');
  if (!root) return;
  const search = document.querySelector('#liveMarketSearch'), clear = document.querySelector('[data-explore-clear]');
  const savedOnly = document.querySelector('#marketWatchOnly'), browse = document.querySelector('[data-market-browse]');
  const watchlist = document.querySelector('[data-market-watchlist]'), results = document.querySelector('#marketResults');
  const views = [...document.querySelectorAll('[data-market-view]')], reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function view(mode) {
    results.classList.toggle('compact', mode === 'compact');
    views.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.marketView === mode)));
  }
  let mode = 'grid'; try { if (localStorage.getItem('nucExploreView') === 'compact') mode = 'compact'; } catch {}
  view(mode);
  views.forEach(button => button.addEventListener('click', () => { view(button.dataset.marketView); try { localStorage.setItem('nucExploreView', button.dataset.marketView); } catch {} }));
  function scope() {
    browse.setAttribute('aria-pressed', String(!savedOnly.checked));
    watchlist.setAttribute('aria-pressed', String(savedOnly.checked));
    document.querySelector('[data-open-watch]').setAttribute('aria-pressed', String(savedOnly.checked));
    document.querySelector('[data-market-scope]').textContent = savedOnly.checked ? 'MY WATCHLIST' : 'ALL OBSERVATIONS';
    clear.hidden = !search.value;
  }
  function openPanel(id) {
    window.NUC_PANEL_LAYOUT?.reveal(id);
    document.querySelector(`[data-panel-id="${id}"]`).scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' });
  }
  browse.addEventListener('click', () => { document.querySelector('[data-launchpad][aria-pressed="true"]').click(); scope(); });
  document.querySelector('[data-open-watch]').addEventListener('click', () => watchlist.click());
  watchlist.addEventListener('click', () => openPanel('discovery'));
  document.querySelector('[data-open-sources]').addEventListener('click', event => { event.preventDefault(); openPanel('sources'); });
  clear.addEventListener('click', () => { search.value = ''; search.dispatchEvent(new Event('input', { bubbles: true })); search.focus(); });
  root.addEventListener('input', scope); root.addEventListener('change', scope); root.addEventListener('click', () => queueMicrotask(scope));
  document.querySelector('#liveMarketForm').addEventListener('submit', () => queueMicrotask(scope));
  results.addEventListener('click', event => {
    if (event.target.closest('[data-explore-reset-filters]')) document.querySelector('[data-launchpad="all"]').click();
    if (event.target.closest('[data-explore-retry]')) document.querySelector('[data-market-refresh]').click();
  });
  const number = value => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
  const usd = value => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', notation: value >= 100000 ? 'compact' : 'standard', maximumFractionDigits: 2 }).format(value);
  const node = (tag, className, text) => { const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; };
  function widgets(state) {
    const pulse = document.querySelector('[data-market-pulse]'), watch = document.querySelector('[data-module-watchlist]');
    pulse.replaceChildren(); watch.replaceChildren();
    const entries = state.state === 'ready' ? state.visiblePairs.filter(pair => number(pair.volume?.h24) !== null).sort((a, b) => number(b.volume.h24) - number(a.volume.h24)).slice(0, 3) : [];
    const maximum = entries.length ? Math.max(0, number(entries[0].volume.h24)) : 0;
    if (!entries.length) pulse.append(node('p', 'module-placeholder', state.state === 'loading' ? 'Reading current observations…' : state.state === 'error' ? 'The market feed is unavailable.' : 'No volume observations in this view.'));
    entries.forEach(pair => {
      const row = node('div', 'pulse-row'), heading = node('div', 'pulse-row-head');
      heading.append(node('span', '', pair.baseToken.symbol), node('span', '', usd(number(pair.volume.h24))));
      const segments = node('div', 'pulse-segments'); segments.setAttribute('aria-hidden', 'true');
      const filled = maximum > 0 ? Math.round(Math.max(0, number(pair.volume.h24)) / maximum * 24) : 0;
      for (let index = 0; index < 24; index++) segments.append(node('i', index < filled ? 'filled' : ''));
      row.append(heading, segments); pulse.append(row);
    });
    if (!state.saved.length) {
      const empty = node('div', 'watch-empty'), star = node('span', '', '☆'); star.setAttribute('aria-hidden', 'true');
      empty.append(star, node('h3', '', 'Keep a few on your radar.'), node('p', '', 'Save a pool from Discovery. Find it here next time.')); watch.append(empty);
    }
    state.saved.forEach(record => {
      const row = node('div', 'quick-watch-row'), link = node('a', '', record.name), remove = node('button', '', '×');
      link.href = `coin.html?pair=${encodeURIComponent(record.pair)}`; link.title = record.name;
      remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${record.name} from watchlist`);
      remove.addEventListener('click', () => {
        window.NUC_MARKET?.removeSaved(record.pair);
        (watch.querySelector('button') || watchlist).focus({ preventScroll: true });
      });
      row.append(link, remove); watch.append(row);
    });
  }
  addEventListener('nuc:market-update', event => widgets(event.detail));
  widgets(window.NUC_MARKET?.getState() || { state: 'loading', visiblePairs: [], saved: [] });
  scope();
  const motion = document.querySelector('[data-explore-motion]');
  function motionState() {
    const paused = Boolean(window.NUC_DOTS?.isPaused());
    motion.disabled = reduced.matches;
    motion.setAttribute('aria-pressed', String(paused || reduced.matches));
    motion.textContent = reduced.matches ? 'MOTION REDUCED' : paused ? 'MOTION OFF · RESUME' : 'MOTION Ⅱ';
    motion.setAttribute('aria-label', reduced.matches ? 'Motion reduced by your device preference' : paused ? 'Resume decorative motion' : 'Pause decorative motion');
  }
  motion.addEventListener('click', () => { window.NUC_DOTS?.setPaused(!window.NUC_DOTS.isPaused()); motionState(); });
  reduced.addEventListener('change', motionState); motionState();
})();
