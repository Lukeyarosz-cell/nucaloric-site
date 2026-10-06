function drawPulseField(canvas){if(!canvas)return;canvas.dataset.dotField="signal";window.NUC_DOTS?.mount(canvas);}
const $=(s,c=document)=>c.querySelector(s);const $$=(s,c=document)=>[...c.querySelectorAll(s)];
const toast=$('#toast');
function showToast(msg){if(!toast)return;toast.textContent=msg;toast.classList.add('show');clearTimeout(window.__tt);window.__tt=setTimeout(()=>toast.classList.remove('show'),2400)}

/* restrained reveal */
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1});$$('.reveal').forEach(el=>io.observe(el));

/* shift-in / shift-out transition */
const transition=$('.page-transition');
try{
  if(document.documentElement.classList.contains('transition-arrival') && transition){
    sessionStorage.removeItem('nucTransition');
    requestAnimationFrame(()=>requestAnimationFrame(()=>transition.classList.add('exit')));
    setTimeout(()=>document.documentElement.classList.remove('transition-arrival'),780);
  }
}catch(e){}
$$('[data-transition]').forEach(link=>link.addEventListener('click',e=>{
  const href=link.getAttribute('href');
  if(link.matches('.coin-card')||!href||href.startsWith('#')||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  e.preventDefault();
  navigateWithTransition(href);
}));

/* wallet + X Pay prototype interactions */
const modal=$('#walletModal');
$$('[data-wallet]').forEach(b=>b.addEventListener('click',()=>{modal?.classList.add('open');modal?.setAttribute('aria-hidden','false');setTimeout(()=>$('button',modal||document)?.focus(),30)}));
$$('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>{modal?.classList.remove('open');modal?.setAttribute('aria-hidden','true')}));
$$('.wallet-choice').forEach(b=>b.addEventListener('click',()=>{modal?.classList.remove('open');showToast('Wallet connection is not enabled yet. See the implementation roadmap.')}));
$$('[data-xpay]').forEach(b=>b.addEventListener('click',()=>navigateWithTransition('roadmap.html#phase-6')));

/* logo fallback */
$$('img[data-fallback]').forEach(img=>{function fallback(){img.style.display='none';const p=img.parentElement;if(p&&!p.querySelector('.logo-fallback')){const mark=document.createElement('span');mark.className='logo-fallback';mark.textContent=img.dataset.fallback;mark.setAttribute('aria-label',img.alt||img.dataset.fallback);p.prepend(mark)}}img.addEventListener('error',fallback);if(img.complete&&!img.naturalWidth)fallback()});

/* generic responsive canvas helper */
function fitCanvas(canvas,ctx){const r=canvas.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));ctx.setTransform(d,0,0,d,0,0);return {w:r.width,h:r.height,d}}

/* homepage: slower wave, mostly white with a little more pale pink */
const heroCanvas=$('#heroWave');
if(heroCanvas){
  const ctx=heroCanvas.getContext('2d');let w=0,h=0,raf=0;const phase=1.74;const heroReduce=matchMedia('(prefers-reduced-motion:reduce)');let heroVisible=false;
  function size(){({w,h}=fitCanvas(heroCanvas,ctx))}
  function draw(){
    const t=heroReduce.matches?0:performance.now()/1000;ctx.clearRect(0,0,w,h);
    const gap=w<700?23:28;const cols=Math.ceil(w/gap)+3;const rows=Math.ceil(h/gap)+3;
    for(let c=-1;c<cols;c++){
      const x=c*gap+gap*.5;const centerBias=Math.pow(Math.abs(x/w-.5)*2,1.3);const waveA=Math.sin(x*.009+t*.07+phase)*h*.052;const waveB=Math.sin(x*.019-t*.045+1.1)*h*.018;const sideLift=centerBias*h*.095;const boundary=h*.69-waveA-waveB-sideLift;
      for(let r=0;r<rows;r++){
        const y=r*gap+gap*.5;if(y<boundary)continue;
        const depth=Math.min(1,(y-boundary)/Math.max(1,h-boundary));
        const seed=(c*17+r*31)%101;let fill='#ffffff';let alpha=.26+depth*.64;
        if(seed<10){fill='#ff91bd';alpha=.43+depth*.42}else if(seed<26){fill='#aaa5a3';alpha=.20+depth*.38}
        const radius=1.45+depth*3.55+((c+r)%7===0?.55:0);
        ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.globalAlpha=1;if(heroVisible&&!heroReduce.matches&&!document.hidden)raf=requestAnimationFrame(draw);
  }
  function restartHero(){cancelAnimationFrame(raf);if(!document.hidden&&(heroVisible||heroReduce.matches))draw()}
  size();draw();addEventListener('resize',()=>{size();restartHero()},{passive:true});document.addEventListener('visibilitychange',restartHero);heroReduce.addEventListener('change',restartHero);new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;restartHero()}).observe(heroCanvas);
}

/* little allocation matrix */
const miniDots=$('#miniDots');if(miniDots){for(let i=0;i<48;i++){const d=document.createElement('i');if(i%11===0||i%13===0)d.className='hot';else if(i%3===0)d.className='dark';miniDots.appendChild(d)}}

/* coin data shared by explorer and detail */
const coinData={
 nuzero:{name:'NUZERO',ticker:'NØ',pair:'NØ / SOL',price:'$0.0842',move:'+86.4%',liq:'$418K',holders:'7,841',score:94,status:'DISTRIBUTED',date:'SEP 28 / 2026',venue:'RAYDIUM',initLiq:'220 SOL',vest:'180 DAYS',lock:'LOCKED 180D',seed:3,allocation:{liq:42,community:25,rewards:18,creator:8,reserve:7},xImp:'1.8M',xRefs:'1,284',xPay:'YES'},
 vortex:{name:'VORTEX',ticker:'VX',pair:'VX / SOL',price:'$0.1310',move:'+143%',liq:'$704K',holders:'11,206',score:97,status:'HIGH SIGNAL',date:'SEP 30 / 2026',venue:'METEORA',initLiq:'310 SOL',vest:'365 DAYS',lock:'LOCKED 365D',seed:14,allocation:{liq:46,community:22,rewards:14,creator:6,reserve:12},xImp:'3.4M',xRefs:'2,118',xPay:'YES'},
 parallax:{name:'PARALLAX',ticker:'PX',pair:'PX / SOL',price:'$0.0196',move:'+24.1%',liq:'$192K',holders:'3,412',score:88,status:'BALANCED',date:'OCT 01 / 2026',venue:'RAYDIUM',initLiq:'145 SOL',vest:'180 DAYS',lock:'LOCKED 120D',seed:8,allocation:{liq:38,community:28,rewards:16,creator:9,reserve:9},xImp:'740K',xRefs:'612',xPay:'PENDING'},
 pinknode:{name:'PINKNODE',ticker:'PN',pair:'PN / SOL',price:'$0.0428',move:'+61.2%',liq:'$332K',holders:'5,984',score:91,status:'DISTRIBUTED',date:'OCT 02 / 2026',venue:'RAYDIUM',initLiq:'180 SOL',vest:'180 DAYS',lock:'LOCKED 180D',seed:30,allocation:{liq:41,community:24,rewards:17,creator:7,reserve:11},xImp:'1.2M',xRefs:'904',xPay:'YES'},
 mirage:{name:'MIRAGE',ticker:'MR',pair:'MR / SOL',price:'$0.0071',move:'-4.8%',liq:'$86K',holders:'2,114',score:77,status:'REVIEW',date:'OCT 03 / 2026',venue:'METEORA',initLiq:'72 SOL',vest:'90 DAYS',lock:'LOCKED 60D',seed:21,allocation:{liq:31,community:30,rewards:19,creator:12,reserve:8},xImp:'326K',xRefs:'241',xPay:'NO'}
};

/* explorer filters */
const coinGrid=$('#coinGrid');if(coinGrid){
  let active='ALL';const search=$('#coinSearch');
  function apply(){const q=(search?.value||'').trim().toLowerCase();$$('.coin-card',coinGrid).forEach(card=>{const tags=card.dataset.tags||'';const hay=card.dataset.search||'';const matchTag=active==='ALL'||tags.includes(active);const matchText=!q||hay.includes(q);card.hidden=!(matchTag&&matchText)});updateExploreResults()}
  $$('.filter-chip').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter-chip').forEach(x=>x.classList.remove('active'));btn.classList.add('active');active=btn.dataset.filter;apply()}));search?.addEventListener('input',apply);
}

