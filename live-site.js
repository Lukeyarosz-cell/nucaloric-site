/* GitHub is the public entry point; authenticated work runs at the live HTTPS origin. */
(()=>{
 const state={origin:null,websitesOrigin:null},isGitHub=location.hostname.endsWith('.github.io');
 const ready=(async()=>{
  if(!isGitHub)return state;
  try{
   const response=await fetch(new URL('data/live-site.json',document.baseURI),{cache:'no-store'});if(!response.ok)return state;
   const data=await response.json(),url=new URL(data.origin);
   if(url.protocol!=='https:'||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash||url.hostname===location.hostname)return state;
   state.origin=url.origin;state.websitesOrigin=data.websitesOrigin||null;
   const name=location.pathname.split('/').pop()||'index.html',preview=new URLSearchParams(location.search).get('preview')==='1';
   if(!preview){const target=new URL(name+location.search+location.hash,url);location.replace(target.href);return state;}
   const actions=document.querySelector('.nav-actions');if(actions){const a=document.createElement('a');a.className='nav-live-link';a.href=url.origin+'/dashboard.html';a.textContent='Live workspace ↗';a.setAttribute('aria-label','Open the live workspace with accounts, servers and local AI');actions.prepend(a);}
   for(const a of document.querySelectorAll('a[href]')){const target=new URL(a.getAttribute('href'),location.href),file=target.pathname.split('/').pop();if(target.origin===location.origin&&['dashboard.html','billing.html','services.html','ai.html'].includes(file))a.href=new URL(file+target.search+target.hash,url).href;}
  }catch{/* The static site remains usable if its live entry file is unavailable. */}
  return state;
 })();window.NUC_LIVE_SITE={state,ready};
})();
