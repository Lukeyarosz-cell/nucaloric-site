/* Public entry and CM5 recovery status. Private sessions stay on the live origin. */
(()=>{
 const state={origin:null,websitesOrigin:null,mode:null},isGitHub=location.hostname.endsWith('.github.io');
 const preview=new URLSearchParams(location.search).get('preview')==='1';
 function notice(message){let bar=document.getElementById('nucRecoveryStatus');if(!message){bar?.remove();return;}if(!bar){bar=document.createElement('aside');bar.id='nucRecoveryStatus';bar.setAttribute('role','status');const target=document.querySelector('main');if(target)target.before(bar);else document.body.append(bar);}bar.textContent=message;}
 async function probe(origin){const r=await fetch(origin+'/api/edge-status',{cache:'no-store',signal:AbortSignal.timeout(6500)});if(!r.ok)throw Error('Unavailable');const data=await r.json();if(data.status!=='operational')throw Error('Unavailable');return data;}
 const ready=(async()=>{
  if(!isGitHub){try{const data=await probe(location.origin);state.mode=data.mode;notice(data.mode==='fallback'?'Running on CM5 · The main Pi is reconnecting. Browsing and local planning are available; account changes, AI chat and payments resume when it returns.':null);setInterval(async()=>{try{const next=await probe(location.origin);if(state.mode==='fallback'&&next.mode==='main'){location.reload();return;}state.mode=next.mode;notice(next.mode==='fallback'?'Running on CM5 · Main Pi recovery is in progress. Account services and payments will resume automatically.':null);}catch{}},20000);}catch{}return state;}
  try{
   const response=await fetch(new URL('data/live-site.json',document.baseURI),{cache:'no-store'});if(!response.ok)return state;
   const data=await response.json(),url=new URL(data.origin);
   if(url.protocol!=='https:'||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash||url.hostname===location.hostname)return state;
   let status;try{status=await probe(url.origin);}catch{notice('The live servers are reconnecting. You can still browse here; account services will return with the live connection.');return state;}
   state.origin=url.origin;state.websitesOrigin=data.websitesOrigin||null;state.mode=status.mode;
   const name=location.pathname.split('/').pop()||'index.html';
   if(!preview){location.replace(new URL(name+location.search+location.hash,url).href);return state;}
   const actions=document.querySelector('.nav-actions');if(actions){const a=document.createElement('a');a.className='nav-live-link';a.href=url.origin+'/dashboard.html';a.textContent='Live workspace ↗';a.setAttribute('aria-label','Open the live workspace');actions.prepend(a);}
   for(const a of document.querySelectorAll('a[href]')){const target=new URL(a.getAttribute('href'),location.href),file=target.pathname.split('/').pop();if(target.origin===location.origin&&['dashboard.html','billing.html','services.html','ai.html'].includes(file))a.href=new URL(file+target.search+target.hash,url).href;}
  }catch{}
  return state;
 })();window.NUC_LIVE_SITE={state,ready};
})();
