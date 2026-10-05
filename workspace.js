/* Project choices, truthful workspace summaries, and Paymenter access gates. */
(() => {
  const choices = [...document.querySelectorAll('[data-home-workload]')];
  const labels = { web: 'Start with a website workspace plan.', dev: 'Start with a workspace for tools, scripts, and APIs.', model: 'Start with a compute plan for your model.' };
  choices.forEach(button => button.addEventListener('click', () => {
    choices.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('[data-starter-note]').textContent = labels[button.dataset.homeWorkload];
    document.querySelector('[data-starter-link]').href = `hosting.html?workload=${button.dataset.homeWorkload}#workspaceBuilder`;
  }));

  const status = document.querySelector('#workspacePlanStatus');
  if (status) {
    try {
      const plan = JSON.parse(localStorage.getItem('nucHostingPlan') || 'null');
      const workloads = { web: 'Website or app', dev: 'Tools, scripts & APIs', model: 'Self-hosted model' };
      if (plan?.version === 1 && typeof plan.project === 'string' && plan.project.trim() && workloads[plan.workload] && ['cpu', 'gpu'].includes(plan.compute)) {
        status.textContent = 'Saved';
        document.querySelector('#workspacePlanBadge').textContent = 'SAVED PLAN';
        document.querySelector('#dashboardWorkload').textContent = workloads[plan.workload];
        document.querySelector('#dashboardCompute').textContent = plan.compute === 'gpu' ? 'GPU workspace plan' : 'CPU workspace plan';
      }
    } catch { /* The default state remains usable. */ }
  }
  // A public portal URL changes the handoff only. It never grants shell access.
  const portal = window.NUC_HOSTING_CONFIG?.paymenterUrl;
  try {
    const url = new URL(portal);
    if (url.protocol === 'https:' && !url.username && !url.password) {
      document.querySelectorAll('[data-paymenter-portal]').forEach(link => {
        link.href = url.href; link.textContent = 'OPEN PAYMENTER ↗';
      });
    }
  } catch { /* Unconfigured links lead to the workspace setup flow. */ }

  const claim = document.querySelector('#claimReward');
  if (claim) {
    let progress = { version: 1, xp: 6240, claimedOn: '' };
    const today = () => { const date = new Date(); return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; };
    try {
      const saved = JSON.parse(localStorage.getItem('nucRewardsProgress') || 'null');
      if (saved?.version === 1 && Number.isInteger(saved.xp) && saved.xp >= 0 && saved.xp <= 10000 && typeof saved.claimedOn === 'string') progress = saved;
    } catch { /* Start from the example profile. */ }
    function renderProgress() {
      document.querySelector('#rewardXP').textContent = progress.xp.toLocaleString();
      document.querySelector('#rewardNextXP').textContent = `${(10000 - progress.xp).toLocaleString()} XP TO GO`;
      document.querySelector('#xpFill').style.width = `${progress.xp / 100}%`;
      document.querySelector('#rewardProgressRing').style.strokeDashoffset = String(408.41 * (1 - progress.xp / 10000));
      claim.disabled = progress.claimedOn === today();
      claim.textContent = claim.disabled ? 'EXAMPLE CHECK-IN COMPLETE ✓' : 'TRY DAILY CHECK-IN +120 XP';
    }
    claim.addEventListener('click', () => {
      if (progress.claimedOn === today()) return;
      progress.xp = Math.min(10000, progress.xp + 120); progress.claimedOn = today();
      try { localStorage.setItem('nucRewardsProgress', JSON.stringify(progress)); } catch { /* Keep the in-memory example. */ }
      renderProgress(); if (typeof showToast === 'function') showToast('Example progress updated: +120 XP');
    });
    renderProgress();
  }
})();