/* explorer card art: report-like bubble / allocation maps */
$$('canvas[data-coin-art]').forEach(canvas=>{
  const key=canvas.dataset.coinArt;const d=coinData[key]||coinData.nuzero;const ctx=canvas.getContext('2d');
  function draw(){const {w,h}=fitCanvas(canvas,ctx);ctx.clearRect(0,0,w,h);const gap=15;for(let y=14,row=0;y<h-14;y+=gap*.86,row++){for(let x=14+(row%2?gap/2:0),col=0;x<w-14;x+=gap,col++){const dx=(x-w*(.46+.05*Math.sin(d.seed)))/(w*.38);const dy=(y-h*(.48+.03*Math.cos(d.seed)))/(h*.36);let z=Math.exp(-(dx*dx+dy*dy)*2.1);z+=.52*Math.exp(-Math.pow((x-w*.72)/(w*.18),2)-Math.pow((y-h*.66)/(h*.23),2));const noise=(Math.sin((col+1)*(d.seed+2)*.19)+Math.cos((row+2)*.61+d.seed))*.06;z+=noise;ctx.globalAlpha=.24+Math.min(1,z)*.7;ctx.fillStyle=z>.72?'#ff91bd':z>.38?'#ffffff':'#403e42';ctx.beginPath();ctx.arc(x,y,4.2,0,Math.PI*2);ctx.fill()}}ctx.globalAlpha=1}
  draw();addEventListener('resize',draw,{passive:true});
});

/* coin detail population */
const detailCanvas=$('#coinDetailCanvas');if(detailCanvas){
  const key=(new URLSearchParams(location.search).get('coin')||'nuzero').toLowerCase();const d=coinData[key]||coinData.nuzero;
  const set=(id,val)=>{const el=$(id);if(el)el.textContent=val};
  const coinIconMap={nuzero:'assets/tokens/nuzero.svg',vortex:'assets/tokens/vortex.svg',parallax:'assets/tokens/parallax.svg',pinknode:'assets/tokens/pinknode.svg',mirage:'assets/tokens/mirage.svg'};const avatarIcon=$('#coinAvatarIcon');if(avatarIcon){avatarIcon.src=coinIconMap[key]||coinIconMap.nuzero;avatarIcon.alt=`${d.ticker} token icon`;}set('#coinPair',d.pair);set('#coinName',d.name);set('#coinPrice',d.price);set('#coinMove',d.move);set('#coinScore',d.score);set('#coinHolders',d.holders);set('#coinStatus',d.status);set('#launchDate',d.date);set('#allocationScore',`${d.score} / 100`);set('#coinVenue',d.venue);set('#coinInitLiq',d.initLiq);set('#coinVest',d.vest);set('#coinLock',d.lock);set('#allocLiq',`${d.allocation.liq}%`);set('#allocCommunity',`${d.allocation.community}%`);set('#allocRewards',`${d.allocation.rewards}%`);set('#allocCreator',`${d.allocation.creator}%`);set('#xImp',d.xImp);set('#xRefs',d.xRefs);set('#xPay',d.xPay);document.title=`NUCALORIC — ${d.name}`;
  const timeline=$('#launchTimeline');if(timeline){const items=[['01','STRUCTURE LOCKED',`Supply, authorities and creator vesting finalized. Creator allocation held to ${d.allocation.creator}%.`,'PASS'],['02','AI MODEL RUN',`Allocation model scored ${d.score}/100 with ${d.allocation.liq}% targeted to liquidity resources.`,'MODEL'],['03','X DISTRIBUTION',`Campaign identity linked to verified referral attribution and social launch graph.`,'VERIFIED'],['04','SOLANA DEPLOY',`Token deployment signed through the connected wallet and recorded on Solana.`,'ONCHAIN'],['05',`${d.venue} LIQUIDITY`,`Initial liquidity opened at ${d.initLiq}; Jupiter routing exposed post-launch.`,'LIVE'],['06','POST-LAUNCH MONITOR',`Holder concentration, depth and distribution continue to update in Explore.`,'ACTIVE']];timeline.innerHTML=items.map(x=>`<div class="timeline-row"><div class="num">${x[0]}</div><div><b>${x[1]}</b><p>${x[2]}</p></div><em>${x[3]}</em></div>`).join('')}
  const ctx=detailCanvas.getContext('2d');function drawDetail(){const {w,h}=fitCanvas(detailCanvas,ctx);ctx.clearRect(0,0,w,h);const nodes=[];for(let i=0;i<118;i++){const a=i*.77+d.seed*.13;const ring=30+(i%14)*12+(Math.sin(i*1.23+d.seed)*6);nodes.push({x:w*.5+Math.cos(a)*ring,y:h*.52+Math.sin(a)*ring*.58,r:2.2+(i%13===0?8:i%6===0?3.5:0),g:i%17===0?2:i%4===0?1:0})}ctx.strokeStyle='#27272b';ctx.globalAlpha=.6;for(let i=0;i<nodes.length;i+=8){for(let j=i+1;j<Math.min(nodes.length,i+4);j++){ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.stroke()}}ctx.globalAlpha=1;nodes.forEach(n=>{ctx.fillStyle=n.g===2?'#ff91bd':n.g===1?'#ffffff':'#555257';ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill()})}drawDetail();addEventListener('resize',drawDetail,{passive:true});
  const alloc=$('#coinAllocCanvas');if(alloc){const ac=alloc.getContext('2d');function drawAlloc(){const {w,h}=fitCanvas(alloc,ac);ac.clearRect(0,0,w,h);const gap=16;const shares=[['liq',d.allocation.liq,'#ff91bd'],['community',d.allocation.community,'#ffffff'],['rewards',d.allocation.rewards,'#9b9695'],['creator',d.allocation.creator,'#605d61'],['reserve',d.allocation.reserve,'#343337']];const total=shares.reduce((a,b)=>a+b[1],0);let stops=[],run=0;shares.forEach(s=>{run+=s[1]/total;stops.push([run,s[2]])});const cols=Math.floor(w/gap),rows=Math.floor(h/(gap*.87));for(let rr=0;rr<rows;rr++){for(let cc=0;cc<cols;cc++){const x=10+cc*gap+(rr%2?gap/2:0),y=10+rr*gap*.87;if(x>w-8||y>h-8)continue;const p=(rr*cols+cc)/(rows*cols);const col=(stops.find(s=>p<=s[0])||stops.at(-1))[1];ac.fillStyle=col;ac.beginPath();ac.arc(x,y,4.4,0,Math.PI*2);ac.fill()}}}drawAlloc();addEventListener('resize',drawAlloc,{passive:true})}
}

/* launch blueprint form */
$('#previewLaunch')?.addEventListener('click',()=>{const ticker=$('#launchTicker')?.value||'—';const venue=$('#launchVenue')?.value||'RAYDIUM';if($('#bpTicker'))$('#bpTicker').textContent=ticker;if($('#bpVenue'))$('#bpVenue').textContent=venue.toUpperCase();showToast('Blueprint refreshed — no transaction submitted')});

/* resource bars */
$$('.resource-bars').forEach(box=>{if(box.children.length)return;const vals=[31,36,42,48,45,54,63,70,76,73,68,64,59,54,50,47,51,57,66,75,82,77,69,61,54,47,43,46,52,60,68,76,81,74,66,59,51,45,40,44,51,58,65,72,67,59,52,45,39,36];vals.forEach((v,i)=>{const el=document.createElement('i');el.style.setProperty('--h',`${v}%`);el.style.setProperty('--hot',`${Math.max(8,v*(i%9===0?.56:.25))}%`);box.appendChild(el)})});

