/* Small, useful motion and working-draft feedback for the dark workspace. */
(() => {
  if(!document.body.classList.contains('creative-workspace'))return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),buttons=[...document.querySelectorAll('[data-motion-toggle]')];
  function motionState(){const paused=window.NUC_DOTS?.isPaused() || false;document.body.classList.toggle('motion-paused',paused);buttons.forEach(b=>{b.disabled=reduced.matches;b.setAttribute('aria-pressed',String(paused));b.textContent=reduced.matches?'MOTION REDUCED':paused?'RESUME MOTION ↗':'PAUSE MOTION Ⅱ';});}
  buttons.forEach(b=>b.addEventListener('click',()=>{window.NUC_DOTS?.setPaused(!window.NUC_DOTS.isPaused());motionState();}));reduced.addEventListener('change',motionState);motionState();
  document.addEventListener('visibilitychange',()=>document.body.classList.toggle('motion-sleep',document.hidden));
  const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('creative-visible');observer.unobserve(e.target);}}, {threshold:.06});
  const watched=new WeakSet(),selector='.creative-hero-copy,.signature-art,.registry-kits button,.registry-group-head,.cap-card,.studio-section-head,.brief-chapter,.brief-preview,.ops-own,.service-row,.roadmap-stage';
  function observe(root){for(const el of root.querySelectorAll(selector)){if(watched.has(el))continue;watched.add(el);el.dataset.creativeReveal='';observer.observe(el);}}
  document.body.classList.add('creative-reveal-ready');observe(document);
  // Asynchronous service observations get the same entrance as the static pages.
  const dynamic=document.querySelector('#serviceRows') || document.querySelector('#roadmapStages');
  if(dynamic)new MutationObserver(()=>observe(dynamic)).observe(dynamic,{childList:true});
  const form=document.querySelector('#projectBriefForm');
  if(form){
    const count=document.querySelector('#briefDetailsCount'),bar=document.querySelector('#briefDetailsBar');
    function details(){const filled=['name','purpose','milestone','repo','demo'].filter(key=>form.elements[key].value.trim()).length;count.textContent=`${filled} / 5 DETAILS ADDED`;bar.style.width=filled*20+'%';}
    form.addEventListener('input',details);form.addEventListener('change',details);document.querySelectorAll('[data-studio-kit]').forEach(b=>b.addEventListener('click',details));details();
    const chapters=[...document.querySelectorAll('.brief-chapter')],links=[...document.querySelectorAll('.studio-chapter-nav a')];
    function mark(id){links.forEach(a=>a.hash==='#'+id?a.setAttribute('aria-current','step'):a.removeAttribute('aria-current'));}
    links.forEach(a=>a.addEventListener('click',()=>mark(a.hash.slice(1))));
    const chapterObserver=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(visible[0])mark(visible[0].target.id);},{rootMargin:'-15% 0px -50% 0px',threshold:0});chapters.forEach(c=>chapterObserver.observe(c));
  }
})();
