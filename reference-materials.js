/* A few shared material cues; the page's existing tools keep their controllers. */
(() => {
 const make=(tag,cls,html)=>{const e=document.createElement(tag);e.className=cls;if(html)e.innerHTML=html;return e;};
 const menu=document.querySelector('.nav-tools-items');
 if(menu&&!menu.querySelector('[href^="tools.html"]')){const link=make('a','nav-toolbox-link','<span class="nav-item-icon" aria-hidden="true">✳</span><span class="nav-item-copy"><b>The Toolbox</b><small>Apps for your next idea</small></span><span class="nav-item-arrow" aria-hidden="true">↗</span>');link.href='tools.html';menu.append(link);}
 if(document.body.classList.contains('atelier-dashboard')){
  const work=document.querySelector('#deskWork');if(work){const dots=make('canvas','workspace-ambient-dots');dots.dataset.dotField='wave';dots.dataset.dotPalette='ice';dots.setAttribute('aria-hidden','true');work.prepend(dots);window.NUC_DOTS?.mount(dots);}
  const nav=document.querySelector('.desk-nav');if(nav){const button=make('button','desk-toolbox-nav','<span aria-hidden="true">✳</span><b>My tools</b><small data-tools-count>0</small>');button.type='button';button.setAttribute('aria-label','My tools');button.dataset.deskOpen='deskTools';button.addEventListener('click',()=>window.NUC_DEV_PANELS?.open('deskTools'));nav.append(button);}
 }
 document.querySelectorAll('.ref-hero-art canvas,.tools-entry-art canvas').forEach(c=>window.NUC_DOTS?.mount(c));
 if(document.body.classList.contains('home'))document.querySelector('.campaign-tour')?.classList.add('ref-outline-module');
 document.querySelectorAll('.brief-form,.cap-card,.price-stage,.ops-own,.integration-card,.reward-pass,.hosting-plan-card').forEach(e=>e.classList.add('ref-outline-module'));
})();