/* optimizer */
const controls={liq:$('#liq'),creator:$('#creator'),lock:$('#lock'),rewards:$('#rewards'),reserve:$('#reserve')};
function drawAllocation(v={liq:220,creator:8,lock:180,rewards:12,reserve:10}){const c=$('#allocMap');if(!c)return;const ctx=c.getContext('2d');const {w,h}=fitCanvas(c,ctx);ctx.clearRect(0,0,w,h);const gap=16,cols=Math.floor(w/gap),rows=Math.floor(h/(gap*.87));const liqShare=Math.min(.54,.25+v.liq/1150),creatorShare=.07+v.creator/170,rewardShare=.1+v.rewards/145,reserveShare=.1+v.reserve/145;for(let rr=0;rr<rows;rr++){for(let cc=0;cc<cols;cc++){const p=(rr*cols+cc)/(rows*cols),x=10+cc*gap+(rr%2?gap/2:0),y=10+rr*gap*.87;if(x>w-8||y>h-8)continue;let col='#363539';if(p<liqShare)col='#ff91bd';else if(p<liqShare+creatorShare)col='#ffffff';else if(p<liqShare+creatorShare+rewardShare)col='#9a9594';else if(p<liqShare+creatorShare+rewardShare+reserveShare)col='#5d5a5e';ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,4.4,0,Math.PI*2);ctx.fill()}}}
function optimizer(){if(!controls.liq)return;const liq=+controls.liq.value,creator=+controls.creator.value,lock=+controls.lock.value,rewards=+controls.rewards.value,reserve=+controls.reserve.value;$('#liqOut').textContent=`${liq} SOL`;$('#creatorOut').textContent=`${creator}%`;$('#lockOut').textContent=`${lock} DAYS`;$('#rewardsOut').textContent=`${rewards}%`;$('#reserveOut').textContent=`${reserve}%`;let score=Math.round(82+Math.min(8,liq/55)+Math.min(5,lock/90)-Math.max(0,creator-10)*.8-Math.max(0,rewards-18)*.2);score=Math.max(58,Math.min(98,score));$('#scoreValue').textContent=score;$('#scoreText').textContent=score>91?'STRUCTURE IS STRONG. EXECUTION RISK IS LOW.':score>82?'STRUCTURE IS HEALTHY. REVIEW CONCENTRATION BEFORE LAUNCH.':'MODEL DETECTS FRAGILITY. INCREASE DEPTH OR LOWER CREATOR EXPOSURE.';drawAllocation({liq,creator,lock,rewards,reserve})}
Object.values(controls).forEach(c=>c?.addEventListener('input',optimizer));optimizer();$('#runSimulation')?.addEventListener('click',()=>{optimizer();showToast('Simulation refreshed — no transaction submitted')});

/* rewards visual */
const rewardCanvas=$('#rewardCanvas');if(rewardCanvas){const ctx=rewardCanvas.getContext('2d');let w,h,raf;function rs(){({w,h}=fitCanvas(rewardCanvas,ctx))}function ellipse(cx,cy,rx,ry,phase,t,offset=0){for(let ring=0;ring<13;ring++){const n=40+ring*4;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;const wig=Math.sin(a*3+t*.12+phase)*2;const x=cx+Math.cos(a)*(rx-ring*5)+offset;const y=cy+Math.sin(a)*(ry-ring*2.2)+wig;ctx.fillStyle=(i+ring)%16===0?'#ff91bd':'#ffffff';ctx.globalAlpha=.2+(ring/13)*.56;ctx.beginPath();ctx.arc(x,y,1.25+(ring%3===0?.55:0),0,Math.PI*2);ctx.fill()}}}function dr(){const t=performance.now()/1000;ctx.clearRect(0,0,w,h);ellipse(w*.52,h*.28,w*.29,h*.095,0,t);ellipse(w*.46,h*.52,w*.31,h*.088,1.4,t,-6);ellipse(w*.50,h*.75,w*.28,h*.095,2.2,t,4);ctx.globalAlpha=1;raf=requestAnimationFrame(dr)}rs();dr();addEventListener('resize',rs,{passive:true})}
$('#copyReferral')?.addEventListener('click',async()=>{const t=$('#referralCode')?.textContent||'';try{await navigator.clipboard.writeText(t);showToast('Referral code copied')}catch{showToast(t)}});

/* v7 registry filters + live map */
let registryCategory='all';
const registrySearch=$('#registrySearch');
if(registrySearch){
  let regFilter='all';
  const cards=$$('.cap-card');
  const groups=$$('.registry-group');
  const applyRegistry=()=>{
    const q=registrySearch.value.trim().toLowerCase();
    cards.forEach(card=>{
      const status=card.dataset.capStatus||'';
      const hay=card.dataset.capSearch||'';
      const okStatus=regFilter==='all'||status===regFilter;
      const okSearch=!q||hay.includes(q);
      const okCategory=registryCategory==='all'||card.closest('.registry-group')?.id===registryCategory;
      card.hidden=!(okStatus&&okSearch&&okCategory);
    });
    groups.forEach(group=>{
      const any=$$('.cap-card',group).some(c=>!c.hidden);
      group.style.display=any?'block':'none';
    });
  };
  $$('[data-reg-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    $$('[data-reg-filter]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');regFilter=btn.dataset.regFilter;applyRegistry();
  }));
  registrySearch.addEventListener('input',applyRegistry);
}
const registryLiveMap=$('#registryLiveMap');
if(registryLiveMap){
  const liveSet=new Set([0,1,2,4,5,6,7,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24,25,27,28,29,30,31,32,33,34,35,36,37,38,40,41,42,43,45,46,47,48]);
  for(let i=0;i<112;i++){
    const dot=document.createElement('i');
    const mapped=i%49;
    if(liveSet.has(mapped))dot.classList.add('live');
    if([6,17,31,43,64,82,97].includes(i))dot.classList.add('hot');
    dot.style.transform=`scale(${.5+((Math.sin(i*1.73)+1)/2)*.75})`;
    registryLiveMap.appendChild(dot);
  }
}

/* subtle public-mind wake counter on coin detail */
const mindClock=$('#mindClock');
if(mindClock){
  let wake=1842;
  setInterval(()=>{wake+=1;mindClock.textContent=`WAKE / ${wake}`},9000);
}


/* v12 — global product interface */
const tokenIcons={nuzero:'assets/tokens/nuzero.svg',vortex:'assets/tokens/vortex.svg',parallax:'assets/tokens/parallax.svg',pinknode:'assets/tokens/pinknode.svg',mirage:'assets/tokens/mirage.svg'};
const tokenOrder=['nuzero','vortex','parallax','pinknode','mirage'];
function getWatchlist(){try{const stored=JSON.parse(localStorage.getItem('nucWatchlist')||'[]');return Array.isArray(stored)?[...new Set(stored.filter(k=>Object.hasOwn(coinData,k)))]:[]}catch{return []}}
function setWatchlist(list){try{localStorage.setItem('nucWatchlist',JSON.stringify([...new Set(list)]))}catch(e){};renderAccountWatchlist();renderDashboardWatchlist();refreshWatchButtons()}
function toggleWatch(key){const list=getWatchlist();const next=list.includes(key)?list.filter(x=>x!==key):[...list,key];setWatchlist(next);showToast(list.includes(key)?'Removed from watchlist':'Added to watchlist')}
function parseCoinKey(card){const href=card?.getAttribute('href')||'';const m=href.match(/coin=([^&]+)/);return m?m[1]:'nuzero'}
function coinMoveNumber(d){return Number(String(d.move).replace(/[^0-9+\-.]/g,''))||0}
function coinHoldersNumber(d){return Number(String(d.holders).replace(/,/g,''))||0}
function coinLiquidityNumber(d){return Number(String(d.liq).replace(/[$K,]/g,''))||0}

/* inject global command + account controls */
const navActions=$('.nav-actions');
if(navActions){
  const command=document.createElement('button');command.className='command-btn';command.innerHTML='<span>SEARCH</span><kbd>⌘ K</kbd>';command.setAttribute('aria-label','Open command palette');navActions.prepend(command);
  const account=document.createElement('a');account.href='dashboard.html';account.className='account-btn';account.innerHTML='<i></i><span>ACCOUNT</span>';account.setAttribute('aria-label','Open your dashboard');navActions.insertBefore(account,$('.wallet-btn',navActions));
}

const scrim=document.createElement('div');scrim.className='drawer-scrim';document.body.appendChild(scrim);
const commandOverlay=document.createElement('div');commandOverlay.className='command-overlay';commandOverlay.innerHTML=`<div class="command-panel"><div class="command-search-row"><span>⌕</span><input aria-label="Search coins, pages, and capabilities" id="commandSearch" autocomplete="off" placeholder="Search coin, page, capability, launch…"><kbd>ESC</kbd></div><div class="command-results" id="commandResults"></div><div class="command-foot"><span>↑↓ NAVIGATE · ENTER OPEN</span><span>NUCALORIC COMMAND</span></div></div>`;document.body.appendChild(commandOverlay);
const accountDrawer=document.createElement('aside');accountDrawer.className='account-drawer';accountDrawer.innerHTML=`<div class="drawer-head"><span>YOUR ACCOUNT</span><button class="drawer-close" data-drawer-close>×</button></div><div class="account-profile"><div><b id="accountWalletLabel">YOUR WORKSPACE</b><span>Plans, tools, and watched coins.</span></div></div><div class="account-grid"><a href="dashboard.html" data-transition><span>YOUR DASHBOARD</span><b>OPEN ↗</b></a><a href="hosting.html" data-transition><span>WORKSPACE & CLI</span><b>SET UP ↗</b></a></div><div class="drawer-section"><div class="drawer-section-head"><span>WATCHLIST</span><a href="explorer.html" data-transition>EXPLORE</a></div><div id="accountWatchlist"></div></div>`;document.body.appendChild(accountDrawer);
const quickDrawer=document.createElement('aside');quickDrawer.className='quick-drawer';quickDrawer.innerHTML=`<div class="drawer-head"><span>QUICK VIEW / COIN</span><button class="drawer-close" data-drawer-close>×</button></div><div id="quickDrawerContent"></div>`;document.body.appendChild(quickDrawer);
const capDrawer=document.createElement('aside');capDrawer.className='capability-drawer';capDrawer.innerHTML=`<div class="drawer-head"><span>CAPABILITY / REGISTRY</span><button class="drawer-close" data-drawer-close>×</button></div><div id="capabilityDrawerContent"></div>`;document.body.appendChild(capDrawer);

