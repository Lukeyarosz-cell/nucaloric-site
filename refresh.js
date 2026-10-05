/* Creative refresh: purpose-based kits, local project briefs, and a single dot motion language. */
(() => {
  const storage = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
  };
  const kits = {
    creator: { workload: 'web', tools: ['Build', 'Create', 'Collectible drops', 'X / social mind'], purpose: 'A useful home for my work and the people who use it.', milestone: 'Ship a working website with one useful feature.' },
    agent: { workload: 'model', tools: ['Memory', 'Research the web', 'Think in public', 'Mission'], purpose: 'An agent that does useful research with a clear purpose and limits.', milestone: 'Publish one repeatable workflow and its results.' },
    community: { workload: 'dev', tools: ['Collaborate', 'Bounties', 'Polls', 'Milestone rewards'], purpose: 'A community that contributes to a shared project.', milestone: 'Publish a first milestone and a clear way to contribute.' },
    custom: { workload: 'dev', tools: [], purpose: '', milestone: '' }
  };
  // One monochrome chapter curtain, with readable white copy.
  const curtain = document.querySelector('.transition-inner');
  if (curtain) { const label = document.createElement('span'); label.className = 'transition-chapter'; label.dataset.transitionLabel = ''; label.textContent = 'MAKE SOMETHING REAL.'; curtain.append(label); }

  const cards = [...document.querySelectorAll('.registry-group .cap-card')];
  const names = cards.map(card => card.querySelector('h3').textContent.trim());
  let saved = storage.get('nucCapabilityShortlist', []);
  let shortlist = Array.isArray(saved) ? [...new Set(saved.filter(v => typeof v === 'string' && v.length <= 100))].slice(0,49) : [];
  if (cards.length) shortlist = shortlist.filter(name => names.includes(name));
  function updateShortlist() {
    document.querySelectorAll('[data-shortlist-count]').forEach(el => el.textContent = shortlist.length);
    cards.forEach(card => { const name = card.querySelector('h3').textContent.trim(), selected = shortlist.includes(name), button = card.querySelector('.tool-add'); if(button){button.textContent = selected ? 'ADDED ✓' : '+ ADD'; button.setAttribute('aria-pressed', String(selected));} });
    renderBriefTools();
  }
  cards.forEach(card => {
    const name = card.querySelector('h3').textContent.trim();
    // The card itself opens the detail drawer; an independent button adds to the brief.
    card.setAttribute('role','group'); card.setAttribute('aria-label', name + '. Enter for details, or add to your project toolset.');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'tool-add'; button.setAttribute('aria-label', 'Add ' + name + ' to your toolset');
    button.addEventListener('keydown',e=>e.stopPropagation());
    button.addEventListener('click', event => {
      event.stopPropagation(); shortlist = shortlist.includes(name) ? shortlist.filter(v=>v!==name) : [...shortlist,name];
      const persisted = storage.set('nucCapabilityShortlist', shortlist); updateShortlist();
      if(typeof showToast==='function')showToast(persisted ? `${name} ${shortlist.includes(name)?'added to':'removed from'} your toolset` : 'Toolset updated for this page. Browser storage is unavailable.');
    });card.append(button);
  });
  document.querySelectorAll('[data-kit]').forEach(button => button.addEventListener('click', () => {
    const kit = kits[button.dataset.kit];
    const matches = cards.filter(card => kit.tools.some(tool => card.querySelector('h3').textContent.trim() === tool));
    if(matches.length){shortlist=[...new Set([...shortlist,...matches.map(card=>card.querySelector('h3').textContent.trim())])];storage.set('nucCapabilityShortlist',shortlist);}
    storage.set('nucStudioKit',button.dataset.kit); updateShortlist();
    document.querySelectorAll('[data-kit]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    if(typeof showToast==='function')showToast(`${matches.length} suggested capabilities added. Review them in Project Studio.`);
  }));

  const form = document.querySelector('#projectBriefForm');
  let activeKit = 'creator';
  function fields() { return Object.fromEntries(new FormData(form)); }
  function renderBriefTools() {
    const root = document.querySelector('#briefTools'); if (!root) return; root.replaceChildren();
    if (!shortlist.length) { const p=document.createElement('p');p.className='brief-help';p.textContent='Add a few useful tools from Registry.';root.append(p);return; }
    shortlist.forEach(name=>{const chip=document.createElement('span');chip.className='brief-tool-chip';chip.textContent=name;root.append(chip);});
  }
  function renderBrief() {
    if(!form)return;const values=fields(),name=values.name.trim(),purpose=values.purpose.trim(),split=Number(values.builderSplit);
    document.querySelector('#briefPreviewName').textContent=name||'Make something real.';
    document.querySelector('#briefPreviewPurpose').textContent=purpose||'A clear purpose is the first useful feature.';
    document.querySelector('#builderSplitValue').textContent=`${split}%`;
    document.querySelector('#builderSplitBar').style.width=`${split}%`;
    document.querySelector('#communitySplitValue').textContent=`${100-split}% reserved for community work.`;
    document.querySelector('#briefProofRepo').textContent=values.repo?`Repository · ${values.repo} (self-reported)`:'Repository · not added yet';
    document.querySelector('#briefProofDemo').textContent=values.demo?`Demo · ${values.demo} (self-reported)`:'Demo · not added yet';
    document.querySelector('#briefProofMilestone').textContent=values.milestone?`First milestone · ${values.milestone}`:'First milestone · not added yet';
    document.querySelector('#briefHostingLink').href=`hosting.html?workload=${values.workload}#workspaceBuilder`;
    document.querySelectorAll('[data-studio-kit]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.studioKit===activeKit)));
  }
  function selectKit(key, overwrite=false) {
    if(!kits[key])key='creator'; activeKit=key; const kit=kits[key];
    if(form){form.elements.workload.value=kit.workload; if(overwrite||!form.elements.purpose.value)form.elements.purpose.value=kit.purpose; if(overwrite||!form.elements.milestone.value)form.elements.milestone.value=kit.milestone;renderBrief();}
    storage.set('nucStudioKit', key);
  }
  if(form){
    const draft=window.NUC_PROJECTS?.active()?.draft || storage.get('nucProjectBrief',null);
    if(draft?.version===1&&draft.fields&&typeof draft.fields==='object'){
      for(const key of ['name','purpose','milestone','repo','demo'])if(typeof draft.fields[key]==='string')form.elements[key].value=draft.fields[key].slice(0,500);
      if(['web','dev','model'].includes(draft.fields.workload))form.elements.workload.value=draft.fields.workload;
      if(Number.isFinite(Number(draft.fields.builderSplit)))form.elements.builderSplit.value=Math.max(0,Math.min(100,Number(draft.fields.builderSplit)));
      activeKit=Object.hasOwn(kits,draft.kit)?draft.kit:'creator';
      document.querySelector('#briefStatus').textContent='Your saved brief is ready to keep building.';
    }
    const queryKit=new URLSearchParams(location.search).get('kit'),pendingKit=storage.get('nucStudioKit',null);
    if(queryKit&&Object.hasOwn(kits,queryKit))selectKit(queryKit,!draft);
    else if(!draft)selectKit(pendingKit||'creator');
    form.addEventListener('input',renderBrief);form.addEventListener('change',renderBrief);
    document.querySelectorAll('[data-studio-kit]').forEach(b=>b.addEventListener('click',()=>selectKit(b.dataset.studioKit)));
    form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const draft={version:1,kit:activeKit,fields:fields(),tools:shortlist,updatedAt:new Date().toISOString()};const result=window.NUC_PROJECTS?.saveDraft(draft);if(result){if(result.ok)storage.set('nucProjectBrief',draft);document.querySelector('#briefStatus').textContent=result.ok?'Project saved on this device. Track its milestones in your library below.':result.error;}else{const ok=storage.set('nucProjectBrief',draft);document.querySelector('#briefStatus').textContent=ok?'Brief saved on this device.':'Your browser could not save this brief. Export a copy instead.';}});
    document.querySelector('#exportBrief').addEventListener('click',()=>{
      if(!form.reportValidity())return;const v=fields();const text=`# ${v.name}\n\n${v.purpose}\n\n## First milestone\n${v.milestone||'Not yet specified'}\n\n## Workspace\n${v.workload}\n\n## Capabilities\n${shortlist.map(n=>'- '+n).join('\n')||'Not yet selected'}\n\n## Project evidence (self-reported)\nRepository: ${v.repo||'Not added'}\nDemo: ${v.demo||'Not added'}\n\n## Proposed income allocation\nBuilders: ${v.builderSplit}%\nCommunity work: ${100-Number(v.builderSplit)}%\n\nPlanning only. No funds move, no returns are promised, and no evidence is independently verified.\n`;
      const url=URL.createObjectURL(new Blob([text],{type:'text/markdown'}));const link=document.createElement('a');link.href=url;link.download=(v.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60)||'project')+'-brief.md';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.querySelector('#briefStatus').textContent='Brief exported. Keep building, and add your next proof of work.';
    });renderBrief();
  }
  updateShortlist();

  const accountCard=document.querySelector('.account-project-card');
  if(accountCard){const draft=window.NUC_PROJECTS?.active()?.draft || storage.get('nucProjectBrief',null);const panel=document.createElement('div');panel.className='dashboard-brief-summary';const label=document.createElement('span');label.textContent='PROJECT STUDIO';const title=document.createElement('strong');title.textContent=draft?.version===1&&typeof draft.fields?.name==='string'?draft.fields.name:'Give your idea a first milestone.';const link=document.createElement('a');link.href='studio.html#brief';link.textContent=draft?.version===1?'CONTINUE YOUR PROJECT BRIEF ↗':'MAKE A PROJECT BRIEF ↗';panel.append(label,title,link);accountCard.append(panel);}

  // Dot topography replaces rotating sculptures and overlapping ambient effects.
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const sculpture=document.querySelector('#capabilitySculpture');if(sculpture)sculpture.dataset.dotField='arch';
  const market=document.querySelector('#homeMarketCanvas');if(market)market.dataset.dotField='signal';
  const explore=document.querySelector('#explorePulseCanvas');if(explore)explore.dataset.dotField='signal';
  document.querySelectorAll('.page-hero,.launch-intro,.hosting-hero').forEach(section=>{const c=document.createElement('canvas');c.className='dot-horizon';c.dataset.dotField='horizon';c.setAttribute('aria-hidden','true');c.dataset.dotLight=String(!section.closest('.hosting, .hosting-page'));section.prepend(c);});
  const surfaces=[];let raf=0,lastPaint=0,paused=storage.get('nucMotionPaused',false)===true,pausedTime=0;
  function size(surface){const r=surface.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);surface.w=r.width;surface.h=r.height;surface.canvas.width=Math.max(1,Math.round(r.width*d));surface.canvas.height=Math.max(1,Math.round(r.height*d));surface.ctx.setTransform(d,0,0,d,0,0);}
  function paint(surface,time){
    const {ctx,w,h,canvas}=surface;if(!w||!h)return;ctx.clearRect(0,0,w,h);const gap=w<420?15:20,t=(reduce.matches?0:paused?pausedTime:time)+(Number(canvas.dataset.dotPhase)||0),mode=canvas.dataset.dotField,light=canvas.dataset.dotLight==='true';
    for(let y=gap/2;y<h;y+=gap)for(let x=gap/2;x<w;x+=gap){
      const nx=x/w,ny=y/h,phase=Math.sin(nx*8-t*.32)*.065+Math.sin(nx*17+t*.22)*.025;
      let strength;
      if(mode==='horizon')strength=Math.max(0,(ny-.36-phase)/.64);
      else if(mode==='arch'){const target=.55+Math.sin(nx*Math.PI*1.7+t*.16)*.21;strength=Math.exp(-Math.pow((ny-target)/.19,2))*(.3+.7*Math.sin(nx*Math.PI));}
      else if(mode==='signal'){const ridge=.49+Math.sin(nx*8-t*.45)*.19+Math.sin(nx*18+t*.22)*.06;strength=Math.exp(-Math.pow((ny-ridge)/.14,2));}
      else if(mode==='weave'){const a=.5+Math.sin(nx*Math.PI*2+t*.25)*.22,b=.5+Math.cos(nx*Math.PI*2-t*.18)*.22;strength=Math.max(Math.exp(-Math.pow((ny-a)/.1,2)),Math.exp(-Math.pow((ny-b)/.1,2)))*Math.pow(Math.sin(nx*Math.PI),.7);}
      else if(mode==='bloom'){const distance=Math.hypot((nx-.5)*1.2,ny-.5),radius=.25+Math.sin(t*.24)*.055;strength=Math.max(Math.exp(-Math.pow((distance-radius)/.075,2)),Math.exp(-Math.pow((distance-radius*.45)/.08,2))*.5)*Math.max(0,1-distance*.75);}
      else{const d=Math.hypot((nx-.5)*1.3,ny-.5);strength=(.5+.5*Math.sin(d*19-t*.5))*Math.max(0,1-d*1.4);}
      const seed=(Math.floor(x/gap)*17+Math.floor(y/gap)*31)%53;
      ctx.globalAlpha=.08+strength*.7;ctx.fillStyle=seed<5?'#e7b5c4':light?'#080809':'#f4f1ec';ctx.beginPath();ctx.arc(x,y,.65+strength*2.9,0,Math.PI*2);ctx.fill();
    }ctx.globalAlpha=1;
  }
  function tick(now){raf=0;if(reduce.matches||paused||now-lastPaint>=1000/30){lastPaint=now;for(const s of surfaces)if(s.visible)paint(s,now/1000);}if(!reduce.matches&&!paused&&!document.hidden&&surfaces.some(s=>s.visible))raf=requestAnimationFrame(tick);}
  function sync(){cancelAnimationFrame(raf);raf=0;lastPaint=0;if(!document.hidden)tick(performance.now());}
  const observer=new IntersectionObserver(entries=>{for(const e of entries){const s=surfaces.find(s=>s.canvas===e.target);if(s)s.visible=e.isIntersecting;}sync();},{rootMargin:'60px'});
  const resize=new ResizeObserver(entries=>{for(const e of entries){const s=surfaces.find(s=>s.canvas===e.target);if(s){size(s);paint(s,performance.now()/1000);}}});
  function mount(canvas){if(!canvas||surfaces.some(s=>s.canvas===canvas))return;const s={canvas,ctx:canvas.getContext('2d'),visible:false,w:0,h:0};surfaces.push(s);size(s);paint(s,0);observer.observe(canvas);resize.observe(canvas);}
  window.NUC_DOTS={mount,isPaused:()=>paused,setPaused(value){paused=Boolean(value);pausedTime=performance.now()/1000;storage.set('nucMotionPaused',paused);sync();}};document.querySelectorAll('[data-dot-field]').forEach(mount);
  document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);
})();
