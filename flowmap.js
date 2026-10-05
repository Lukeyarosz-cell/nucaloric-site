/* An inspectable implementation graph. Links describe proposed sequencing. */
(() => {
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const edges=[[0,1],[1,2],[0,3],[3,4],[0,5],[5,6]];
 let catalog,focus='all',selected=0,resizeObserver,intersectionObserver,initialized=false;
 const root=()=>document.querySelector('#roadmapStages');
 function eligible(id){return focus==='all'||focus==='access'&&[3,4,5,6].includes(id)||focus==='chain'&&[1,2].includes(id)||focus==='hosting'&&[3,4].includes(id);}
 function select(id,updateHash=false){
  selected=id;const phase=catalog.phases.find(p=>p.id===id);if(!phase)return;
  root().querySelectorAll('[data-flow-node]').forEach(b=>{const on=Number(b.dataset.flowNode)===id;b.setAttribute('aria-pressed',String(on));});
  const services=catalog.services.filter(s=>s.phase===id),panel=document.querySelector('#flowDetails');
  panel.innerHTML=`<div class="flow-detail-head"><div><span class="kicker">STAGE ${String(id).padStart(2,'0')} / ${esc(phase.state)}</span><h2>${esc(phase.title)}</h2></div><span class="flow-detail-symbol" aria-hidden="true">↗</span></div><p>${esc(phase.description)}</p><div class="flow-detail-columns"><div><h3>COMPLETION GATES</h3><ul class="stage-gates">${phase.gates.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></div><div><h3>CONNECTED SERVICES</h3><div class="stage-providers">${services.map(s=>`<a href="${esc(s.docs)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a>`).join('')||'<p>Core website and public-read workflows.</p>'}</div>${services.length?`<details class="stage-access"><summary>Access requirements & dependencies</summary>${services.map(s=>`<p><strong>${esc(s.name)}:</strong> ${esc(s.access)}${s.dependencies.length?` Dependencies: ${esc(s.dependencies.map(id=>catalog.services.find(x=>x.id===id)?.name||id).join(', '))}.`:''}</p>`).join('')}</details>`:''}</div></div>`;
  document.querySelector('#flowSelection').textContent=`Inspecting stage ${id}: ${phase.title}`;
  if(updateHash)history.replaceState(null,'','#phase-'+id);
 }
 function draw(){const host=root();if(!host)return;const graph=host.querySelector('.flow-graph'),svg=host.querySelector('svg'),bounds=graph.getBoundingClientRect();if(!bounds.width)return;svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
  svg.innerHTML=edges.map(([a,b])=>{const first=host.querySelector(`[data-flow-node="${a}"]`),last=host.querySelector(`[data-flow-node="${b}"]`);if(first.hidden||last.hidden)return '';const x={left:first.offsetLeft,top:first.offsetTop,width:first.offsetWidth,height:first.offsetHeight},y={left:last.offsetLeft,top:last.offsetTop,width:last.offsetWidth,height:last.offsetHeight},mobile=innerWidth<760;
   const sx=mobile?x.left+x.width/2:x.left+x.width,sy=mobile?x.top+x.height:x.top+x.height/2,tx=mobile?y.left+y.width/2:y.left,ty=mobile?y.top:y.top+y.height/2;
   const d=mobile?`M${sx},${sy} C${sx},${sy+26} ${tx},${ty-26} ${tx},${ty}`:`M${sx},${sy} C${sx+40},${sy} ${tx-40},${ty} ${tx},${ty}`;
   return `<path class="flow-path" d="${d}"/><path class="flow-signal" d="${d}"/>`;}).join('');
 }
 function render(data,nextFocus){catalog=data;focus=nextFocus;const host=root();
  // Keep all branches visible as context; the focus dims unrelated nodes.
  host.innerHTML=`<div class="flow-map-head"><span>THE IMPLEMENTATION NETWORK</span><span>SELECT A NODE TO INSPECT ↘</span></div><div class="flow-graph"><svg aria-hidden="true" focusable="false"></svg>${catalog.phases.map(p=>`<button type="button" class="flow-node roadmap-stage${eligible(p.id)?'':' flow-muted'}" id="phase-${p.id}" data-flow-node="${p.id}" aria-controls="flowDetails" aria-pressed="false"><span class="flow-node-top"><b>${String(p.id).padStart(2,'0')}</b><i aria-hidden="true" ${p.id===0?'class="flow-live"':''}></i></span><strong>${esc(p.title)}</strong><small>${esc(p.state)}</small></button>`).join('')}</div><p class="ops-footnote">Lines show proposed implementation order. Select any stage for its services, access requirements and completion gates.</p><p id="flowSelection" class="sr-only" role="status"></p><section id="flowDetails" class="flow-details" aria-label="Selected implementation stage"></section>`;
  if(!eligible(selected))selected=catalog.phases.find(p=>eligible(p.id))?.id??0;
  const hash=!initialized&&/^#phase-(\d)$/.exec(location.hash);initialized=true;if(hash&&catalog.phases.some(p=>p.id===Number(hash[1])))selected=Number(hash[1]);
  host.querySelectorAll('[data-flow-node]').forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.flowNode),true)));
  select(selected);resizeObserver?.disconnect();resizeObserver=new ResizeObserver(draw);resizeObserver.observe(host.querySelector('.flow-graph'));requestAnimationFrame(draw);
  intersectionObserver?.disconnect();intersectionObserver=new IntersectionObserver(entries=>host.classList.toggle('flow-awake',entries[0].isIntersecting));intersectionObserver.observe(host);
  document.fonts.ready.then(draw);
 }
 window.NUC_FLOWMAP={render};
 addEventListener('hashchange',()=>{if(catalog&&/^#phase-\d$/.test(location.hash))select(Number(location.hash.slice(7)));});
})();
