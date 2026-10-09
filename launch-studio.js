/* Four editing surfaces, one unchanged local coin plan. */
(() => {
 const form=document.getElementById('coinWorkbench');if(!form||!document.body.classList.contains('reference-launch'))return;
 const tabs=[...form.querySelectorAll('[data-launch-tab]')],steps=[...form.querySelectorAll('[data-launch-step]')],names=['Identity','Budget','Supply','Revenue'];let current=0;
 function select(index,focus=false){current=Math.max(0,Math.min(3,index));tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===current));tab.tabIndex=i===current?0:-1;});steps.forEach((step,i)=>step.hidden=i!==current);form.querySelector('[data-launch-prev]').disabled=!current;form.querySelector('[data-launch-next]').textContent=current===3?'Review your plan ↗':'Next: '+names[current+1]+' →';form.querySelector('[data-launch-step-note]').textContent=String(current+1).padStart(2,'0')+' / '+names[current].toUpperCase();if(focus)tabs[current].focus({preventScroll:true});}
 tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',e=>{const key=e.key;if(['ArrowLeft','ArrowRight','Home','End'].includes(key)){e.preventDefault();select(key==='Home'?0:key==='End'?3:(current+(key==='ArrowRight'?1:3))%4,true);}});});
 form.querySelector('[data-launch-prev]').addEventListener('click',()=>select(current-1,true));
 form.querySelector('[data-launch-next]').addEventListener('click',()=>{if(current<3)select(current+1,true);else{const save=form.querySelector('.coin-save-module');save.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});save.querySelector('button').focus({preventScroll:true});}});
 function reveal(id){const target=document.getElementById(id),step=target?.closest('[data-launch-step]');if(step)select(Number(step.dataset.launchStep));}
 window.NUC_LAUNCH_STUDIO={reveal};addEventListener('hashchange',()=>reveal(location.hash.slice(1)));reveal(location.hash.slice(1));select(current);
 ['coinCommunityToggle','coinCapabilitiesToggle'].forEach(id=>document.getElementById(id).addEventListener('change',()=>select(0)));
})();
