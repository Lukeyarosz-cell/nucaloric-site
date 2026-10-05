/* Public observations only. Credentials and health probes stay on the server. */
(() => {
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels = {operational:'Operational',degraded:'Degraded',outage:'Outage reported',maintenance:'Maintenance',unknown:'Unknown',not_connected:'Not connected'};
  const issues = state => ['degraded','outage','maintenance'].includes(state);
  const badge = state => `<span class="signal-badge" data-state="${esc(state)}">${esc(labels[state] || 'Unknown')}</span>`;
  const reasons = {provider_report:'Selected provider components checked.',no_verified_feed:'No verified public status feed configured.',feed_unavailable:'Provider feed could not be read; availability is unknown.',not_configured:'Integration has not been connected.',healthy:'Our connector reports a successful health check.',authentication:'Our connection has an authentication issue.',quota:'Our connection has reached a provider quota.',timeout:'Our connection timed out; cause is unconfirmed.',backend_error:'Our backend reports a connector failure.',provider_error:'Our backend reports an upstream error; check the provider report.',maintenance:'Our connector is under maintenance.',unknown:'No conclusive connector evidence.',internal_feed_unavailable:'Our connector health feed could not be read.',invalid_health_report:'Connector health report is invalid.',stale_health_report:'Connector evidence is stale; current health is unknown.'};
  const date = value => { const d=new Date(value);return value && Number.isFinite(d.getTime()) ? d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}) : 'Not observed'; };
  async function read(url) { const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(14_000)});if(!r.ok)throw new Error('unavailable');return r.json(); }
  let catalog, observation, mode='unavailable', refreshing=false;
  function effective(data) {
    const stale=!Number.isFinite(Date.parse(data.generatedAt)) || Date.now()-Date.parse(data.generatedAt)>(data.staleAfterSeconds || 180)*1000;
    return {...data,services:data.services.map(s=>({...s,provider:{...s.provider,status:stale?'unknown':s.provider.status},connector:{...s.connector,status:stale && s.connector.status!=='not_connected'?'unknown':s.connector.status}})),ownServices:data.ownServices.map(s=>({...s,status:s.status==='not_connected'?'not_connected':stale || mode!=='live'?'unknown':s.status})),stale};
  }
  function renderStatus() {
    if(!catalog || !observation)return;
    const view=effective(observation), counts={provider:view.services.filter(s=>issues(s.provider.status)).length,ours:view.services.filter(s=>issues(s.connector.status)).length,pending:view.services.filter(s=>s.connector.status==='not_connected').length,unknown:view.services.filter(s=>s.provider.status==='unknown').length};
    $('#statusFreshness').textContent=`${mode==='live'?'Live monitor':'Saved observation'} · checked ${date(view.generatedAt)} · ${view.environment}`;
    $('.ops-own .ops-section-title>span').textContent=view.environment.toUpperCase();
    $('#statusNotice').textContent=mode==='live' ? `${view.coverage.monitored} of ${view.coverage.total} services have readable provider feeds. Other provider states remain unknown. ${view.stale?'These observations are stale; current availability is unknown.':''}` : mode==='snapshot' ? `The live status API is unreachable from this browser. Showing a dated snapshot${view.stale?' with stale states marked unknown':''}. This does not establish a site-wide outage.` : 'The live API and saved observations are unavailable. Current service health is unknown.';
    $('#statusSummary').innerHTML=[[counts.provider,'Provider incidents'],[counts.ours,'Our connection issues'],[counts.pending,'Not connected'],[counts.unknown,'Provider status unknown']].map(([n,label],i)=>`<div class="ops-stat" data-alert="${i<2 && n>0}"><strong>${n}</strong><span>${label}</span></div>`).join('');
    const own=view.ownServices.map(s=>`<div class="own-health-row"><div><strong>${esc(s.name)}</strong><p>${esc(s.reason)}</p></div>${badge(s.status)}</div>`).join('');
    $('#ownHealth').innerHTML=(mode!=='live'?`<div class="own-health-row"><div><strong>Live status API</strong><p>Unreachable from this browser. Check deployment and network access; cause is unconfirmed.</p></div>${badge('unknown')}</div>`:'')+own;
    const query=$('#serviceSearch').value.trim().toLowerCase(),filter=$('#statusFilter').value;
    const rows=view.services.filter(s=>(!query || `${s.name} ${s.category}`.toLowerCase().includes(query)) && (filter==='all' || filter==='issues' && issues(s.provider.status) || filter==='ours' && issues(s.connector.status) || filter==='pending' && s.connector.status==='not_connected' || filter==='unknown' && s.provider.status==='unknown'));
    $('#serviceResultCount').textContent=`${rows.length} of ${view.services.length} services shown. Provider health and our integration readiness are separate.`;
    const markup=rows.map(s=>{
      const record=catalog.services.find(c=>c.id===s.id);if(!record)return '';
      const p=s.provider,c=s.connector,incidents=(p.incidents || []).filter(i=>i.scope!=='other');
      const details=p.components?.length ? `<details><summary>Component evidence (${p.components.length})</summary><ul>${p.components.map(x=>`<li>${esc(x.name)} · ${esc(view.stale?'Unknown — stale evidence':labels[x.status] || 'Unknown')}</li>`).join('')}</ul><p>Provider summary: ${esc(p.providerSummary)}. This may cover products outside our selected scope.</p></details>` : '';
      return `<article class="service-row" data-service="${esc(s.id)}"><div class="service-identity"><h3>${esc(s.name)}</h3><small>${esc(s.category)}</small><a href="roadmap.html#phase-${record.phase}" data-transition>IMPLEMENTATION STAGE ↗</a></div><div class="service-signal"><span>PROVIDER REPORT</span>${badge(p.status)}<p>${esc(view.stale?'Evidence expired; refresh for current availability.':reasons[p.reason] || 'Status unavailable.')}</p>${p.source?`<a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">OFFICIAL STATUS ↗</a>`:`<a href="${esc(record.docs)}" target="_blank" rel="noopener noreferrer">OFFICIAL DOCS ↗</a>`}${details}${incidents.map(i=>`<p>${i.scope==='unconfirmed'?'Provider incident / scope unconfirmed: ':''}${esc(i.name)}</p>`).join('')}</div><div class="service-signal"><span>NUCALORIC CONNECTION</span>${badge(c.status)}<p>${esc(reasons[c.reason] || 'Current connector evidence unavailable.')}</p>${c.checkedAt?`<p>Observed ${esc(date(c.checkedAt))}</p>`:''}<a href="roadmap.html#phase-${record.phase}" data-transition>WHAT IS REQUIRED ↗</a></div></article>`;
    }).join('') || '<p class="ops-empty">No services match this view.</p>';
    const root=$('#serviceRows');
    // A minute's refresh should not collapse the provider evidence someone is reading.
    if(root.dataset.renderedMarkup!==markup){const open=new Set([...root.querySelectorAll('details[open]')].map(el=>el.closest('[data-service]').dataset.service));root.innerHTML=markup;root.dataset.renderedMarkup=markup;root.querySelectorAll('details').forEach(el=>{if(open.has(el.closest('[data-service]').dataset.service))el.open=true;});}
  }
  function validStatus(data) { return data?.schemaVersion===1 && Array.isArray(data.services) && Array.isArray(data.ownServices) && data.coverage && data.services.every(s=>s.provider && s.connector && labels[s.provider.status] && labels[s.connector.status]); }
  async function refresh() {
    if(refreshing)return;refreshing=true;const button=$('#refreshStatus');button.disabled=true;button.textContent='CHECKING…';
    try {const data=await read('api/service-status');if(!validStatus(data))throw new Error('schema');observation=data;mode='live';}
    catch {try{const data=await read('data/service-status.json');if(!validStatus(data))throw new Error('schema');observation=data;mode='snapshot';}catch{mode='unavailable';observation={generatedAt:null,environment:'No current monitor connection',coverage:{monitored:0,total:catalog.services.length},ownServices:[],services:catalog.services.map(s=>({id:s.id,name:s.name,category:s.category,provider:{status:'unknown',reason:'feed_unavailable',source:s.statusSource?.page},connector:{status:'unknown',reason:'internal_feed_unavailable'}}))};}}
    refreshing=false;button.disabled=false;button.textContent='REFRESH ↻';renderStatus();
  }
  function renderRoadmap() {
    const focus=$('#roadmapFilter').value;
    const selected=catalog.phases.filter(p=>focus==='all' || focus==='access' && [3,4,5,6].includes(p.id) || focus==='chain' && [1,2].includes(p.id) || focus==='hosting' && [3,4].includes(p.id));
    $('#roadmapStages').innerHTML=selected.map(p=>{
      const services=catalog.services.filter(s=>s.phase===p.id);
      return `<article class="roadmap-stage" id="phase-${p.id}"><span class="stage-number">${String(p.id).padStart(2,'0')}</span><div class="stage-body"><div class="stage-head"><h2>${esc(p.title)}</h2><span class="stage-state">${esc(p.state)}</span></div><p>${esc(p.description)}</p><h3>COMPLETION GATES</h3><ul class="stage-gates">${p.gates.map(g=>`<li>${esc(g)}</li>`).join('')}</ul><h3>SERVICES / OFFICIAL DOCS</h3><div class="stage-providers">${services.map(s=>`<a href="${esc(s.docs)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a>`).join('')}</div>${services.length?`<details class="stage-access"><summary>Access requirements & dependencies</summary>${services.map(s=>`<p><strong>${esc(s.name)}:</strong> ${esc(s.access)}${s.dependencies.length?` Dependencies: ${esc(s.dependencies.map(id=>catalog.services.find(x=>x.id===id)?.name || id).join(', '))}.`:''}</p>`).join('')}</details>`:''}</div></article>`;
    }).join('');
  }
  async function init() {
    if(!$('#serviceRows') && !$('#roadmapStages'))return;
    try{catalog=await read('data/services.json');if(!Array.isArray(catalog.services) || !Array.isArray(catalog.phases))throw new Error('schema');}
    catch{const el=$('#statusFreshness') || $('#roadmapStages');el.textContent='The service register could not be loaded. Please refresh or inspect the integration notes in the project vault.';return;}
    if($('#serviceRows')){
      $('#serviceSearch').addEventListener('input',renderStatus);$('#statusFilter').addEventListener('change',renderStatus);$('#refreshStatus').addEventListener('click',refresh);await refresh();
      setInterval(()=>{if(!document.hidden)refresh()},60_000);
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
    } else {
      $('#roadmapFilter').addEventListener('change',renderRoadmap);renderRoadmap();
      if(/^#phase-\d$/.test(location.hash))$(location.hash)?.scrollIntoView({behavior:'instant'});
    }
  }
  init();
})();
