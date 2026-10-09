/* A spacious workbench over the native project, coin and terminal controllers. */
(() => {
  const shell = document.querySelector('.desk-shell');
  if (!shell || !document.body.classList.contains('atelier-dashboard')) return;
  const q = id => document.getElementById(id);
  const create = (tag, className, html) => {
    const element = document.createElement(tag);
    element.className = className;
    if (html) element.innerHTML = html;
    return element;
  };
  const rail = shell.querySelector('.desk-rail');
  const canvas = shell.querySelector('.desk-canvas');
  const library = shell.querySelector('.desk-library');
  const manager = q('deskManager');
  const heading = canvas.querySelector('.desk-canvas-heading');
  const stage = create('div', 'atelier-stage');
  const body = create('div', 'atelier-body');
  const context = create('aside', 'atelier-context');
  context.setAttribute('aria-label', 'Library and workspace details');
  const contextTabs = create('div', 'atelier-context-tabs', '<div role="group" aria-label="Context panel"><button type="button" data-atelier-context="library" aria-pressed="true">Library</button><button type="button" data-atelier-context="details" aria-pressed="false">Details</button></div><span class="atelier-context-index" aria-hidden="true">02 / CONTEXT</span>');
  context.append(contextTabs, library, manager);
  stage.append(heading, body);
  body.append(canvas, context);
  shell.append(stage);
  heading.querySelector('.kicker').textContent = 'NUCALORIC / YOUR WORKSPACE';
  heading.querySelector('h1').removeAttribute('aria-label');
  if (!window.NUC_PROJECTS?.active()) heading.querySelector('h1').textContent = 'Your workspace.';
  heading.querySelector('p').textContent = 'A little focus. Room for your next idea.';
  const headActions = create('div', 'atelier-head-actions', '<button type="button" class="atelier-primary" id="atelierNewProject"><span aria-hidden="true">＋</span> New project</button><button type="button" class="atelier-command" id="atelierCommand" aria-label="Find a workspace action"><span aria-hidden="true">⌕</span> Find an action <kbd>Ctrl K</kbd></button>');
  heading.append(headActions);
  headActions.querySelector('kbd').textContent = /Mac/i.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
  q('atelierNewProject').addEventListener('click', () => q('deskQuickNew').click());
  q('atelierCommand').addEventListener('click', () => q('deskCommands').click());

  const metrics = create('section', 'atelier-overview', '<div><span>PROJECTS</span><strong id="atelierProjectCount">0</strong><small>Saved on this device</small></div><div><span>MILESTONES</span><strong id="atelierMilestoneCount">0 <em>/ 0</em></strong><small id="atelierMilestoneNote">Completed / planned</small></div><div class="atelier-account-stat"><span>ACCOUNT</span><strong id="atelierAccountLabel">Local workspace</strong><small id="atelierAccountNote">Sign in for private AI &amp; servers</small></div><div class="atelier-signal" aria-hidden="true"><canvas data-dot-field="arch" data-dot-palette="ice"></canvas><span>A LITTLE POSSIBILITY.</span></div>');
  heading.after(metrics);
  window.NUC_DOTS?.mount(metrics.querySelector('canvas'));
  function updateOverview() {
    const projects = (window.NUC_PROJECTS?.list() || []).filter(project => !project.archived);
    const tasks = projects.flatMap(project => project.tasks);
    q('atelierProjectCount').textContent = String(projects.length).padStart(2, '0');
    const done = tasks.filter(task => task.done).length;
    const total = tasks.length;
    q('atelierMilestoneCount').replaceChildren(document.createTextNode(String(done).padStart(2, '0') + ' '));
    const denominator = document.createElement('em');
    denominator.textContent = '/ ' + String(total).padStart(2, '0');
    q('atelierMilestoneCount').append(denominator);
    const state = window.NUC_BILLING?.state;
    q('atelierAccountLabel').textContent = state?.user ? 'Private account' : 'Local workspace';
    q('atelierAccountNote').textContent = state?.user ? 'Account connected' : state?.connected ? 'Sign in for AI & servers' : 'Project planning available here';
  }
  addEventListener('nucProjectsChange', updateOverview);
  addEventListener('nuc-billing-ready', updateOverview);
  window.NUC_BILLING?.ready.then(updateOverview);
  updateOverview();

  const brand = create('a', 'atelier-rail-brand', '<span class="atelier-brand-tile" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M6 25V7h5l10 18h5V7h-5v13L14 7H6Z" fill="currentColor"/><rect x="25" y="25" width="3" height="3" fill="#ff91bd"/></svg></span><span>Workspace<small>NUCALORIC</small></span>');
  brand.href = 'dashboard.html';
  rail.prepend(brand);
  const railLabel = create('span', 'atelier-rail-label', 'YOUR TOOLS');
  rail.querySelector('.desk-nav').before(railLabel);
  const connections = rail.querySelector('[data-desk-open=connections]');
  const accountNav = create('nav', 'atelier-account-nav');
  accountNav.setAttribute('aria-label', 'Account tools');
  accountNav.append(connections);
  const credits = create('button', '', '<span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 5h16v14H4ZM4 9h16M14 13h6v3h-6Z"/></svg></span><b>Credits</b>');
  credits.type = 'button';
  credits.dataset.deskOpen = 'deskCredits';
  credits.setAttribute('aria-label', 'Credits');
  credits.addEventListener('click', () => window.NUC_DEV_PANELS.open('deskCredits'));
  accountNav.append(credits);
  const accountLabel = create('span', 'atelier-rail-label', 'YOUR ACCOUNT');
  rail.querySelector('.desk-rail-links').before(accountLabel, accountNav);
  rail.querySelector('[data-desk-open=workspace] b').textContent = 'Workbench';
  rail.querySelector('[data-desk-open=workspace]').setAttribute('aria-label', 'Workbench');
  rail.querySelector('[data-desk-open=ai] b').textContent = 'Intelligence';
  rail.querySelector('[data-desk-open=ai]').setAttribute('aria-label', 'Intelligence');
  const identity = rail.querySelector('.desk-identity');
  rail.append(identity);
  q('deskCloseManager').textContent = '←';
  q('deskCloseManager').setAttribute('aria-label', 'Return to workspace library');
  q('deskCloseManager').addEventListener('click', () => showContext('library'));
  q('deskCloseManager').addEventListener('click', () => contextTabs.querySelector('[data-atelier-context=library]').focus({preventScroll:true}));
  q('deskQuickNew').title = 'New project';
  q('deskQuickExport').title = 'Export project backup';
  q('deskQuickKnowledge').title = 'Coin knowledge';
  q('deskQuickConnections').title = 'Connections';

  function showContext(kind) {
    context.inert = false;
    shell.classList.remove('atelier-focus');
    q('atelierFocus').setAttribute('aria-pressed', 'false');
    q('atelierFocus').setAttribute('aria-label', 'Give the workbench more room');
    const details = kind === 'details';
    library.hidden = details;
    manager.hidden = !details;
    context.dataset.view = kind;
    contextTabs.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.atelierContext === kind)));
  }
  contextTabs.querySelectorAll('button').forEach(button => button.addEventListener('click', () => showContext(button.dataset.atelierContext)));
  window.NUC_DESK_VIEW = {library: () => showContext('library'), details: () => showContext('details')};

  const toolbar = canvas.querySelector('.desk-conversation-tools');
  const toolLabel = create('span', 'atelier-work-label', '01 / WORKBENCH');
  toolbar.prepend(toolLabel);
  canvas.querySelector('.desk-tool-tabs [data-desk-focus=ai]').textContent = 'Intelligence';
  const focusButton = create('button', 'atelier-focus-button', '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M8 8l-4-4m12 4 4-4M8 16l-4 4m12-4 4 4"/></svg>');
  focusButton.id = 'atelierFocus';
  focusButton.type = 'button';
  focusButton.setAttribute('aria-pressed', 'false');
  focusButton.setAttribute('aria-label', 'Give the workbench more room');
  toolbar.append(focusButton);
  function setFocus(value) {
    shell.classList.toggle('atelier-focus', value);
    focusButton.setAttribute('aria-pressed', String(value));
    focusButton.setAttribute('aria-label', value ? 'Restore library and details' : 'Give the workbench more room');
    if (value && context.contains(document.activeElement)) focusButton.focus();
    context.inert = value;
  }
  focusButton.addEventListener('click', () => setFocus(!shell.classList.contains('atelier-focus')));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && shell.classList.contains('atelier-focus') && !document.querySelector('dialog[open]')) setFocus(false);
  });

  const gate = q('aiGate');
  gate.prepend(create('span', 'atelier-gate-label', 'PRIVATE INTELLIGENCE'));
  gate.querySelector('h2').textContent = 'Think a little further.';
  const gateFoot = create('div', 'atelier-gate-foot', '<span><i aria-hidden="true">◇</i> Private context</span><span><i aria-hidden="true">✳</i> Local models</span><span><i aria-hidden="true">▤</i> Saved knowledge</span>');
  const gateStamp = create('div', 'atelier-gate-stamp', '<span class="atelier-stamp-grid" aria-hidden="true"></span><span class="brand-mark" aria-hidden="true"></span><small>YOUR IDEAS / YOUR TOOLS</small>');
  gate.append(gateFoot, gateStamp);
  const gateLink = create('button', 'atelier-gate-local', 'Start with a local project ↗');
  gateLink.type = 'button';
  gateLink.addEventListener('click', () => q('deskQuickNew').click());
  q('aiSignIn').after(gateLink);
  const syncGate = () => { q('aiEngine').hidden = !gate.hidden; };
  new MutationObserver(syncGate).observe(gate, {attributes:true,attributeFilter:['hidden']});
  syncGate();
  const statusLine = create('footer', 'atelier-status-line', '<span>YOUR WORK / AT YOUR PACE <button type="button" id="atelierMotion" aria-pressed="false">Pause motion</button></span><span>Projects are saved on this device. <button type="button" id="atelierBackup">Keep a backup ↗</button></span>');
  stage.append(statusLine);
  q('atelierBackup').addEventListener('click', () => q('deskExport').click());
  q('atelierMotion').addEventListener('click', () => q('deskMotion').click());
  const syncMotion = () => {
    const original = q('deskMotion');
    q('atelierMotion').disabled = original.disabled;
    q('atelierMotion').setAttribute('aria-pressed', original.getAttribute('aria-pressed'));
    q('atelierMotion').textContent = original.disabled ? 'Motion reduced' : original.getAttribute('aria-pressed') === 'true' ? 'Resume motion' : 'Pause motion';
  };
  new MutationObserver(syncMotion).observe(q('deskMotion'), {attributes:true,attributeFilter:['aria-pressed','disabled']});
  syncMotion();
  function syncBackup() {
    const available = (window.NUC_PROJECTS?.list() || []).length > 0;
    q('atelierBackup').disabled = !available;
    q('deskQuickExport').disabled = !available;
  }
  addEventListener('nucProjectsChange', syncBackup);
  syncBackup();
  showContext('library');
})();
