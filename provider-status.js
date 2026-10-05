/* Shared provider parsing: used by the server and the key-free browser collector. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NUC_PROVIDER_STATUS=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
const ranks = { operational: 0, maintenance: 1, degraded: 2, outage: 3, unknown: 4 };
const codes = { operational: 'operational', degraded_performance: 'degraded', partial_outage: 'degraded', major_outage: 'outage', under_maintenance: 'maintenance', degraded: 'degraded', outage: 'outage', maintenance: 'maintenance' };
function worst(states) { return states.length ? states.reduce((a,b) => ranks[b] > ranks[a] ? b : a, 'operational') : 'unknown'; }
function parseProvider(body, source) {
  let components, reports, updatedAt, overall;
  if (source.kind === 'statuspage') {
    if (!Array.isArray(body.components) || !body.page || !Array.isArray(body.incidents)) throw new Error('schema');
    components = body.components.map(c => ({ id: c.id, name: c.name, status: codes[c.status] || 'unknown' }));
    reports = body.incidents.filter(i => !['resolved','postmortem'].includes(i.status)).map(i => ({ name: i.name, state: i.status, ids: (i.components || []).map(c=>c.id), url: i.shortlink || source.page, updatedAt: i.updated_at }));
    updatedAt = body.page.updated_at; overall = body.status?.description || 'Provider summary unavailable';
  } else if (source.kind === 'statuspal') {
    if (!body.data?.attributes || !Array.isArray(body.included)) throw new Error('schema');
    components = body.included.filter(c=>c.type === 'status_page_resource').map(c=>({ id:c.id, name:c.attributes.public_name || c.attributes.name, status: codes[c.attributes.state] || codes[c.attributes.status] || 'unknown' }));
    reports = body.included.filter(i=>i.type === 'status_report' && !i.attributes?.resolved_at).map(i=>({ name:i.attributes.title || 'Provider incident', state:i.attributes.state || 'investigating', ids:(i.relationships?.resources?.data || []).map(c=>c.id), url:source.page, updatedAt:i.attributes.updated_at }));
    updatedAt = body.data.attributes.updated_at; overall = body.data.attributes.aggregate_state || 'unknown';
  } else throw new Error('adapter');
  const selected = source.components.map(name => components.find(c=>c.name === name) || { name, status:'unknown', id:null });
  const ids = new Set(selected.map(c=>c.id).filter(Boolean));
  const incidents = reports.map(i=>({ name:String(i.name).slice(0,240), state:String(i.state).slice(0,40), url:source.page, updatedAt:i.updatedAt || null, scope:i.ids.some(id=>ids.has(id)) ? 'selected' : i.ids.length ? 'other' : 'unconfirmed' }));
  const active = incidents.some(i=>i.scope === 'selected');
  let status = worst(selected.map(c=>c.status));
  if (active && status === 'operational') status = 'degraded';
  return { status, components:selected.map(({name,status})=>({name,status})), incidents, providerSummary:String(overall).slice(0,200), providerUpdatedAt:updatedAt || null };
}

async function collect(catalog) {
 const services=await Promise.all(catalog.services.map(async service=>{
  const source=service.statusSource;
  let provider={status:'unknown',checkedAt:null,reason:'no_verified_feed',source:null,components:[],incidents:[]};
  if(source){
   try{
    const response=await fetch(source.url,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error('unavailable');
    const body=await response.json();provider={...parseProvider(body,source),checkedAt:new Date().toISOString(),reason:'provider_report',source:source.page};
   }catch{provider={status:'unknown',checkedAt:new Date().toISOString(),reason:'feed_unavailable',source:source.page,components:[],incidents:[]};}
  }
  return {id:service.id,name:service.name,category:service.category,provider,connector:{status:'not_connected',reason:'not_configured',checkedAt:null}};
 }));
 const at=new Date().toISOString(),monitored=services.filter(s=>s.provider.reason==='provider_report').length,failed=services.filter(s=>s.provider.reason==='feed_unavailable').length;
 return {schemaVersion:1,generatedAt:at,staleAfterSeconds:180,environment:'Public provider checks',mode:'browser',coverage:{monitored,total:services.length},ownServices:[
 {id:'web',name:'Website in this browser',status:'operational',reason:'Website files and service catalog loaded successfully in this browser.',checkedAt:at},
 {id:'collector',name:'Public provider checks',status:failed?'degraded':'operational',reason:`${monitored} feeds read; ${failed} feeds could not be read. Unreadable feeds have unknown availability.`,checkedAt:at},
 ...[{id:'project-api',name:'Project API & identity'},{id:'workspace-provisioner',name:'Workspace provisioner'},{id:'terminal-gateway',name:'Terminal gateway'},{id:'ai-gateway',name:'AI gateway'},{id:'machine-bridge',name:'Own-hardware bridge'}].map(s=>({...s,status:'not_connected',reason:'Backend component is not deployed or monitored.',checkedAt:null}))
 ],services};
}
return {parseProvider,collect};
});
