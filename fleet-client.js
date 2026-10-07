/* Current LAN node observations, independent of browser-local portfolio plans. */
(() => {
 const host=document.querySelector('[data-fleet-board]');if(!host)return;
 const node=(tag,text,cls='')=>{const e=document.createElement(tag);e.textContent=text;e.className=cls;return e;};
 const age=seconds=>{if(seconds===null||!Number.isFinite(Number(seconds)))return 'Unavailable';let m=Math.floor(Number(seconds)/60),d=Math.floor(m/1440),h=Math.floor(m%1440/60);return (d?d+'d ':'')+h+'h '+m%60+'m';};
 const heading=node('div','','fleet-heading'),copy=node('div');copy.append(node('span','YOUR HARDWARE / YOUR NETWORK','kicker'),node('h2','Connected servers.'));const refresh=node('button','REFRESH ↻','fleet-refresh');refresh.type='button';heading.append(copy,refresh);const status=node('p','Reading node health…','fleet-note'),grid=node('div','','fleet-grid');status.setAttribute('role','status');host.append(heading,status,grid);
 async function load(){
  if(location.hostname.endsWith('.github.io')){status.textContent='Connect to the Pi-hosted account to see your LAN server nodes.';refresh.hidden=true;return;}
  refresh.disabled=true;
  try{
   const response=await fetch('/api/fleet',{cache:'no-store',signal:AbortSignal.timeout(8500)});if(!response.ok)throw Error();const d=await response.json();if(!Array.isArray(d.nodes)||!d.nodes.length)throw Error();grid.replaceChildren();
   for(const n of d.nodes){
    if(!n||typeof n.name!=='string')continue;const stale=typeof n.checkedAt!=='number'||Date.now()/1000-n.checkedAt>60,online=n.status==='online'&&!stale,card=node('article','','fleet-card'),top=node('div','','fleet-card-top');top.append(node('b',n.name),node('span',online?'ONLINE':stale?'STALE':'UNREACHABLE',online?'fleet-online':'fleet-offline'));card.append(top,node('p',n.model||n.host||'Server node','fleet-node-model'));const dl=document.createElement('dl');
    for(const [label,value] of [['UPTIME',online?age(n.uptimeSeconds):'Unavailable'],['WEBSITE SERVERS',online?`${n.runningWebsites} running / ${n.websiteLimit} slots`:'Unavailable'],['CPU',online&&Number.isFinite(n.temperatureC)?n.temperatureC.toFixed(1)+' °C':'Unavailable'],['STORAGE',online&&n.storage?n.storage.usedPercent+'% used':'Unavailable']]){const row=document.createElement('div');row.append(node('dt',label),node('dd',value));dl.append(row);}card.append(dl);
    const services=node('div','','fleet-services');for(const service of (n.services||[]).slice(0,8)){const badge=node('span',service.name+' · '+(['active','running'].includes(service.state)?'OK':service.state));services.append(badge);}card.append(services);if(n.ai?.models?.length){card.append(node('p',n.ai.models.map(id=>id.replace('nucaloric:','')).join(' · ')+' / LOCAL AI','fleet-note'));}
    if(n.role==='main'&&online&&n.storage?.extraMounted){card.append(node('p',`USB shared storage · ${(n.storage.extraFreeBytes/2**30).toFixed(1)} GB free · company files + private accounts`,'fleet-note'));}
    if(n.role==='worker'&&online){card.append(node('p',`Fan ${n.fanRPM??'—'} RPM · ${n.storage?.extraMounted?'microSD mounted':n.storage?.extraDetected?'microSD detected, not mounted':n.storage?.extraState==='no-medium'?'microSD reader · no medium':'microSD not detected'} · ${n.storage?.sharedConnected?'main shared files connected':'main shared files unavailable'}`,'fleet-note'));if(n.backupReplica?.replicated)card.append(node('p','Recovery snapshot copied to main Pi USB','fleet-note'));}grid.append(card);
   }
   const main=d.nodes.find(n=>n.role==='main'),worker=d.nodes.find(n=>n.role==='worker');const fresh=n=>n?.status==='online'&&Date.now()/1000-n.checkedAt<=60;status.textContent=fresh(main)&&fresh(worker)?'Main Pi · accounts + private context → Distiller · local inference + website workers · '+(worker.storage?.sharedConnected?'shared company files connected':'company share unavailable'):'Server link unavailable. Live status below.';
  }catch{status.textContent='Node health could not be read. Refresh to try again.';grid.replaceChildren();}finally{refresh.disabled=false;}
 }
 refresh.addEventListener('click',load);load();setInterval(()=>{if(!document.hidden)load();},30000);
})();
