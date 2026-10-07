/* One-shot module arrivals and native disclosure feedback. No animation loop. */
(()=>{
 if(document.body.classList.contains('creator-desk'))return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),playing=new Set();
 function arrive(node){if(reduced.matches||document.hidden)return;const a=node.animate([{opacity:.6,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,easing:'cubic-bezier(.2,.7,.2,1)'});playing.add(a);a.finished.catch(()=>{}).finally(()=>playing.delete(a));}
 const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){observer.unobserve(e.target);arrive(e.target);}},{threshold:.12});
 document.querySelectorAll('main :is(.creative-kit,.workspace-panel,.studio-signature-card,.workspace-glass-stage,.integration-card,.control-panel,.score-panel,.hosting-terminal,.service-record,.services-record,.price-glass)').forEach(node=>observer.observe(node));
 document.querySelectorAll('main details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open){const body=[...d.children].find(n=>n.tagName!=='SUMMARY');if(body)arrive(body);}}));
 reduced.addEventListener('change',()=>{if(reduced.matches)for(const a of playing)a.cancel();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const a of playing)a.cancel();});
})();
