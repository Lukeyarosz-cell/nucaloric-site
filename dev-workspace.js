/* One continuous dashboard: tools stay visible together, with compact controls. */
(()=>{
 const wrap=document.querySelector('.account-main > .wrap');if(!wrap)return;
 document.querySelector('#portfolioWorkspace')?.remove();
 const heading=wrap.querySelector('.account-heading'),shell=document.createElement('div');shell.className='dev-dashboard-grid';heading.after(shell);
 const modules={};
 function move(selector,key,label){const tool=document.querySelector(selector);if(!tool)return;const module=document.createElement('section');module.className='dev-module dev-module-'+key;module.setAttribute('aria-label',label);module.append(tool);shell.append(module);modules[key]=module;}
 move('.fleet-board','servers','Connected server fleet');move('.cli-workspace','terminal','Developer terminal');move('#coinAI','ai','Private local AI');
 const summary=document.querySelector('.account-summary');if(summary){summary.classList.add('dev-dashboard-summary');heading.after(summary);const watched=summary.children[1];if(watched){watched.querySelector('span').textContent='CONNECTED HARDWARE';watched.querySelector('strong').removeAttribute('id');watched.querySelector('strong').textContent='Main Pi + Distiller';}}
 const extra=document.createElement('div');extra.className='dev-dashboard-extras';shell.after(extra);
 for(const [selector,label] of [['.account-workspace-grid','Workspace plan'],['#projects','Your projects'],['.account-next-section','Tools and shortcuts'],['.account-watch-section','Watchlist']]){const n=document.querySelector(selector);if(!n)continue;const d=document.createElement('details'),s=document.createElement('summary');d.className='dev-overview-more';s.textContent=label;d.append(s,n);extra.append(d);if(selector==='#projects')modules.projects=d;}
 const grid=document.querySelector('#aiWorkspace .ai-grid');if(grid){const aside=grid.querySelector(':scope > aside:not(.ai-knowledge)'),knowledge=grid.querySelector('.ai-knowledge'),chat=grid.querySelector('.ai-chat');const workspace=aside?.querySelector('label');if(workspace&&chat){workspace.classList.add('ai-workspace-select');chat.querySelector('.ai-model-label').before(workspace);}
 for(const [n,label] of [[aside,'Workspace context +'],[knowledge,'Knowledge and tools +']]){if(!n)continue;const d=document.createElement('details'),s=document.createElement('summary');d.className='dev-ai-details';s.textContent=label;d.append(s,n);grid.append(d);}
 }
 function open(id){if(id==='workspace'){heading.scrollIntoView({behavior:'smooth',block:'start'});return;}const n=modules[id];if(!n)return;if(n.tagName==='DETAILS')n.open=true;n.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});if(id==='terminal')document.querySelector('#cliCommand')?.focus({preventScroll:true});}
 window.NUC_DEV_PANELS={open};window.addEventListener('hashchange',()=>{const key=location.hash==='#coinAI'||location.hash==='#aiChat'?'ai':location.hash.slice(1);if(key)open(key);});
})();
