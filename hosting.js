(() => {
  const form = document.querySelector('#hostingForm');
  if (!form) {
    const name = document.getElementById('dashboardWorkspaceName');
    if (name) {
      try {
        const saved = JSON.parse(localStorage.getItem('nucHostingPlan') || 'null');
        if (saved?.version === 1 && typeof saved.project === 'string' && saved.project.trim()) {
          name.textContent = saved.project;
          document.getElementById('dashboardWorkspaceNote').textContent = 'Saved workspace plan · Server not purchased. Open Hosting to review the plan and available checkout.';
        }
      } catch { /* Keep the empty workspace state. */ }
    }
    return;
  }
  const el = id => document.getElementById(id);
  const key = 'nucHostingPlan';
  const workloads = {web: 'Website or app', dev: 'Developer tools', model: 'Self-hosted model'};
  const config = window.NUC_HOSTING_CONFIG || {};
  const feedback = message => { el('hostFeedback').textContent = message; };
  function plan() {
    return { version: 1, project: el('hostProject').value.trim(), tokenMint: el('hostMint').value.trim(), workload: form.elements.workload.value, repository: el('hostRepository').value.trim(), compute: el('hostCompute').value };
  }
  function httpsUrl(value) {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url : null; } catch { return null; }
  }
  function checkoutFor(p) {
    const portal = httpsUrl(config.paymenterUrl);
    const product = config.products?.[p.compute];
    const url = httpsUrl(product?.checkoutUrl);
    return portal && url && portal.origin === url.origin && product?.reviewedFor?.includes(p.workload) && product?.priceLabel ? {url, product} : null;
  }
  function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0,48) || 'my-project'; }
  function shellQuote(value) { return "'" + value.replace(/'/g, "'\\''") + "'"; }
  function script(p) {
    const lines = ['#!/usr/bin/env bash', 'set -euo pipefail', '# Run after connecting to your own provisioned Linux workspace.', '# Requires bash and git. Install your project dependencies separately.', 'mkdir -p "$HOME/projects"', 'cd "$HOME/projects"'];
    if (p.repository && httpsUrl(p.repository)) lines.push(`git clone -- ${shellQuote(p.repository)} ${shellQuote(slug(p.project))}`, `cd -- ${shellQuote(slug(p.project))}`);
    else lines.push(`mkdir -p -- ${shellQuote(slug(p.project))}`, `cd -- ${shellQuote(slug(p.project))}`);
    if (p.tokenMint) lines.push(`export SOLANA_PROJECT_MINT=${shellQuote(p.tokenMint)}`);
    lines.push('# Development configuration only; choose your network before deploying.', 'export SOLANA_CLUSTER=devnet');
    if (p.workload === 'web') lines.push('# Follow your repository README to install, build, and serve your app.', '# Configure HTTPS and a process manager before exposing a public service.');
    if (p.workload === 'dev') lines.push('# Install the runtimes and Solana tools your project requires.', '# Run scripts from this project directory.');
    if (p.workload === 'model') lines.push('# Verify available RAM/VRAM before selecting a model.', p.compute === 'gpu' ? '# Check the provider-installed GPU driver: nvidia-smi (for NVIDIA GPUs).' : '# CPU inference is possible for suitable models; expect lower throughput.', '# Install your chosen inference runtime using its official instructions.', '# Keep inference endpoints authenticated when connecting your application.');
    lines.push('pwd');
    return lines.join('\n') + '\n';
  }
  function update() {
    const p = plan();
    el('hostSummaryName').textContent = p.project || 'Your next project.';
    el('hostSummaryWorkload').textContent = workloads[p.workload];
    el('hostSummaryCompute').textContent = p.compute === 'gpu' ? 'GPU workspace' : 'CPU workspace';
    el('hostComputeNote').textContent = p.workload === 'model' ? 'Choose compute after checking your model’s memory requirements. A GPU profile does not guarantee a particular GPU or model capacity.' : 'CPU compute suits many websites, scripts, and APIs. Final specifications come from the hosting catalog.';
    el('hostCommands').textContent = script(p);
    const checkout = checkoutFor(p);
    const link = el('hostCheckout');
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
    link.textContent = 'CHECKOUT NOT CONNECTED';
    el('hostPrice').textContent = 'Catalog not connected';
    el('hostCheckoutNote').textContent = 'Checkout will be available once a hosting product is configured. Saving a plan does not purchase a server.';
    if (checkout) {
      link.href = checkout.url.href;
      link.setAttribute('aria-disabled', 'false');
      link.textContent = 'CONTINUE TO PAYMENTER ↗';
      el('hostPrice').textContent = checkout.product.priceLabel;
      el('hostCheckoutNote').textContent = 'Review specifications, availability, and the final price in Paymenter before paying. Your plan stays in this browser.';
    }
  }
  function valid() {
    el('hostProject').setCustomValidity(el('hostProject').value.trim() ? '' : 'Enter a project name.');
    const p = plan();
    el('hostMint').setCustomValidity(!p.tokenMint || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(p.tokenMint) ? '' : 'Enter a Solana mint address using 32–44 base58 characters.');
    el('hostRepository').setCustomValidity(!p.repository || httpsUrl(p.repository) ? '' : 'Use a public HTTPS repository URL without embedded credentials.');
    return form.reportValidity();
  }
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  form.addEventListener('input', () => { for (const id of ['hostProject','hostMint','hostRepository']) el(id).setCustomValidity(''); update(); });
  form.addEventListener('change', update);
  form.addEventListener('submit', e => {
    e.preventDefault(); if (!valid()) return;
    try { localStorage.setItem(key, JSON.stringify(plan())); feedback('Workspace plan saved in this browser. No server has been purchased.'); }
    catch { feedback('Browser storage is unavailable. Export your plan to keep a copy.'); }
  });
  el('hostCheckout').addEventListener('click', e => { if (!checkoutFor(plan()) || !valid()) e.preventDefault(); });
  el('hostExport').addEventListener('click', () => { if (!valid()) return; download(`${slug(plan().project)}-workspace.json`, JSON.stringify(plan(), null, 2), 'application/json'); feedback('Workspace plan exported.'); });
  el('hostScriptDownload').addEventListener('click', () => { if (!valid()) return; download(`${slug(plan().project)}-setup.sh`, script(plan()), 'text/x-shellscript'); feedback('Setup script downloaded. Run it in your provisioned workspace.'); });
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved?.version === 1 && typeof saved.project === 'string' && saved.project.length <= 60 && workloads[saved.workload] && ['cpu','gpu'].includes(saved.compute)) {
      el('hostProject').value = saved.project;
      el('hostMint').value = typeof saved.tokenMint === 'string' ? saved.tokenMint.slice(0,44) : '';
      el('hostRepository').value = typeof saved.repository === 'string' ? saved.repository.slice(0,2048) : '';
      form.elements.workload.value = saved.workload;
      el('hostCompute').value = saved.compute;
      feedback('Saved workspace plan restored.');
    }
  } catch { /* Ignore invalid or inaccessible local drafts. */ }
  const requestedWorkload = new URLSearchParams(location.search).get('workload');
  if (Object.hasOwn(workloads, requestedWorkload)) form.elements.workload.value = requestedWorkload;
  update();
})();