let drawerReturnFocus=null;
function closeDrawers(){const wasOpen=[accountDrawer,quickDrawer,capDrawer].some(el=>el.classList.contains('open'));[accountDrawer,quickDrawer,capDrawer].forEach(el=>{el.classList.remove('open');el.inert=true});scrim.classList.remove('open');if(wasOpen&&drawerReturnFocus?.isConnected)drawerReturnFocus.focus({preventScroll:true})}
function openDrawer(el){closeDrawers();drawerReturnFocus=document.activeElement;el.inert=false;el.classList.add('open');scrim.classList.add('open');setTimeout(()=>$('button',el)?.focus({preventScroll:true}),30)}
scrim.addEventListener('click',closeDrawers);$$('[data-drawer-close]').forEach(b=>b.addEventListener('click',closeDrawers));
$('.account-btn')?.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();if(location.pathname.endsWith('/dashboard.html')){scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});return}navigateWithTransition('dashboard.html')});

const commands=[
  ['PAGE','Service status','Provider incidents and NUCALORIC connector health','status.html'],
  ['PAGE','Implementation roadmap','API access, integration dependencies and acceptance gates','roadmap.html'],
  ['PAGE','Project Studio','Creative project kits, capability shortlist, evidence, and exportable briefs','studio.html'],
  ['PAGE','Project hosting','Paymenter hosting, developer workspaces, CLI and self-hosted models','hosting.html'],
  ['PAGE','Explore coins','Market browser, watchlist and compare','explorer.html'],['PAGE','Build a coin','Guided genesis builder with AI recommendations','launchpad.html'],['PAGE','Personal dashboard','Holdings, rewards, watchlist and launches','dashboard.html'],['PAGE','Capability registry','49 example capabilities, project kits, and a useful toolset','registry.html'],['PAGE','Rewards','Missions, referrals and X Pay rewards','rewards.html'],['PAGE','AI optimizer','Allocation and launch structure model','optimizer.html'],['PAGE','Ecosystem','Wallets, X Pay, routing and integrations','ecosystem.html'],
  ...tokenOrder.map(k=>['COIN',coinData[k].name,`${coinData[k].ticker} · AI ${coinData[k].score} · ${coinData[k].holders} holders`,`coin.html?coin=${k}`]),
  ['CAPABILITY','Treasury','14 live tools · reserve, swaps, perps, buybacks','registry.html#treasury'],['CAPABILITY','Mind','Public reasoning, memory, missions and strategy','registry.html#mind'],['CAPABILITY','Rewards','Airdrops, recurring rewards, jackpots and vesting','registry.html#rewards']
];
function renderCommands(q=''){
  const root=$('#commandResults');if(!root)return;const query=q.trim().toLowerCase();const found=commands.filter(c=>!query||`${c[1]} ${c[2]} ${c[0]}`.toLowerCase().includes(query));
  let last='';root.innerHTML=found.map((c,i)=>{const group=c[0]!==last?`<div class="command-group-label">${last=c[0]}</div>`:'';return `${group}<button class="command-item${i===0?' active':''}" data-command-href="${c[3]}"><span class="cmd-icon">${c[0].slice(0,3)}</span><span><b>${c[1]}</b><small>${c[2]}</small></span><em>OPEN →</em></button>`}).join('')||'<div class="command-group-label">NO MATCHES</div>';
  $$('[data-command-href]',root).forEach(b=>b.addEventListener('click',()=>navigateWithTransition(b.dataset.commandHref)));
}
let commandReturnFocus=null;
function openCommand(){commandReturnFocus=document.activeElement;commandOverlay.classList.add('open');$('#commandSearch').setAttribute('aria-expanded','true');renderCommands('');setTimeout(()=>$('#commandSearch')?.focus(),20)}
function closeCommand(){const wasOpen=commandOverlay.classList.contains('open');commandOverlay.classList.remove('open');$('#commandSearch').setAttribute('aria-expanded','false');if(wasOpen&&commandReturnFocus?.isConnected)commandReturnFocus.focus({preventScroll:true})}
function navigateWithTransition(href){closeCommand();closeDrawers();if(!href)return;const url=new URL(href,location.href);if(href.startsWith('#')||(url.pathname===location.pathname&&url.search===location.search&&url.hash)){location.href=url.href;return}if(matchMedia('(prefers-reduced-motion:reduce)').matches||!transition){location.href=url.href;return}if(transition.classList.contains('enter'))return;transition.classList.remove('exit');transition.classList.add('enter');const label=document.querySelector('[data-transition-label]');if(label)label.textContent=({ 'index.html':'MAKE SOMETHING REAL.', 'registry.html':'FIND YOUR NEXT CAPABILITY.', 'studio.html':'GIVE YOUR IDEA A SHAPE.', 'launchpad.html':'BUILD THE NEXT CHAPTER.', 'hosting.html':'A HOME FOR YOUR PROJECT.' })[url.pathname.split('/').pop()]||'KEEP BUILDING.';if(url.origin===location.origin){const preload=document.createElement('link');preload.rel='prefetch';preload.href=url.href;document.head.appendChild(preload)}setTimeout(()=>{try{sessionStorage.setItem('nucTransition','1')}catch(e){}location.href=url.href},560)}
$('.command-btn')?.addEventListener('click',openCommand);commandOverlay.addEventListener('click',e=>{if(e.target===commandOverlay)closeCommand()});
$('#commandSearch')?.addEventListener('input',e=>renderCommands(e.target.value));
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();commandOverlay.classList.contains('open')?closeCommand():openCommand()}if(e.key==='Escape'){closeCommand();closeDrawers()}});

function getLiveWatchlist(){try{const value=JSON.parse(localStorage.getItem('nucLiveWatchlist')||'[]');return Array.isArray(value)?value.filter(p=>p&&/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(p.pair)&&typeof p.name==='string').slice(0,20):[]}catch{return []}}
function appendLiveWatchlist(root,limit){for(const pool of getLiveWatchlist().slice(0,limit)){const link=document.createElement('a');link.className=root.id==='dashboardWatchlist'?'dash-watch-item':'drawer-watch-row';link.href='coin.html?pair='+encodeURIComponent(pool.pair);const text=document.createElement('span'),title=document.createElement('b'),label=document.createElement('small'),action=document.createElement('em');title.textContent=pool.name;label.textContent='SOLANA / SAVED LIVE POOL';action.textContent='OPEN ↗';text.append(title,label);link.append(text,action);root.append(link)}}
function renderAccountWatchlist(){const root=$('#accountWatchlist');if(!root)return;root.replaceChildren();appendLiveWatchlist(root,5);if(!root.children.length){const message=document.createElement('div');message.className='drawer-watch-row';message.textContent='Save a live pool from Explore to follow it here.';root.append(message)}}
renderAccountWatchlist();
function updateWalletUI(){const btn=$('.wallet-btn');if(btn){btn.textContent='CONNECT';btn.classList.remove('connected')}const label=$('#accountWalletLabel');if(label)label.textContent='WALLET NOT CONNECTED'}
updateWalletUI();addEventListener('nucWalletChange',updateWalletUI);

