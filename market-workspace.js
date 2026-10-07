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
  let latest = { state: 'loading', visiblePairs: [], saved: [] }, fieldOffset = 0, inspected = null, opener = null;
  let inspectorPair = null, inspectorCheckedAt = null;
  const field = document.querySelector('[data-field-nodes]'), fieldCount = document.querySelector('[data-field-count]');
  const remix = document.querySelector('[data-field-shuffle]'), inspector = document.querySelector('[data-pool-inspector]');
  const price = value => number(value) === null ? 'Unavailable' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: Number(value) < 1 ? 8 : 2, notation: Number(value) >= 100000 ? 'compact' : 'standard' }).format(Number(value));
  const change = value => number(value) === null ? 'Unavailable' : `${Number(value) > 0 ? '+' : ''}${Number(value).toFixed(2)}%`;
  function renderField() {
    const focusedPair = document.activeElement?.dataset.fieldPair;
    field.replaceChildren();
    const pairs = latest.state === 'ready' ? latest.visiblePairs : [];
    if (!pairs.length) {
      field.append(node('p', 'field-placeholder', latest.state === 'loading' ? 'Gathering current observations.' : latest.state === 'error' ? 'Pool observations are unavailable. Retry the feed below.' : 'No pools in this view. Try another search.'));
      fieldCount.textContent = latest.state === 'loading' ? 'READING…' : latest.state === 'error' ? 'FEED UNAVAILABLE' : '0 POOLS';
      remix.disabled = true;
      return;
    }
    fieldOffset %= pairs.length;
    const count = Math.min(6, pairs.length);
    for (let i = 0; i < count; i++) {
      const pair = pairs[(fieldOffset + i) % pairs.length], button = node('button', 'field-node');
      button.type = 'button'; button.dataset.fieldPair = pair.pairAddress;
      button.setAttribute('aria-label', `Quick look at ${pair.baseToken.name}`);
      const identity=node('span','field-pool-identity');
      identity.append(node('b','',pair.baseToken.symbol),node('small','',pair.baseToken.name));
      const performance=node('span','field-pool-change',number(pair.priceChange?.h24)===null?'—':change(pair.priceChange.h24));
      performance.dataset.direction=number(pair.priceChange?.h24)===null?'unknown':Number(pair.priceChange.h24)>=0?'up':'down';
      button.append(node('span','field-pool-number',String(i+1).padStart(2,'0')),identity,performance,node('span','field-pool-arrow','↗'));
      button.addEventListener('click', () => inspect(pair.pairAddress, button));
      field.append(button);
    }
    fieldCount.textContent = `${count} OF ${pairs.length} POOLS`;
    remix.disabled = pairs.length <= count;
    if (focusedPair) (field.querySelector(`[data-field-pair="${focusedPair}"]`) || remix).focus({ preventScroll: true });
  }
  function renderInspector() {
    if (!inspector.open) return;
    const body = inspector.querySelector('[data-inspector-body]');
    const focus = document.activeElement?.dataset.inspectorAction;
    body.replaceChildren();
    const current = latest.visiblePairs.find(pair => pair.pairAddress === inspected);
    if (current) { inspectorPair = current; inspectorCheckedAt = latest.checkedAt; }
    const pair = latest.state === 'ready' && inspectorCheckedAt === latest.checkedAt ? current || inspectorPair : null;
    if (!pair) {
      const title = node('h2', '', 'Observation unavailable'); title.id = 'inspectorTitle';
      body.append(title, node('p', 'inspector-unavailable', 'This pool is no longer in the current view. Close this preview and refresh Discovery for current observations.'));
      return;
    }
    const identity = node('div', 'inspector-identity'), title = node('h2', '', pair.baseToken.name); title.id = 'inspectorTitle';
    identity.append(node('span', '', `${pair.baseToken.symbol} / ${pair.quoteToken?.symbol || 'Unknown'} / ${pair.dexId}`), title);
    const observed = node('div', 'inspector-price');
    observed.append(node('span', '', 'OBSERVED PRICE / USD'), node('b', '', price(pair.priceUsd)), node('small', '', `${change(pair.priceChange?.h24)} / 24H CHANGE`));
    const metrics = node('dl', 'inspector-metrics');
    for (const [label, value] of [['Liquidity', price(pair.liquidity?.usd)], ['24h volume', price(pair.volume?.h24)]]) {
      const metric = node('div'); metric.append(node('dt', '', label), node('dd', '', value)); metrics.append(metric);
    }
    const mint = node('p', 'inspector-mint', `MINT / ${pair.baseToken.address}`), actions = node('div', 'inspector-actions');
    const saved = latest.saved.some(record => record.pair === pair.pairAddress), save = node('button', '', saved ? 'SAVED ★ / REMOVE' : 'SAVE TO WATCHLIST ☆');
    save.type = 'button'; save.dataset.inspectorAction = 'save'; save.setAttribute('aria-pressed', String(saved));
    const notice = node('p', 'inspector-notice', 'Provider observations. Refresh Discovery for new data.'); notice.setAttribute('role', 'status');
    save.addEventListener('click', () => {
      window.NUC_MARKET?.toggleSaved(pair.pairAddress);
      const updated = inspector.querySelector('[data-inspector-action=save]');
      updated?.focus({ preventScroll: true });
      const feedback = inspector.querySelector('.inspector-notice');
      if (feedback) feedback.textContent = document.querySelector('#marketStatus').textContent;
    });
    const copy = node('button', '', 'COPY MINT'); copy.type = 'button'; copy.dataset.inspectorAction = 'copy';
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(pair.baseToken.address); if (notice.isConnected) notice.textContent = 'Mint address copied.'; }
      catch { if (notice.isConnected) notice.textContent = 'Copy is unavailable. Select the mint address above to copy it.'; }
    });
    const full = node('a', '', 'FULL POOL ↗'); full.href = `coin.html?pair=${encodeURIComponent(pair.pairAddress)}`; full.dataset.inspectorAction = 'full';
    actions.append(save, copy, full); body.append(identity, observed, metrics, mint, actions, notice);
    if (focus) inspector.querySelector(`[data-inspector-action="${focus}"]`)?.focus({ preventScroll: true });
  }
  function inspect(pair, button) {
    inspected = pair; opener = { pair, field: button.matches('.field-node') };
    inspectorPair = latest.visiblePairs.find(record => record.pairAddress === pair) || null;
    inspectorCheckedAt = latest.checkedAt;
    inspector.showModal(); renderInspector(); inspector.querySelector('[data-inspector-close]').focus();
  }
  results.addEventListener('click', event => { const button = event.target.closest('[data-pool-inspect]'); if (button) inspect(button.dataset.poolInspect, button); });
  inspector.querySelector('[data-inspector-close]').addEventListener('click', () => inspector.close());
  inspector.addEventListener('click', event => {
    const box = inspector.getBoundingClientRect();
    if (event.target === inspector && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) inspector.close();
  });
  inspector.addEventListener('close', () => {
    const target = opener && document.querySelector(opener.field ? `[data-field-pair="${opener.pair}"]` : `[data-pool-inspect="${opener.pair}"]`);
    (target || document.querySelector('[data-jump-discovery]')).focus({ preventScroll: true });
  });
  remix.addEventListener('click', () => { fieldOffset += 6; renderField(); });
  document.querySelector('[data-jump-discovery]').addEventListener('click', () => { openPanel('discovery'); search.focus({ preventScroll: true }); });
  function widgets(state) {
    latest = state; renderField(); renderInspector();
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
    root.dataset.motionPaused = String(paused || reduced.matches);
    motion.disabled = reduced.matches;
    motion.setAttribute('aria-pressed', String(paused || reduced.matches));
    motion.textContent = reduced.matches ? 'MOTION REDUCED' : paused ? 'MOTION OFF · RESUME' : 'MOTION Ⅱ';
    motion.setAttribute('aria-label', reduced.matches ? 'Motion reduced by your device preference' : paused ? 'Resume decorative motion' : 'Pause decorative motion');
  }
  motion.addEventListener('click', () => { window.NUC_DOTS?.setPaused(!window.NUC_DOTS.isPaused()); motionState(); });
  reduced.addEventListener('change', motionState); motionState();
})();
