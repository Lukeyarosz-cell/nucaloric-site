/* Historical candles for the exact pool and token. No reconstructed price history. */
(() => {
 const cache=new Map(),instances=new WeakMap(),address=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const usd=n=>new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:n<1?8:2,notation:n>=100000?'compact':'standard'}).format(n);
 const ns='http://www.w3.org/2000/svg',svgNode=(tag,attrs)=>{const n=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))n.setAttribute(key,String(value));return n;};
 function draw(area,rows,pair){
  const svg=svgNode('svg',{viewBox:'0 0 720 280',role:'img','aria-label':pair.baseToken.symbol+' historical USD price candles and volume'});
  const lo=Math.min(...rows.map(r=>r[3])),hi=Math.max(...rows.map(r=>r[2])),pad=(hi-lo||hi*.01||.000001)*.08,min=Math.max(0,lo-pad),max=hi+pad,y=v=>24+(max-v)/(max-min)*175;
  const first=rows[0][0],last=rows.at(-1)[0],interval=last-first||1,x=t=>28+(t-first)/interval*585,bar=Math.min(9,450/rows.length),vol=Math.max(...rows.map(r=>r[5]))||1;
  for(let i=0;i<4;i++){const v=min+(max-min)*i/3;svg.append(svgNode('path',{d:`M20 ${y(v)}H625`,class:'pool-chart-grid'}));const label=svgNode('text',{x:635,y:y(v)+4,class:'pool-chart-axis'});label.textContent=usd(v);svg.append(label);}
  for(const r of rows){const [t,o,h,l,c,v]=r,group=svgNode('g',{class:c>=o?'candle-up':'candle-down',tabindex:'0','aria-label':new Date(t*1000).toLocaleString()+': open '+usd(o)+', high '+usd(h)+', low '+usd(l)+', close '+usd(c)+', volume '+usd(v)});const title=svgNode('title',{});title.textContent=group.getAttribute('aria-label');group.append(title,svgNode('path',{d:`M${x(t)} ${y(h)}V${y(l)}`,class:'candle-wick'}),svgNode('rect',{x:x(t)-bar/2,y:Math.min(y(o),y(c)),width:bar,height:Math.max(1,Math.abs(y(o)-y(c))),class:'candle-body'}),svgNode('rect',{x:x(t)-bar/2,y:245-v/vol*29,width:bar,height:Math.max(1,v/vol*29),class:'candle-volume'}));svg.append(group);}
  for(const [t,anchor]of [[first,'start'],[last,'end']]){const label=svgNode('text',{x:x(t),y:270,'text-anchor':anchor,class:'pool-chart-axis'});label.textContent=new Date(t*1000).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});svg.append(label);}
  area.replaceChildren(svg);
 }
 function mount(host,pair){
  instances.get(host)?.destroy();if(!address.test(pair?.pairAddress)||!address.test(pair?.baseToken?.address))return;
  host.replaceChildren();host.classList.add('pool-chart');let request=0,controller,timeframe='hour',destroyed=false;
  const top=el('div','pool-chart-top'),label=el('span','','PRICE / USD'),buttons=el('div','pool-chart-controls'),area=el('div','pool-chart-area'),note=el('p','pool-chart-source');note.setAttribute('role','status');
  const external=el('a','','DEX Screener ↗');external.href='https://dexscreener.com/solana/'+encodeURIComponent(pair.pairAddress);external.target='_blank';external.rel='noopener noreferrer';
  for(const [key,text]of [['minute','15m'],['hour','1h'],['day','1d']]){const b=el('button','',text);b.type='button';b.dataset.interval=key;b.setAttribute('aria-label',text+' candles');b.onclick=()=>{timeframe=key;load();};buttons.append(b);}
  const retry=el('button','','↻');retry.type='button';retry.setAttribute('aria-label','Refresh price chart');retry.onclick=()=>load(true);buttons.append(retry);top.append(label,buttons,external);host.append(top,area,note);
  async function load(force=false){
   controller?.abort();controller=new AbortController();const currentController=controller,id=++request,key=pair.pairAddress+':'+pair.baseToken.address+':'+timeframe,previous=cache.get(key),aggregate=timeframe==='minute'?15:1;
   host.dataset.chartState='loading';area.replaceChildren(el('p','pool-chart-empty','Reading historical candles…'));note.textContent='GeckoTerminal · '+pair.baseToken.symbol+' · exact pool';buttons.querySelectorAll('[data-interval]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.interval===timeframe)));retry.disabled=true;
   const timer=setTimeout(()=>currentController.abort(),12000);
   try{
    let data;if(!force&&previous&&Date.now()-previous.at<60000)data=previous.data;else{
     const url=new URL('https://api.geckoterminal.com/api/v2/networks/solana/pools/'+encodeURIComponent(pair.pairAddress)+'/ohlcv/'+timeframe);for(const [k,v]of Object.entries({aggregate,limit:48,currency:'usd',token:pair.baseToken.address}))url.searchParams.set(k,v);
     const response=await fetch(url,{signal:currentController.signal});if(!response.ok)throw Error(response.status===429?'Chart provider is busy. Retry shortly.':'Historical candles are not available for this pool.');data=await response.json();
     if(![data.meta?.base?.address,data.meta?.quote?.address].includes(pair.baseToken.address))throw Error('Chart token metadata does not match this coin.');
    }
    if(id!==request||destroyed)return;const raw=data.data?.attributes?.ohlcv_list;if(!Array.isArray(raw))throw Error('The chart provider returned unreadable data.');
    const rows=raw.filter(r=>Array.isArray(r)&&r.length>=6&&r.slice(0,6).every(Number.isFinite)&&r[0]>0&&r.slice(1,6).every(v=>v>=0)&&r[2]>=Math.max(r[1],r[3],r[4])&&r[3]<=Math.min(r[1],r[2],r[4])).sort((a,b)=>a[0]-b[0]);if(!rows.length)throw Error('No historical trades were returned for this pool.');
    cache.set(key,{at:Date.now(),data});draw(area,rows,pair);host.dataset.chartState='ready';note.textContent=rows.length+' candles · GeckoTerminal · last candle '+new Date(rows.at(-1)[0]*1000).toLocaleString()+'. Gaps represent intervals without trades.';
   }catch(error){if(id!==request||destroyed)return;host.dataset.chartState='unavailable';area.replaceChildren(el('p','pool-chart-empty',error.name==='AbortError'?'The chart request timed out. Refresh to try again.':error.message));note.textContent='Pool details remain available below. Open DEX Screener for its full chart.';}
   finally{clearTimeout(timer);if(id===request&&!destroyed)retry.disabled=false;}
  }
  const instance={destroy(){destroyed=true;request++;controller?.abort();}};instances.set(host,instance);load();return instance;
 }
 window.NUC_POOL_CHART={mount};
})();