/* Explore product behavior: watchlist, quick view, compare, sort, compact mode */
let compareList=[];
const compareTray=document.createElement('div');compareTray.className='compare-tray';compareTray.innerHTML='<div class="compare-items" id="compareItems"></div><button class="compare-run" id="compareRun">COMPARE</button>';document.body.appendChild(compareTray);
const compareModal=document.createElement('div');compareModal.className='compare-modal';compareModal.innerHTML='<div class="compare-modal-head"><h2>COMPARE / MARKET STRUCTURE</h2><button class="drawer-close" id="compareClose">×</button></div><div class="compare-table-wrap" id="compareTableWrap"></div>';document.body.appendChild(compareModal);
$('#compareClose')?.addEventListener('click',()=>compareModal.classList.remove('open'));
function refreshWatchButtons(){const list=getWatchlist();$$('[data-watch-key]').forEach(b=>{const on=list.includes(b.dataset.watchKey);b.classList.toggle('active',on);b.textContent=on?'★':'☆'});const coinWatch=$('#coinWatch');if(coinWatch){const k=(new URLSearchParams(location.search).get('coin')||'nuzero').toLowerCase();const on=list.includes(k);coinWatch.classList.toggle('active',on);coinWatch.textContent=on?'★ WATCHING':'☆ WATCH'}}
function renderCompareTray(){const root=$('#compareItems');if(root)root.innerHTML=compareList.map(k=>`<span class="compare-chip"><img src="${tokenIcons[k]}" alt="">${coinData[k].ticker}<button data-remove-compare="${k}">×</button></span>`).join('');compareTray.classList.toggle('show',compareList.length>0);$$('[data-remove-compare]').forEach(b=>b.addEventListener('click',()=>{compareList=compareList.filter(k=>k!==b.dataset.removeCompare);renderCompareTray();syncCompareButtons()}))}
function syncCompareButtons(){$$('[data-compare-key]').forEach(b=>b.classList.toggle('active',compareList.includes(b.dataset.compareKey)))}
function toggleCompare(k){if(compareList.includes(k))compareList=compareList.filter(x=>x!==k);else if(compareList.length<4)compareList.push(k);else return showToast('Compare supports up to 4 coins');renderCompareTray();syncCompareButtons()}
function showCompare(){if(compareList.length<2)return showToast('Choose at least 2 coins');const rows=[['AI SCORE',d=>d.score],['24H',d=>d.move],['LIQUIDITY',d=>d.liq],['HOLDERS',d=>d.holders],['VENUE',d=>d.venue],['CREATOR',d=>`${d.allocation.creator}%`],['LIQUIDITY ALLOC.',d=>`${d.allocation.liq}%`],['REWARDS',d=>`${d.allocation.rewards}%`],['LP LOCK',d=>d.lock],['X IMPRESSIONS',d=>d.xImp],['X PAY',d=>d.xPay]];$('#compareTableWrap').innerHTML=`<table class="compare-table"><thead><tr><th>METRIC</th>${compareList.map(k=>`<th>${coinData[k].name}<br><small>${coinData[k].ticker}</small></th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td>${compareList.map(k=>`<td class="${r[0]==='24H'&&coinMoveNumber(coinData[k])>0?'positive':''}">${r[1](coinData[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;compareModal.classList.add('open')}
$('#compareRun')?.addEventListener('click',showCompare);

$$('.coin-card').forEach(card=>{
  const key=parseCoinKey(card);const actions=document.createElement('div');actions.className='coin-card-actions';actions.innerHTML=`<button class="coin-mini-action" data-watch-key="${key}" aria-label="Watch coin">☆</button><button class="coin-mini-action" data-compare-key="${key}" aria-label="Compare coin">＋</button>`;card.appendChild(actions);
  card.addEventListener('click',e=>{if(e.target.closest('.coin-card-actions')||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();openQuickView(key)});
});
$$('[data-watch-key]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleWatch(b.dataset.watchKey)}));
$$('[data-compare-key]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleCompare(b.dataset.compareKey)}));
refreshWatchButtons();
function openQuickView(key){const d=coinData[key]||coinData.nuzero;const watched=getWatchlist().includes(key);$('#quickDrawerContent').innerHTML=`<div class="quick-token-head"><img src="${tokenIcons[key]}" alt=""><div><span>${d.ticker} / SOL</span><h2>${d.name}</h2></div></div><div class="quick-price"><div><span>PRICE</span><b>${d.price}</b></div><div><span>24H</span><b class="${coinMoveNumber(d)<0?'down':'up'}">${d.move}</b></div></div><div class="quick-matrix"><canvas id="quickMatrixCanvas"></canvas></div><div class="quick-stat-grid"><div><span>AI SCORE</span><b>${d.score} / 100</b></div><div><span>HOLDERS</span><b>${d.holders}</b></div><div><span>LIQUIDITY</span><b>${d.liq}</b></div><div><span>VENUE</span><b>${d.venue}</b></div><div><span>CREATOR</span><b>${d.allocation.creator}%</b></div><div><span>X PAY</span><b>${d.xPay}</b></div></div><div class="quick-actions"><button class="ghost-btn" id="quickWatch">${watched?'★ WATCHING':'☆ WATCH'}</button><button class="ghost-btn" id="quickCompare">＋ COMPARE</button><button class="btn full" id="quickFull">OPEN FULL PROFILE →</button></div>`;openDrawer(quickDrawer);setTimeout(()=>drawPulseField($('#quickMatrixCanvas'),true,d.seed),20);$('#quickWatch').onclick=()=>{toggleWatch(key);openQuickView(key)};$('#quickCompare').onclick=()=>{toggleCompare(key);showToast('Added to compare')};$('#quickFull').onclick=()=>navigateWithTransition(`coin.html?coin=${key}`)}

const coinSort=$('#coinSort');
function sortExplore(){const grid=$('#coinGrid');if(!grid||!coinSort)return;const mode=coinSort.value;const cards=$$('.coin-card',grid);cards.sort((a,b)=>{const da=coinData[parseCoinKey(a)],db=coinData[parseCoinKey(b)];if(mode==='move')return coinMoveNumber(db)-coinMoveNumber(da);if(mode==='holders')return coinHoldersNumber(db)-coinHoldersNumber(da);if(mode==='liquidity')return coinLiquidityNumber(db)-coinLiquidityNumber(da);return db.score-da.score});cards.forEach(c=>grid.appendChild(c))}
coinSort?.addEventListener('change',sortExplore);sortExplore();
$$('.view-btn').forEach(b=>b.addEventListener('click',()=>{$$('.view-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#coinGrid')?.classList.toggle('compact',b.dataset.view==='compact')}));

/* Coin detail tabs + actions + meaningful holder matrix */
const coinTabs=$('#coinTabs');if(coinTabs){$$('[data-coin-tab]',coinTabs).forEach(b=>b.addEventListener('click',()=>{$$('[data-coin-tab]',coinTabs).forEach(x=>x.classList.remove('active'));$$('[data-coin-panel]').forEach(p=>p.classList.remove('active'));b.classList.add('active');$(`[data-coin-panel="${b.dataset.coinTab}"]`)?.classList.add('active')}))}
const coinKey=(new URLSearchParams(location.search).get('coin')||'nuzero').toLowerCase();
if($('#coinVenueTop')&&coinData[coinKey])$('#coinVenueTop').textContent=coinData[coinKey].venue;
$('#coinWatch')?.addEventListener('click',()=>toggleWatch(coinKey));
$('#coinCompare')?.addEventListener('click',()=>{toggleCompare(coinKey);showToast('Coin added to compare tray')});
const activityFeed=$('#activityFeed');if(activityFeed)activityFeed.innerHTML=[['NOW','HOLDERS','+12 wallets since last wake'],['12M','MIND','market observation completed'],['31M','X','campaign post published'],['1H','TREASURY','reserve policy checked'],['3H','REWARDS','snapshot finalized']].map(x=>`<div><time>${x[0]}</time><i></i><span><b>${x[1]}</b>${x[2]}</span></div>`).join('');
function drawHolderMap(){const c=$('#holderMatrixCanvas');if(!c)return;const ctx=c.getContext('2d');const d=coinData[coinKey]||coinData.nuzero;let w=0,h=0;function draw(){({w,h}=fitCanvas(c,ctx));ctx.clearRect(0,0,w,h);const nodes=[];for(let i=0;i<180;i++){const cluster=i%5;const angle=(i*1.73+d.seed)*.72;const baseR=28+(i%17)*9;const cx=[.28,.53,.72,.44,.62][cluster]*w,cy=[.38,.31,.55,.68,.76][cluster]*h;nodes.push({x:cx+Math.cos(angle)*baseR*.55,y:cy+Math.sin(angle)*baseR*.36,r:2+(i%29===0?8:i%11===0?4:0),kind:i%29===0?'top':i%4===0?'regular':'passive'})}ctx.strokeStyle='#27242b';ctx.globalAlpha=.45;for(let i=0;i<nodes.length;i+=12){for(let j=i+1;j<Math.min(i+5,nodes.length);j++){ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.stroke()}}ctx.globalAlpha=1;nodes.forEach(n=>{ctx.fillStyle=n.kind==='top'?'#ff91bd':n.kind==='regular'?'#ffffff':'#565259';ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill()})}draw();addEventListener('resize',draw,{passive:true})}
drawHolderMap();

/* dashboard */
function renderDashboardWatchlist(){const root=$('#dashboardWatchlist');if(!root)return;const list=getLiveWatchlist();$('#dashboardWatchCount')&&($('#dashboardWatchCount').textContent=list.length);root.replaceChildren();appendLiveWatchlist(root,3);if(!list.length)root.innerHTML='<div class="watchlist-empty"><b>Your watchlist starts here.</b><p>Save live Solana pools from Explore to follow them here.</p><a href="explorer.html">EXPLORE POOLS ↗</a></div>'}
renderDashboardWatchlist();
$$('.claim-stack button').forEach(b=>b.addEventListener('click',()=>{b.textContent='CLAIMED ✓';b.disabled=true;showToast('Reward marked claimed in prototype')}));

/* Launch studio: draft persistence and complete blueprint review. */
let builderStep=1;
const stageNames=['IDENTITY','STRUCTURE','LIQUIDITY','AI OPTIMIZE','DISTRIBUTION','MIND','REVIEW','BLUEPRINT'];
const launchFieldIds=['launchName','launchTicker','launchThesis','launchSupply','launchCreator','launchVest','launchLiquidity','launchVenue','launchLock','launchRewards'];
function launchBlueprint(){return {version:1,prototype:true,fields:Object.fromEntries(launchFieldIds.map(id=>[id,$(`#${id}`)?.value||''])),distribution:$$('.dist-card').map(b=>b.classList.contains('selected')),mind:$$('.mind-select').map(b=>b.classList.contains('selected')),step:builderStep}}
function saveLaunchDraft(){if(!$('.launch-builder-shell'))return;try{localStorage.setItem('nucLaunchDraft',JSON.stringify(launchBlueprint()));$('#draftStatus').textContent='DRAFT SAVED / THIS BROWSER'}catch{$('#draftStatus').textContent='DRAFT IN MEMORY / STORAGE UNAVAILABLE'}}
function restoreLaunchDraft(){if(!$('.launch-builder-shell'))return;try{const draft=JSON.parse(localStorage.getItem('nucLaunchDraft')||'null');if(!draft||draft.version!==1)return;launchFieldIds.forEach(id=>{if(typeof draft.fields?.[id]==='string'&&$(`#${id}`))$(`#${id}`).value=draft.fields[id]});['distribution','mind'].forEach((key,i)=>{const buttons=$$(i?'.mind-select':'.dist-card');if(Array.isArray(draft[key]))buttons.forEach((b,j)=>b.classList.toggle('selected',draft[key][j]===true))});if(Number.isInteger(draft.step)&&draft.step>=1&&draft.step<=8)builderStep=draft.step;$('#draftStatus').textContent='DRAFT RESTORED / THIS BROWSER'}catch{}}
function updateBuilder(){if(!$('.launch-builder-shell'))return;$$('.builder-step').forEach(b=>{const active=+b.dataset.step===builderStep;b.classList.toggle('active',active);b.classList.toggle('completed',+b.dataset.step<builderStep);if(active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});$$('[data-builder-panel]').forEach(p=>p.classList.toggle('active',+p.dataset.builderPanel===builderStep));$('#builderStageLabel').textContent=`0${builderStep} / ${stageNames[builderStep-1]}`;$('#builderStepCount').textContent=`STEP ${builderStep} OF 8`;$('#builderProgress').style.width=`${builderStep/8*100}%`;$('#builderPrev').style.visibility=builderStep===1?'hidden':'visible';$('#builderNext').textContent=builderStep===8?'SAVE BLUEPRINT ↓':'CONTINUE →';syncBuilderReview();$$('.dist-card,.mind-select').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('selected'))))}
function syncBuilderReview(){if(!$('.launch-builder-shell'))return;const name=$('#launchName').value.trim()||'Your coin',ticker=$('#launchTicker').value.trim()||'—',creator=+$('#launchCreator').value,liq=+$('#launchLiquidity').value,venue=$('#launchVenue').value,rewards=+$('#launchRewards').value;const set=(id,value)=>{const el=$(`#${id}`);if(el)el.textContent=value};set('generatedToken',(ticker[0]||'N').toUpperCase());set('generatedName',`${name.toUpperCase()} / ${ticker.toUpperCase()}`);set('launchCreatorOut',`${creator}%`);set('launchLiquidityOut',`${liq} SOL`);set('launchRewardsOut',`${rewards}%`);set('venuePreview',venue);const risk=creator<=8?'LOW':creator<=12?'MODERATE':'HIGH';set('structureRisk',risk);$('#structureFill').style.width=`${Math.min(90,18+creator*4)}%`;const score=Math.max(68,Math.min(98,94-Math.max(0,creator-6)*1.1+Math.min(4,(liq-180)/30)));set('builderScore',Math.round(score));set('builderRisk',risk);set('builderDepth',liq>=240?'A+':liq>=180?'A':'B');set('builderRewards',`${rewards}%`);set('builderAdvice',score>=92?'A balanced starting point.':'There is room to refine.');set('builderAdviceText',creator>8?'The example model suggests reducing creator exposure to improve distribution.':'Liquidity and creator exposure sit inside this example model’s target range.');set('reviewToken',`${name.toUpperCase()} / ${ticker.toUpperCase()}`);set('reviewLiquidity',`${liq} SOL`);set('reviewCreator',`${creator}%`);set('reviewVenue',venue);set('reviewScore',`${Math.round(score)} / 100 · DEMO`);set('reviewSupply',Number($('#launchSupply').value).toLocaleString());set('reviewVest',$('#launchVest').value);set('reviewLock',$('#launchLock').value);set('reviewRewards',`${rewards}%`);set('reviewThesis',$('#launchThesis').value.trim()||'No thesis yet');set('reviewDistribution',$$('.dist-card.selected').map(b=>$('span',b).textContent).join(' · ')||'None selected');set('reviewMind',$$('.mind-select.selected').map(b=>b.childNodes[0].textContent.trim()).join(' · ')||'None selected');$$('[data-ai-apply]').forEach(b=>{const config={creator:['launchCreator',6],liquidity:['launchLiquidity',260],rewards:['launchRewards',15]}[b.dataset.aiApply];b.textContent=Number($(`#${config[0]}`).value)===config[1]?'APPLIED ✓':'APPLY';const value=$('b',b.closest('article'));const unit=b.dataset.aiApply==='liquidity'?' SOL':'%';value.textContent=`${$(`#${config[0]}`).value}${unit} → ${config[1]}${unit}`})}
function validateLaunch(target){let error='',field=null;if(target>1&&(!$('#launchName').value.trim()||!$('#launchTicker').value.trim())){error='Add a name and ticker before continuing.';field=!$('#launchName').value.trim()?$('#launchName'):$('#launchTicker');builderStep=1}else if(target>1&&!/^[A-Za-z0-9]{1,10}$/.test($('#launchTicker').value.trim())){error='Use 1–10 letters or numbers for the ticker.';field=$('#launchTicker');builderStep=1}else if(target>2&&(!Number.isSafeInteger(Number($('#launchSupply').value))||Number($('#launchSupply').value)<=0)){error='Choose a positive whole-number supply.';field=$('#launchSupply');builderStep=2}$('#builderError').textContent=error;if(error){updateBuilder();field.focus();return false}return true}
function goToBuilderStep(step){if(step>builderStep&&!validateLaunch(step))return;builderStep=step;$('#builderError').textContent='';updateBuilder();saveLaunchDraft();const active=$('.builder-step.active');if(matchMedia('(max-width:760px)').matches)active.scrollIntoView({block:'nearest',inline:'nearest'});const heading=$(`[data-builder-panel="${step}"] h2`);if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}}
function downloadBlueprint(){if(!validateLaunch(8))return;const blob=new Blob([JSON.stringify(launchBlueprint(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='nucaloric-launch-blueprint.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('Blueprint saved. No transaction submitted.')}
$$('.builder-step').forEach(b=>b.addEventListener('click',()=>goToBuilderStep(+b.dataset.step)));$('#builderNext')?.addEventListener('click',()=>builderStep<8?goToBuilderStep(builderStep+1):downloadBlueprint());$('#builderPrev')?.addEventListener('click',()=>{if(builderStep>1)goToBuilderStep(builderStep-1)});launchFieldIds.forEach(id=>$(`#${id}`)?.addEventListener('input',()=>{syncBuilderReview();saveLaunchDraft()}));
$$('[data-ai-apply]').forEach(b=>b.addEventListener('click',()=>{const [id,value]={creator:['launchCreator',6],liquidity:['launchLiquidity',260],rewards:['launchRewards',15]}[b.dataset.aiApply];$(`#${id}`).value=value;syncBuilderReview();saveLaunchDraft();showToast('Recommendation applied to your blueprint')}));$$('.dist-card,.mind-select').forEach(b=>b.addEventListener('click',()=>{b.classList.toggle('selected');b.setAttribute('aria-pressed',String(b.classList.contains('selected')));const status=$('em',b);if(status)status.textContent=b.classList.contains('selected')?'SELECTED':'ENABLE';syncBuilderReview();saveLaunchDraft()}));restoreLaunchDraft();updateBuilder();
if($('#builderMatrix'))drawPulseField($('#builderMatrix'),true,6.2);
let mapIndex=0;const mapTimer=setInterval(()=>{const nodes=$$('.launch-map-card .map-node');if(!nodes.length){clearInterval(mapTimer);return}if(document.hidden||matchMedia('(prefers-reduced-motion:reduce)').matches)return;nodes.forEach((n,i)=>n.classList.toggle('active',i===mapIndex));mapIndex=(mapIndex+1)%nodes.length},1500);

/* Registry cards open as product detail sheets instead of documentation-only cards */
$$('.cap-card').forEach(card=>card.addEventListener('click',e=>{if(e.target.closest('a,button'))return;const heading=$('.cap-card-body h3',card);const name=heading?.getAttribute('aria-label')||heading?.textContent?.trim()||'Capability';const desc=$('.cap-card-body p',card)?.textContent?.trim()||'';const status=card.dataset.capStatus||'live';const uses=$('.cap-card-foot b',card)?.textContent?.trim()||'—';const section=card.closest('.registry-group')?.id?.toUpperCase()||'REGISTRY';$('#capabilityDrawerContent').innerHTML=`<div class="cap-detail"><div class="kicker">${section} / TYPED TOOL</div><h2>${name}</h2><p>${desc}</p><div class="cap-detail-grid"><div><span>STATUS</span><b>${status.toUpperCase()}</b></div><div><span>USES / 7D</span><b>${uses}</b></div><div><span>ACCESS</span><b>HEALTH-GATED</b></div><div><span>MODEL INPUT</span><b>TYPED</b></div></div><div class="cap-limit"><span>HARD LIMIT</span><p>The mind only receives this capability while the underlying service is healthy and the capability is permitted for the coin.</p></div></div>`;openDrawer(capDrawer)}));


/* v12 small polish hooks */
$$('[data-transition]',accountDrawer).forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigateWithTransition(a.getAttribute('href'))}));
$('#dashboardWatchlist')?.addEventListener('click',e=>{const a=e.target.closest('a[data-transition]');if(!a)return;e.preventDefault();navigateWithTransition(a.getAttribute('href'))});
document.addEventListener('keydown',e=>{if(e.key==='Escape')compareModal.classList.remove('open')});


/* Capability browser: discoverable keyboard controls and honest result feedback. */
function refreshRegistryResults(){const cards=$$('.registry-group .cap-card'),visible=cards.filter(c=>!c.hidden),groups=$$('.registry-group').filter(g=>g.style.display!=='none');const status=$('#registryResults');if(status)status.textContent=`${visible.length} ${visible.length===1?'capability':'capabilities'} / ${groups.length} ${groups.length===1?'group':'groups'}`;const empty=$('#registryEmpty');if(empty)empty.hidden=visible.length>0;$$('[data-reg-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('active'))))}
if($('#registrySearch')){$('#registrySearch').addEventListener('input',refreshRegistryResults);$$('[data-reg-filter]').forEach(b=>b.addEventListener('click',refreshRegistryResults));$('#registryReset')?.addEventListener('click',()=>{registryCategory='all';syncRegistryCategory();$('#registrySearch').value='';$('[data-reg-filter="all"]').click();$('#registrySearch').dispatchEvent(new Event('input'));$('#registrySearch').focus()});$$('.cap-card').forEach(card=>{card.setAttribute('aria-label',`${$('.cap-card-body h3',card)?.textContent.trim()}, ${card.dataset.capStatus}. View details`);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click()}})});refreshRegistryResults()}


/* Shared dot renderer: distinct surfaces, one clock, visible canvases only. */
function createDotMotion(){const surfaces=[],reduce=matchMedia('(prefers-reduced-motion:reduce)');let raf=0,lastFrame=0;
 const visibility=new IntersectionObserver(entries=>{for(const entry of entries){const surface=surfaces.find(s=>s.canvas===entry.target);if(surface)surface.visible=entry.isIntersecting}restart()},{rootMargin:'40px'});
 function resize(surface){const r=surface.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,surface.mode==='workspace'?1.25:1.5);surface.w=r.width;surface.h=r.height;surface.canvas.width=Math.max(1,Math.round(r.width*dpr));surface.canvas.height=Math.max(1,Math.round(r.height*dpr));surface.ctx.setTransform(dpr,0,0,dpr,0,0);draw(surface,reduce.matches?0:performance.now()/1000)}
 const sizing=new ResizeObserver(entries=>{for(const entry of entries){const s=surfaces.find(s=>s.canvas===entry.target);if(s)resize(s)}});
 function dot(ctx,x,y,r,alpha,pink){ctx.globalAlpha=alpha;ctx.fillStyle=pink?'#ff91bd':'#e6dfda';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
 function draw(s,now){const {ctx,w,h,mode,seed}=s;ctx.clearRect(0,0,w,h);if(w<1||h<1)return;const t=now*.35,phase=seed*1.317;
  if(mode==='sphere'){
   if(!s.points)s.points=Array.from({length:900},(_,i)=>{const y=1-2*(i+.5)/900,r=Math.sqrt(1-y*y),a=i*2.39996323;return {x:r*Math.cos(a),y,z:r*Math.sin(a),i}});
   const angle=now*.13,c=Math.cos(angle),sn=Math.sin(angle),tilt=.16*Math.sin(now*.08),radius=Math.min(w*.37,h*.41),ct=Math.cos(tilt),st=Math.sin(tilt);
   const points=s.points.map(p=>{const x=p.x*c+p.z*sn,z=-p.x*sn+p.z*c,y=p.y*ct-z*st,depth=p.y*st+z*ct;return {x,y,z:depth,i:p.i}}).sort((a,b)=>a.z-b.z);
   for(const p of points){const perspective=3.1/(3.1-p.z*.38),depth=(p.z+1)/2;dot(ctx,w*.5+p.x*radius*perspective,h*.49+p.y*radius*perspective,.6+depth*1.45,.16+depth*.8,p.i%5<2)}
  }else if(mode==='sculpture'){
   for(let row=0;row<30;row++){const v=row/29;for(let col=0;col<64;col++){const u=col/63;const depth=Math.sin(v*Math.PI),wave=Math.sin(u*Math.PI*2+t*.75+v*2.4);const x=w*(.05+u*.9)+Math.sin(v*5+t*.3)*w*.025*depth;const y=h*(.24+v*.49)+wave*h*.16*depth+Math.sin(u*7-t*.45)*h*.07;const edge=Math.sin(u*Math.PI)*Math.sin(v*Math.PI);dot(ctx,x,y,.65+edge*2.1,.18+edge*.65,(col+row*3)%19<4)}}
  }else if(mode==='workspace'){
   const gap=w<700?22:25;for(let row=0;row<h/gap;row++)for(let col=0;col<w/gap;col++){const x=col*gap+12,y=row*gap+12;const band=(Math.sin(col*.23+row*.15-t*.65)+1)*.5;dot(ctx,x,y,.55+band*1.55,.05+band*.27,(col+row*3)%15<3)}
  }else{
   const variation=seed%8,frequency=1+Math.floor(seed/8)*.12;for(let row=0;row<9;row++)for(let col=0;col<40;col++){const u=col/39,v=row/8,dx=u-.5,dy=(v-.5)*.65,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);let signal;
    switch(variation){case 0:signal=Math.sin(u*11*frequency+v*4-t*1.9+phase);break;case 1:signal=Math.sin(r*25*frequency-t*2+phase);break;case 2:signal=Math.sin(angle*3+r*10-t*1.5+phase);break;case 3:signal=Math.cos(u*17*frequency-t*2.1+phase)*Math.sin(v*8+t*.5);break;case 4:signal=Math.sin(u*13+t+phase)*Math.cos(v*9-t*.9);break;case 5:signal=Math.sin((u+v)*15*frequency-t*1.6+phase);break;case 6:signal=Math.cos(angle*2-t+r*16*frequency+phase);break;default:signal=Math.sin(r*21+t+phase)*Math.cos(u*9-t);}
    const energy=(signal+1)*.5,edge=Math.sin(u*Math.PI)*.8+.2;let y=h*(.12+v*.72);if(variation===0||variation===5)y+=Math.sin(u*8+t+phase)*h*.07;dot(ctx,w*(.02+u*.96),y,.5+energy*1.7,.09+energy*.7*edge,(col+row+seed)%9<3)}
  }ctx.globalAlpha=1;
 }
 function frame(now){raf=0;if(document.hidden||reduce.matches)return;if(now-lastFrame>=33){surfaces.filter(s=>s.visible).forEach(s=>draw(s,now/1000));lastFrame=now}if(surfaces.some(s=>s.visible))raf=requestAnimationFrame(frame)}
 function restart(){cancelAnimationFrame(raf);raf=0;if(reduce.matches){surfaces.forEach(s=>draw(s,0));return}if(!document.hidden&&surfaces.some(s=>s.visible))raf=requestAnimationFrame(frame)}
 document.addEventListener('visibilitychange',restart);reduce.addEventListener('change',restart);
 return {add(canvas,mode,seed=0){if(!canvas)return;const surface={canvas,mode,seed,ctx:canvas.getContext('2d'),w:0,h:0,visible:false};surfaces.push(surface);resize(surface);visibility.observe(canvas);sizing.observe(canvas)}};
}
const dotMotion=createDotMotion();dotMotion.add($('#workspaceWave'),'workspace');
$$('.registry-group .cap-card').forEach(card=>{const detail=document.createElement('span');detail.className='cap-detail-link';detail.textContent='VIEW DETAILS ↗';$('.cap-card-foot',card).appendChild(detail)});

/* Finish the command palette's advertised keyboard navigation. */
$('#commandSearch')?.addEventListener('keydown',e=>{const items=$$('.command-item',commandOverlay);if(!items.length)return;const current=Math.max(0,items.findIndex(item=>item.classList.contains('active')));let next=current;if(e.key==='ArrowDown')next=(current+1)%items.length;else if(e.key==='ArrowUp')next=(current-1+items.length)%items.length;else if(e.key==='Enter'){e.preventDefault();items[current].click();return}else return;e.preventDefault();items.forEach((item,i)=>item.classList.toggle('active',i===next));items[next].scrollIntoView({block:'nearest'});e.currentTarget.setAttribute('aria-activedescendant',items[next].id)});
new MutationObserver(()=>{$$('.command-item',commandOverlay).forEach((item,i)=>{item.id=`command-result-${i}`});const selected=$('.command-item.active',commandOverlay);if(selected)$('#commandSearch').setAttribute('aria-activedescendant',selected.id);else $('#commandSearch').removeAttribute('aria-activedescendant')}).observe($('#commandResults'),{childList:true});
$('#commandSearch').setAttribute('role','combobox');$('#commandSearch').setAttribute('aria-controls','commandResults');$('#commandSearch').setAttribute('aria-autocomplete','list');
commandOverlay.setAttribute('role','dialog');commandOverlay.setAttribute('aria-label','Search NUCALORIC');
$$('.drawer-close,.modal-close').forEach(b=>b.setAttribute('aria-label','Close panel'));
[accountDrawer,quickDrawer,capDrawer].forEach((drawer,i)=>{drawer.inert=true;drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label',['Your account','Coin quick view','Capability details'][i])});
if(modal){modal.setAttribute('role','dialog');modal.setAttribute('aria-label','Choose a demo wallet');modal.setAttribute('aria-modal','true')}
// The topmost open panel keeps keyboard focus within its visible controls.
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal?.classList.contains('open')){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');$('[data-wallet]')?.focus()}if(e.key!=='Tab')return;const panel=commandOverlay.classList.contains('open')?commandOverlay:modal?.classList.contains('open')?modal:[accountDrawer,quickDrawer,capDrawer].find(el=>el.classList.contains('open'));if(!panel)return;const controls=$$('button,a[href],input,select,textarea,[tabindex="0"]',panel).filter(el=>!el.disabled&&el.getClientRects().length);if(!controls.length)return;const first=controls[0],last=controls.at(-1);if(e.shiftKey&&(document.activeElement===first||!panel.contains(document.activeElement))){e.preventDefault();last.focus()}else if(!e.shiftKey&&(document.activeElement===last||!panel.contains(document.activeElement))){e.preventDefault();first.focus()}});

/* Missing external partner images get an intentional typographic fallback. */
$$('img').filter(img=>/^https?:/.test(img.src)&&!img.hasAttribute('data-fallback')).forEach(img=>{function fallback(){if(!img.isConnected||img.dataset.fallbackDone)return;img.dataset.fallbackDone='true';const label=img.alt||$('strong',img.parentElement)?.textContent||new URL(img.src).hostname.split('.')[0];const mark=document.createElement('span');mark.className='wallet-logo-mark';mark.textContent=label.slice(0,2).toUpperCase();mark.setAttribute('aria-label',label);img.replaceWith(mark)}img.addEventListener('error',fallback);if(img.complete&&!img.naturalWidth)fallback()});

/* Clear, truthful feedback for Explore filters. */
function updateExploreResults(){const grid=$('#coinGrid');if(!grid)return;let status=$('#exploreResults');if(!status){status=document.createElement('div');status.id='exploreResults';status.className='explore-results';status.setAttribute('role','status');status.setAttribute('aria-live','polite');grid.before(status)}const visible=$$('.coin-card',grid).filter(c=>!c.hidden);status.textContent=`${visible.length} of ${$$('.coin-card',grid).length} sample coins`;let empty=$('#exploreEmpty');if(!empty){empty=document.createElement('div');empty.id='exploreEmpty';empty.className='explore-empty';empty.innerHTML='<p>No coins match these filters.</p><button class="ghost-btn" id="exploreReset">RESET FILTERS</button>';grid.before(empty);$('#exploreReset').addEventListener('click',()=>{$('#coinSearch').value='';$('.filter-chip[data-filter="ALL"]').click();$('#coinSearch').dispatchEvent(new Event('input'));$('#coinSearch').focus()})}empty.hidden=visible.length>0}
updateExploreResults();


/* Registry categories, status, and search share one filter state. */
function syncRegistryCategory(){const labels={all:'The complete toolset.',observe:'Observation tools.',mind:'A mind with purpose.',research:'Research & discovery.',treasury:'Treasury operations.',rewards:'Rewards & distribution.',programs:'Programs & schedules.',community:'Community & collaboration.',create:'Creation tools.'};const title=$('#registryDirectoryTitle');if(title)title.textContent=labels[registryCategory]||labels.all;$$('[data-reg-category]').forEach(a=>{const current=a.dataset.regCategory===registryCategory;a.classList.toggle('selected',current);if(current)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')})}
if($('#registrySearch')){$$('[data-reg-category]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();registryCategory=a.dataset.regCategory;syncRegistryCategory();$('#registrySearch').dispatchEvent(new Event('input'));history.replaceState(null,'',registryCategory==='all'?'#capabilityBrowser':`#${registryCategory}`);if(matchMedia('(max-width:760px)').matches)a.scrollIntoView({block:'nearest',inline:'nearest'})}));const selected=location.hash.slice(1);if($(`[data-reg-category="${CSS.escape(selected)}"]`)){registryCategory=selected;syncRegistryCategory();$('#registrySearch').dispatchEvent(new Event('input'))}else syncRegistryCategory()}

if($('#registrySearch'))window.addEventListener('hashchange',()=>{const category=location.hash.slice(1);registryCategory=$(`[data-reg-category="${CSS.escape(category)}"]`)?category:'all';syncRegistryCategory();$('#registrySearch').dispatchEvent(new Event('input'))});

addEventListener('nucLiveWatchChange',()=>{renderAccountWatchlist();renderDashboardWatchlist()});
addEventListener('storage',event=>{if(event.key==='nucLiveWatchlist'){renderAccountWatchlist();renderDashboardWatchlist()}});
