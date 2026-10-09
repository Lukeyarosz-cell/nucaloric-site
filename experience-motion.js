/* GSAP follows actions and visibility. No scroll hijacking or animated form fields. */
(()=>{
 const g=window.gsap;if(!g)return;g.registerPlugin(Flip,ScrollTrigger,DrawSVGPlugin);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mm=g.matchMedia();
 let paused=window.NUC_DOTS?.isPaused()||false,context=null;const started=new WeakSet();
 function enabled(){return !reduced.matches&&!paused&&!document.hidden;}
 function enter(element){if(!element||!enabled()||!element.getClientRects().length)return;g.killTweensOf(element);g.fromTo(element,{opacity:.4,y:10},{opacity:1,y:0,duration:.42,ease:'power3.out',clearProps:'opacity,transform',overwrite:true});}
 function build(){context?.revert();if(!enabled())return;context=g.context(()=>{
  const shell=document.querySelector('.desk-shell');
  if(shell)g.fromTo(shell,{opacity:0,y:14,scale:.994},{opacity:1,y:0,scale:1,duration:.7,ease:'power3.out',clearProps:'opacity,transform'});
  else{const intro=document.querySelector('main h1');if(intro)g.fromTo(intro,{opacity:.4,y:18},{opacity:1,y:0,duration:.65,ease:'power3.out',clearProps:'opacity,transform'});}
  const network=document.querySelector('[data-server-flow]');if(network)g.fromTo(network.querySelectorAll('.net-cable,.net-external'),{drawSVG:'0%'},{drawSVG:'100%',duration:1.4,stagger:.09,ease:'power2.inOut',scrollTrigger:{trigger:network,start:'top 85%',once:true}});
  const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting&&!started.has(e.target)){started.add(e.target);enter(e.target);observer.unobserve(e.target);}},{threshold:.08});
  document.querySelectorAll('.price-stage,.module-scene,.capability-card,.workspace-panel,.hosting-flow-map').forEach(el=>observer.observe(el));
  return()=>observer.disconnect();
 });}
 mm.add('(prefers-reduced-motion: no-preference)',build);
 const tabs=document.querySelector('.desk-tool-tabs');if(tabs){const pill=document.createElement('span');pill.className='desk-tab-light';pill.setAttribute('aria-hidden','true');let previous;const move=()=>{const chosen=tabs.querySelector('[aria-pressed=true]');if(!chosen||chosen===previous)return;const state=pill.isConnected&&enabled()?Flip.getState(pill):null;chosen.append(pill);previous=chosen;if(state)Flip.from(state,{duration:.38,ease:'power3.out',absolute:true,scale:true});};new MutationObserver(move).observe(tabs,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});move();}
 const work=document.querySelector('#deskWork'),inspector=document.querySelector('.desk-manager'),cards=document.querySelector('#deskCards');
 let selection=null;
 if(cards){selection=document.createElement('div');selection.className='desk-selection-light';selection.setAttribute('aria-hidden','true');cards.append(selection);function follow(){const chosen=cards.querySelector('[aria-pressed=true]');if(!chosen){selection.hidden=true;return;}const box=chosen.getBoundingClientRect(),parent=cards.getBoundingClientRect();selection.hidden=false;const vars={y:box.top-parent.top+cards.scrollTop,height:box.height,duration:enabled()?.4:0,ease:'power3.out',overwrite:true};g.to(selection,vars);}
  new MutationObserver(()=>{if(!cards.contains(selection))cards.append(selection);follow();}).observe(cards,{childList:true,attributes:true,subtree:true,attributeFilter:['aria-pressed']}); // Only selection changes; GSAP's style writes are excluded.
  cards.addEventListener('scroll',follow,{passive:true});follow();
 }
 if(work)new MutationObserver(()=>{enter(work);}).observe(work,{attributes:true,attributeFilter:['data-focus']});
 if(inspector)new MutationObserver(()=>{enter(inspector.querySelector('.desk-manager-body'));}).observe(inspector,{attributes:true,attributeFilter:['data-kind']});
 addEventListener('nuc:market-update',()=>{if(!enabled())return;const tiles=[...document.querySelectorAll('#marketResults>article')];if(tiles.length)g.fromTo(tiles,{opacity:.35,y:10},{opacity:1,y:0,duration:.4,stagger:.025,ease:'power3.out',clearProps:'opacity,transform',overwrite:true});});
 document.addEventListener('click',e=>{if(e.target.closest('#deskMotion,[data-explore-motion],[data-modular-motion],[data-campaign-motion]'))queueMicrotask(()=>{paused=e.target.closest('button')?.getAttribute('aria-pressed')==='true';build();});});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)context?.revert();});
 reduced.addEventListener('change',()=>{if(reduced.matches){context?.revert();g.killTweensOf('.desk-selection-light,#deskWork,.desk-manager-body,#marketResults>article');}else build();});
 // Low amplitude depth for the existing pricing glass; it follows the pointer only.
 document.querySelectorAll('.price-stage').forEach(card=>{let r;card.addEventListener('pointermove',e=>{if(!enabled()||e.pointerType!=='mouse')return;r=card.getBoundingClientRect();g.to(card,{rotationY:(e.clientX-r.left-r.width/2)/r.width*3,rotationX:-(e.clientY-r.top-r.height/2)/r.height*3,transformPerspective:900,duration:.45,ease:'power2.out',overwrite:true});});card.addEventListener('pointerleave',()=>g.to(card,{rotationX:0,rotationY:0,duration:.5,ease:'power3.out',clearProps:'transform',overwrite:true}));});
})();
