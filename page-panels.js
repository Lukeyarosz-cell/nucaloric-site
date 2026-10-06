/* Useful panel choices and progress derived from real local plans. */
(() => {
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const text = (selector, value) => document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
  const hosting = document.querySelector('#hostingForm');
  if (hosting) {
    const choices = [...document.querySelectorAll('[data-host-choice]')];
    const sync = () => choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.hostChoice === hosting.elements.workload.value)));
    choices.forEach(button => button.addEventListener('click', () => {
      hosting.elements.workload.value = button.dataset.hostChoice;
      hosting.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
      document.querySelector('#workspaceBuilder').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      document.querySelector('#hostProject').focus({ preventScroll: true });
    }));
    hosting.addEventListener('change', sync);
    sync();
  }
  const brief = document.querySelector('#projectBriefForm');
  if (brief) {
    const sync = () => {
      const fields = brief.elements;
      text('[data-studio-identity], #briefPreviewName', fields.name.value.trim() || 'Untitled project');
      text('[data-studio-purpose], #briefPreviewPurpose', fields.purpose.value.trim() || 'Add a short project description.');
      text('[data-studio-milestone]', fields.milestone.value.trim() || 'Set your first milestone.');
    };
    brief.addEventListener('input', sync);
    brief.addEventListener('change', sync);
    document.querySelectorAll('[data-studio-kit]').forEach(button => button.addEventListener('click', () => queueMicrotask(sync)));
    sync();
  }
  const coin = document.querySelector('#coinWorkbench');
  if (coin) {
    const sync = () => {
      const name = coin.elements.name.value.trim();
      const ticker = coin.elements.ticker.value.trim().toUpperCase();
      text('[data-coin-name]', name || 'Untitled coin');
      text('[data-coin-ticker]', ticker ? '$' + ticker : '$TICKER');
      document.querySelectorAll('[data-coin-avatar]').forEach(el => { el.dataset.initial = (ticker || name || '?').slice(0, 1).toUpperCase(); });
    };
    coin.addEventListener('input', sync);
    coin.addEventListener('change', sync);
    sync();
  }
  const progress = document.querySelector('[data-saved-progress]');
  if (progress) {
    const sync = () => {
      const library = read('nucProjectLibrary'), legacy = read('nucProjectBrief');
      const validBrief = draft => draft?.version === 1 && typeof draft.fields?.name === 'string' && draft.fields.name.trim() && typeof draft.fields.purpose === 'string' && draft.fields.purpose.trim();
      const project = library?.version === 1 && Array.isArray(library.projects)
        ? library.projects.some(item => item && item.archived === false && validBrief(item.draft))
        : validBrief(legacy);
      const hosting = read('nucHostingPlan'), coin = read('nucCoinWorkbench');
      const states = {
        project: Boolean(project),
        hosting: hosting?.version === 1 && typeof hosting.project === 'string' && Boolean(hosting.project.trim()) && ['web', 'dev', 'model'].includes(hosting.workload) && ['cpu', 'gpu'].includes(hosting.compute),
        launch: coin?.version === 1 && coin.format === 'nucaloric-coin-plan' && typeof coin.fields?.name === 'string' && Boolean(coin.fields.name.trim()) && typeof coin.fields.ticker === 'string' && /^[a-z0-9]{1,10}$/i.test(coin.fields.ticker)
      };
      const count = Object.values(states).filter(Boolean).length;
      text('[data-saved-count]', `${count} / 3 saved`);
      document.querySelectorAll('[data-saved-step]').forEach(row => {
        const done = states[row.dataset.savedStep];
        row.classList.toggle('is-done', Boolean(done));
        row.querySelector('.saved-step').textContent = done ? 'Saved ✓' : 'Start ↗';
      });
      document.querySelectorAll('[data-progress-piece]').forEach(piece => piece.classList.toggle('is-done', Boolean(states[piece.dataset.progressPiece])));
    };
    addEventListener('storage', sync);
    addEventListener('pageshow', sync);
    addEventListener('nucProjectsChange', sync);
    addEventListener('nucWorkbenchChange', sync);
    sync();
  }
})();
