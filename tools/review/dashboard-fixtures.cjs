/* Isolated browser fixtures. Never loaded by the website. */
module.exports=async function installDashboardFixtures(context){
const model={id:'nucaloric:tiny',name:'Tiny',installed:true};
const coin={id:'coin-review',name:'North Research',ticker:'NORTH',story:'A research studio for useful ideas.',mint:null,revenue:{builders:40,community:30},knowledge:[],pendingJob:null,lastError:null};
const messages=[{role:'user',content:'What should we build first?'},{role:'assistant',model:model.id,content:'Start with one useful research workflow. Give it a clear purpose, publish a working page, and invite people to try it.'}];
const workspaces=[{id:'server-review',project:'North Studio',billingStatus:'active',canManageServer:true,canUseTerminal:true,plan:{workload:'web',source:'paymenter',compute:'cpu'},server:{nodeName:'Main Pi',nodeId:'main',status:'running',slot:1,memoryMB:32,cpu:.25}}];
const balances={ai:1200,server:250};const requests=[];let holdChat=false,chatStarted=false,releaseChat;let opened=0,cursor=0,firstIO=true;
const integrations={jupiter:{apiKeyConfigured:false,launchEnabled:false},xmoney:{message:'Provider setup pending'}};
await context.route('**/api/billing/config',r=>r.fulfill({json:{connected:true,basePath:'/billing'}}));
await context.route('**/api/fleet',r=>r.fulfill({json:{nodes:[],checkedAt:new Date().toISOString()}}));
await context.route('**/billing/nucaloric/api/**',async r=>{
 const req=r.request(),pathname=new URL(req.url()).pathname.replace('/billing/nucaloric/api/',''),method=req.method(),body=req.postDataJSON();requests.push({path:pathname,method,body});let json;
 if(pathname==='session')json={user:{id:'review-user',name:'Workspace review'},csrfToken:'isolated-review'};
 else if(pathname==='catalog')json={products:{},provisioner:{connected:true,available:4,limit:5}};
 else if(pathname==='workspaces')json={workspaces};
 else if(pathname==='integrations')json=integrations;
 else if(pathname==='github')json={connected:false,configured:false};
 else if(pathname==='credits')json={balances,bundles:[],ledger:[],pendingPayments:[],network:'devnet'};
 else if(pathname==='payouts')json={payouts:[]};
 else if(pathname==='commerce/catalog')json={chains:[],bundles:{},tiers:{basic:{priceCents:150},full:{priceCents:200}}};
 else if(pathname==='commerce')json={balances,intents:[]};
 else if(pathname==='commerce/wallets')json={wallets:[]};
 else if(pathname.includes('shell/open')){opened++;firstIO=true;json={session:'review-shell-'+opened,cursor,seq:0};}
 else if(pathname.includes('shell/io')){const output=firstIO?'nucaloric:/usr/share/nginx/html $ ':'';firstIO=false;if(output)cursor++;json={output:Buffer.from(output).toString('base64'),cursor,seq:body.seq,closed:false};}
 else if(pathname.includes('shell/resize')||pathname.includes('shell/close'))json={ok:true};
 else if(pathname==='ai/coins')json={coins:[coin],ai:{connected:true,models:[model]},creditsPerMessage:0};
 else if(pathname==='ai/coins/coin-review')json={coin,messages};
 else if(pathname==='ai/coins/coin-review/chat'){
  chatStarted=true;if(holdChat)await new Promise(resolve=>releaseChat=resolve);
  messages.push({role:'user',content:body.message},{role:'assistant',model:model.id,content:'Your next step is ready to review.'});json={coin,messages};
 }
 else if(pathname==='ai/coins/coin-review/knowledge'){
  coin.knowledge.push({id:'note-review',content:body.content});json={coin};
 }
 else {await r.fulfill({status:404,json:{message:'No fixture configured: '+pathname}});return;}
 await r.fulfill({json});
});
return {requests,coin,messages,opened:()=>opened,holdChat:()=>{holdChat=true;chatStarted=false;},chatStarted:()=>chatStarted,releaseChat:()=>{holdChat=false;releaseChat?.();}};
};
