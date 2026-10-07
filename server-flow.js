/* Public fleet health for the two local servers; external logos are provider links. */
(() => {
  const root=document.querySelector('[data-server-flow]');if(!root)return;
  const health=root.querySelector('.net-health');let loading=false;
  const online=n=>n?.status==='online'&&Number.isFinite(n.checkedAt)&&Math.abs(Date.now()/1000-n.checkedAt)<60;
  const uptime=s=>{const m=Math.floor(s/60);return (m>=1440?Math.floor(m/1440)+'d ':'')+Math.floor(m%1440/60)+'h '+m%60+'m';};
  function display(nodes){
    let count=0;
    for(const role of ['main','worker']){
      const n=nodes.find(n=>n.role===role),up=online(n);count+=Number(up);
      root.querySelector(`[data-net-server="${role}"]`).dataset.health=up?'online':'offline';
      root.querySelector(`[data-net-live="${role}"]`).textContent=up?`UP ${uptime(n.uptimeSeconds)} · ${n.runningWebsites}/${n.websiteLimit} SITES`:'Live health unavailable';
    }
    health.dataset.health=count===2?'online':'offline';health.textContent=count===2?'Both local servers online':count+' of 2 local servers reachable';
  }
  async function load(){
    if(loading)return;
    if(location.hostname.endsWith('.github.io')){health.textContent='See live health on your Pi';return;}
    loading=true;
    try{const response=await fetch('/api/fleet',{cache:'no-store',signal:AbortSignal.timeout(8500)});if(!response.ok)throw Error();const data=await response.json();if(!Array.isArray(data.nodes))throw Error();display(data.nodes);}catch{display([]);health.textContent='Live server health unavailable';}finally{loading=false;}
  }
  for(const link of root.querySelectorAll('[data-net-provider]')){
    const highlight=()=>{root.dataset.provider=link.dataset.netProvider;};
    link.addEventListener('mouseenter',highlight);link.addEventListener('focus',highlight);
    link.addEventListener('mouseleave',()=>{delete root.dataset.provider;});link.addEventListener('blur',()=>{delete root.dataset.provider;});
  }
  load();setInterval(()=>{if(!document.hidden)load();},30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
})();
