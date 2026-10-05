/* Native scroll, layered dot artwork, and a quiet reading-depth rail. */
(() => {
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const rail=document.createElement('div');rail.className='scroll-depth-rail';rail.setAttribute('role','progressbar');rail.setAttribute('aria-label','Page reading depth');rail.setAttribute('aria-valuemin','0');rail.setAttribute('aria-valuemax','100');for(let i=0;i<12;i++){const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');rail.append(dot);}document.body.append(rail);
 const layers=[...document.querySelectorAll('.signature-art,.market-art,.ops-hero>canvas,#heroWave')];
 layers.forEach((el,index)=>{el.classList.add('depth-layer');el.dataset.depthSpeed=String(index%2?18:28);});
 let frame=0;
 function paint(){frame=0;const max=document.documentElement.scrollHeight-innerHeight,ratio=max>0?Math.max(0,Math.min(1,scrollY/max)):1;
  rail.setAttribute('aria-valuenow',String(Math.round(ratio*100)));rail.children&&[...rail.children].forEach((dot,index)=>dot.classList.toggle('depth-read',ratio>=index/11));rail.hidden=max<150;
  const still=reduced.matches||window.NUC_DOTS?.isPaused()||document.hidden;
  for(const el of layers){const box=el.getBoundingClientRect();if(box.bottom<-100||box.top>innerHeight+100)continue;const delta=still?0:Math.max(-30,Math.min(30,(innerHeight/2-(box.top+box.height/2))/innerHeight*Number(el.dataset.depthSpeed)));el.style.setProperty('--depth-shift',delta.toFixed(2)+'px');}
 }
 const schedule=()=>{if(!frame&&!document.hidden)frame=requestAnimationFrame(paint);};
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});reduced.addEventListener('change',schedule);document.addEventListener('visibilitychange',schedule);
 new ResizeObserver(schedule).observe(document.body);new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});schedule();
})();
