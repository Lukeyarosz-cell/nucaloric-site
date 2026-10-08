(() => {
  const form = document.querySelector('#hostingForm');
  if (!form) {
    const name = document.getElementById('dashboardWorkspaceName');
    if (name) {
      try {
        const saved = JSON.parse(localStorage.getItem('nucHostingPlan') || 'null');
        if (saved?.version === 1 && typeof saved.project === 'string' && saved.project.trim()) {
          name.textContent = saved.project;
          document.getElementById('dashboardWorkspaceNote').textContent = saved.source==='own'?'Saved own-hardware plan · Machine not paired. Open Hosting to review the setup.':'Saved workspace plan · Server not purchased. Open Hosting to review the plan and available checkout.';
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
    return { version: 1, project: el('hostProject').value.trim(), tokenMint: el('hostMint').value.trim(), workload: form.elements.workload.value, repository: el('hostRepository').value.trim(), compute: el('hostCompute').value, source:form.elements.source.value, hardware:el('hostHardware').value, access:el('hostAccess').value, endpoint:form.elements.source.value==='own'?el('hostEndpoint').value.trim():(()=>{const u=httpsUrl(el('hostEndpoint').value.trim());return u&&!u.search&&!u.hash?u.href:''})(), enrolled:false };
  }
  function httpsUrl(value) {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url : null; } catch { return null; }
  }
  function checkoutFor(p) {
    if(p.source==='own')return null;
    const portal = httpsUrl(config.paymenterUrl);
    const product = config.products?.[p.compute];
    const url = httpsUrl(product?.checkoutUrl);
    return portal && url && portal.origin === url.origin && product?.reviewedFor?.includes(p.workload) && product?.priceLabel ? {url, product} : null;
  }
  function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0,48) || 'my-project'; }
  function shellQuote(value) { return "'" + value.replace(/'/g, "'\\''") + "'"; }
  function script(p) {
    const lines = ['#!/usr/bin/env bash', 'set -euo pipefail', p.source==='own'?'# Run locally on your own Linux machine. This does not enroll a device.':'# Run after connecting to your own provisioned Linux workspace.', '# Requires bash and git. Install your project dependencies separately.', 'mkdir -p "$HOME/projects"', 'cd "$HOME/projects"'];
    if(p.source==='own')lines.push('# Planned hardware: '+(p.hardware==='pi'?'Raspberry Pi / ARM64':'Linux PC / x86_64'),'uname -m','# Confirm architecture and resources before installing dependencies.');
    if (p.repository && httpsUrl(p.repository)) lines.push(`git clone -- ${shellQuote(p.repository)} ${shellQuote(slug(p.project))}`, `cd -- ${shellQuote(slug(p.project))}`);
    else lines.push(`mkdir -p -- ${shellQuote(slug(p.project))}`, `cd -- ${shellQuote(slug(p.project))}`);
    if (p.tokenMint) lines.push(`export SOLANA_PROJECT_MINT=${shellQuote(p.tokenMint)}`);
    lines.push('# Development configuration only; choose your network before deploying.', 'export SOLANA_CLUSTER=devnet');
    if (p.workload === 'web') lines.push('# Follow your repository README to install, build, and serve your app.', '# Configure HTTPS and a process manager before exposing a public service.');
    if (p.workload === 'dev') lines.push('# Install the runtimes and Solana tools your project requires.', '# Run scripts from this project directory.');
    if (p.workload === 'model') lines.push('# Verify available RAM/VRAM before selecting a model.', p.source==='own'?'# Check your actual hardware before installing a GPU runtime.':p.compute === 'gpu' ? '# Check the provider-installed GPU driver: nvidia-smi (for NVIDIA GPUs).' : '# CPU inference is possible for suitable models; expect lower throughput.', '# Install your chosen inference runtime using its official instructions.', '# Keep inference endpoints authenticated when connecting your application.');
    lines.push('pwd');
    return lines.join('\n') + '\n';
  }
  function update() {
    const p = plan();
    el('hostSummaryName').textContent = p.project || 'Your next project.';
    el('hostSummaryWorkload').textContent = workloads[p.workload];
    el('hostSummaryCompute').textContent = p.source==='own'?(p.hardware==='pi'?'Raspberry Pi / ARM64':'Linux PC / x86_64'):p.compute === 'gpu' ? 'GPU workspace' : 'CPU workspace';
    el('ownHardwareFields').hidden=p.source!=='own';el('hostCompute').disabled=p.source==='own';el('hostEndpoint').disabled=p.source!=='own';
    el('hostBilling').innerHTML=p.source==='own'?'Your own hardware':(window.NUC_BRANDS?.logo('paymenter')||'')+'Paymenter';
    const guides={cloudflare:'https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/',tailscale:'https://tailscale.com/docs/how-to/quickstart',private:'https://www.raspberrypi.com/documentation/computers/remote-access.html'};el('hostAccessDocs').href=guides[p.access];
    el('hostAccessNote').textContent=p.source==='own'?'Future pairing will require machine ownership, an authenticated bridge and a healthy device heartbeat.':'Server access becomes available after payment and successful provisioning.';
    el('hostComputeNote').textContent = p.workload === 'model' ? 'Choose compute after checking your model’s memory requirements. A GPU profile does not guarantee a particular GPU or model capacity.' : 'CPU compute suits many websites, scripts, and APIs. Final specifications come from the hosting catalog.';
    el('hostCommands').textContent = script(p);
    if(p.source==='own')el('hostComputeNote').textContent='Your hardware determines CPU, RAM and GPU capacity. Check ARM compatibility for Raspberry Pi workloads.';
    const checkout = checkoutFor(p);
    const link = el('hostCheckout');
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
    link.textContent = p.source==='own'?'MACHINE PAIRING / COMING LATER':'CHECKOUT NOT CONNECTED';
    el('hostPrice').textContent = p.source==='own'?'Hardware and network costs are yours':'Catalog not connected';
    el('hostCheckoutNote').textContent = p.source==='own'?'Plan and export your setup now. Your machine has not been paired; remote control and deployment are not enabled.':'Checkout will be available once a hosting product is configured. Saving a plan does not purchase a server.';
    if (checkout) {
      link.href = checkout.url.href;
      link.setAttribute('aria-disabled', 'false');
      link.textContent = 'CONTINUE TO PAYMENTER ↗';
      el('hostPrice').textContent = checkout.product.priceLabel;
      el('hostCheckoutNote').textContent = 'Review specifications, availability, and the final price in Paymenter before paying. Your plan stays in this browser.';
    }
    const billing = window.NUC_BILLING?.state;
    if(billing?.externalUrl){
      const destination=new URL(billing.externalUrl);
      for(const key of ['project','source','workload','compute','hardware'])destination.searchParams.set(key,p[key]);
      link.href=destination.href;link.setAttribute('aria-disabled','false');link.textContent='OPEN PI BILLING ↗';
      el('hostCheckoutNote').textContent='Billing and server allocation run on the Raspberry Pi. Continue there with this project plan.';
    }
    if(billing?.connected&&p.source==='paymenter'&&p.workload==='web'&&p.compute==='cpu'&&billing.provisioner?.connected){link.href='billing.html#billingCreate';link.setAttribute('aria-disabled','false');link.textContent='CHOOSE MONTHLY SERVER ↗';el('hostPrice').textContent='$1.50 Basic / $2 Full per month';el('hostCheckoutNote').textContent='Prepaid monthly Pi / Distiller slot. Connect a wallet and approve crypto payment in Billing. Higher AI costs $0.50 per 1,000 processed tokens.';el('hostAccessNote').textContent='CLI, shell scripting and website hosting. Full adds GitHub deployment and workspace tools. Shared small models are free; higher-model usage is separate.';}
    const free = billing?.catalog?.[p.source === 'own' ? 'basic' : p.workload === 'model' ? 'ai' : 'server'];
    if (billing?.connected && free?.planType === 'free') {
      link.href = 'billing.html'; link.setAttribute('aria-disabled', 'false');
      link.textContent = 'ENROLL FREE WORKSPACE ↗';
      el('hostPrice').textContent = 'Free enrollment';
      el('hostCheckoutNote').textContent = 'Create a free billing record in your account. No payment is due. Hardware and deployment are configured separately.';
      el('hostAccessNote').textContent = p.source === 'own' ? 'Enrollment is available. Machine pairing and remote access await your hardware.' : 'Enrollment is available. Server provisioning and remote access await the hosting backend.';
      if(billing.provisioner?.connected&&p.source==='paymenter'&&p.workload==='web'&&p.compute==='cpu'){
        link.textContent='CREATE FREE WEBSITE SERVER ↗';
        el('hostCheckoutNote').textContent='Allocate a small static website on the Pi: 32 MB RAM and 0.25 CPU, subject to the five-slot limit. No payment is due.';
        el('hostAccessNote').textContent='Manage start/stop and publish an HTML page from Billing. Use the Account command line for container shell commands. This template serves static websites.';
      }
    }
  }
  function valid() {
    el('hostProject').setCustomValidity(el('hostProject').value.trim() ? '' : 'Enter a project name.');
    const p = plan();
    el('hostMint').setCustomValidity(!p.tokenMint || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(p.tokenMint) ? '' : 'Enter a Solana mint address using 32–44 base58 characters.');
    el('hostRepository').setCustomValidity(!p.repository || httpsUrl(p.repository) ? '' : 'Use a public HTTPS repository URL without embedded credentials.');
    const endpoint=httpsUrl(p.endpoint);el('hostEndpoint').setCustomValidity(p.source!=='own'||!p.endpoint||endpoint&&!endpoint.search&&!endpoint.hash?'':'Use an HTTPS app address without credentials, query parameters or fragments.');
    return form.reportValidity();
  }
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  form.addEventListener('input', () => { for (const id of ['hostProject','hostMint','hostRepository','hostEndpoint']) el(id).setCustomValidity(''); update(); });
  form.addEventListener('change', update);
  form.addEventListener('submit', e => {
    e.preventDefault(); if (!valid()) return;
    try { localStorage.setItem(key, JSON.stringify(plan())); feedback(plan().source==='own'?'Own-hardware plan saved in this browser. Your machine has not been paired.':'Workspace plan saved in this browser. No server has been purchased.'); }
    catch { feedback('Browser storage is unavailable. Export your plan to keep a copy.'); }
  });
  el('hostCheckout').addEventListener('click', e => {
    const p=plan(), billing=window.NUC_BILLING?.state;
    if(billing?.externalUrl){if(!valid())e.preventDefault();return;}
    const free=billing?.catalog?.[p.source==='own'?'basic':p.workload==='model'?'ai':'server'];
    if(billing?.connected && (free?.planType==='free'||p.source==='paymenter'&&p.workload==='web'&&p.compute==='cpu'&&billing.provisioner?.connected)) {
      if(!valid()){e.preventDefault();return;}
      try{localStorage.setItem(key,JSON.stringify(p));}catch{e.preventDefault();feedback('Browser storage is unavailable. Enter your project details in Billing.');location.href='billing.html';}
    } else if (!checkoutFor(p) || !valid()) e.preventDefault();
  });
  window.addEventListener('nuc-billing-ready',update);
  el('hostExport').addEventListener('click', () => { if (!valid()) return; download(`${slug(plan().project)}-workspace.json`, JSON.stringify(plan(), null, 2), 'application/json'); feedback('Workspace plan exported.'); });
  el('hostScriptDownload').addEventListener('click', () => { if (!valid()) return; download(`${slug(plan().project)}-setup.sh`, script(plan()), 'text/x-shellscript'); feedback(plan().source==='own'?'Setup script downloaded. Run it locally on your own Linux machine.':'Setup script downloaded. Run it in your provisioned workspace.'); });
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved?.version === 1 && typeof saved.project === 'string' && saved.project.length <= 60 && workloads[saved.workload] && ['cpu','gpu'].includes(saved.compute)) {
      el('hostProject').value = saved.project;
      el('hostMint').value = typeof saved.tokenMint === 'string' ? saved.tokenMint.slice(0,44) : '';
      el('hostRepository').value = typeof saved.repository === 'string' ? saved.repository.slice(0,2048) : '';
      form.elements.workload.value = saved.workload;
      el('hostCompute').value = saved.compute;
      form.elements.source.value=saved.source==='own'?'own':'paymenter';el('hostHardware').value=saved.hardware==='pi'?'pi':'pc';el('hostAccess').value=['cloudflare','tailscale','private'].includes(saved.access)?saved.access:'cloudflare';el('hostEndpoint').value=typeof saved.endpoint==='string'?saved.endpoint.slice(0,2048):'';
      feedback('Saved workspace plan restored.');
    }
  } catch { /* Ignore invalid or inaccessible local drafts. */ }
  const requested = new URLSearchParams(location.search);
  const requestedWorkload = requested.get('workload');
  if (Object.hasOwn(workloads, requestedWorkload)) form.elements.workload.value = requestedWorkload;
  if (['own', 'paymenter'].includes(requested.get('source'))) form.elements.source.value = requested.get('source');
  if (['pi', 'pc'].includes(requested.get('hardware'))) el('hostHardware').value = requested.get('hardware');
  if (['cpu', 'gpu'].includes(requested.get('compute'))) el('hostCompute').value = requested.get('compute');
  update();
})();
