/* Membership comes from primary launchpad registries, separately from pool quotes. */
(() => {
 const mint=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
 let cached;
 async function registry(signal){
  if(!cached){const r=await fetch('data/launchpads.json',{signal});if(!r.ok)throw Error('The launchpad catalog could not be read.');const d=await r.json();if(d.schemaVersion!==1||!Array.isArray(d.coins))throw Error('Invalid launchpad catalog.');cached=d;}
  let coins=cached.coins.filter(c=>mint.test(c.mint)&&['otc','paid'].includes(c.launchpad)),otcLive=false;
  try{const r=await fetch('https://otcdesks.cash/api/coins',{signal:AbortSignal.any([signal,AbortSignal.timeout(7000)])});if(!r.ok)throw Error('registry');const d=await r.json();if(!Array.isArray(d.coins))throw Error('registry');const fresh=d.coins.filter(c=>mint.test(c.mint)).map(c=>({mint:c.mint,name:String(c.name||'Unnamed token').slice(0,100),symbol:String(c.symbol||'').slice(0,30),launchpad:'otc',sourceUrl:'https://otcdesks.cash/coin/'+c.mint}));coins=[...fresh,...coins.filter(c=>c.launchpad!=='otc')];otcLive=true;}catch(e){if(signal.aborted)throw e;}
  const records=new Map();for(const c of coins){if(!records.has(c.mint))records.set(c.mint,{...c,sourceUrl:(c.launchpad==='otc'?'https://otcdesks.cash/coin/':'https://usepaid.app/token/')+c.mint});}
  return {coins:[...records.values()],checkedAt:cached.checkedAt,otcLive};
 }
 window.NUC_LAUNCHPADS={registry,label:id=>id==='otc'?'OTC Desks':id==='paid'?'PAID':'Pump.fun trading venue'};
})();
