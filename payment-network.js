/* Cables join the visible links to the account server at every viewport size. */
(() => {
 const root=document.querySelector('[data-payment-network]');if(!root)return;
 const diagram=root.querySelector('.payment-machine-diagram'),core=root.querySelector('.payment-core'),rack=root.querySelector('.payment-rack'),svg=root.querySelector('.payment-cables'),ns='http://www.w3.org/2000/svg';let frame;
 function draw(){
  const box=diagram.getBoundingClientRect(),phone=matchMedia('(max-width:700px)').matches,c=(phone?core:rack).getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);svg.replaceChildren();
  root.querySelectorAll('.payment-branch').forEach((node,index)=>{const n=node.getBoundingClientRect(),right=node.closest('.right'),x=phone?n.left-box.left+n.width/2:right?n.left-box.left:n.right-box.left,y=phone?n.top-box.top:n.top-box.top+n.height/2,cx=phone?c.left-box.left+c.width*(right?.7:.3):right?c.right-box.left:c.left-box.left,cy=phone?c.bottom-box.top:c.top-box.top+c.height*(.25+(index%3)*.25),d=phone?`M${cx} ${cy}C${cx} ${cy+35} ${x} ${y-30} ${x} ${y}`:`M${cx} ${cy}C${(cx+x)/2} ${cy} ${(cx+x)/2} ${y} ${x} ${y}`;for(const cls of ['payment-cable-base','payment-cable'+(right?' right':'')]){const path=document.createElementNS(ns,'path');path.setAttribute('d',d);path.setAttribute('class',cls);svg.append(path);}});
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);}
 new ResizeObserver(schedule).observe(diagram);document.fonts?.ready.then(schedule);schedule();
})();
