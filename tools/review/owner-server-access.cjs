const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const fixtures=require('./dashboard-fixtures.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.REVIEW_BROWSER});const checks=[],errors=[];
 const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);console.log('PASS',name);};
 try{
  for(const waived of [true,false]){
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await fixtures(context);let created=0,renews=0,walletQuotes=0,setup=null;
   await context.route('**/billing/nucaloric/api/**',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname.replace('/billing/nucaloric/api/',''),body=request.postDataJSON();let json;
    if(path==='commerce')json={balances:{ai:0,server:0},pending:[],usage:[],serverPayment:{required:!waived,temporary:waived}};
    else if(path==='commerce/catalog')json={enabled:true,chains:[],bundles:{},tiers:{basic:{priceCents:150},full:{priceCents:200}}};
    else if(path==='commerce/servers'){created++;json={workspaceId:'server-review',paymentWaived:waived,chargedCents:waived?0:200};}
    else if(path==='workspaces')json={workspaces:[{id:'server-review',project:'Review server',billingStatus:'active',machineStatus:'running',canManageServer:true,canUseTerminal:true,serverPaymentWaived:waived,term:{tier:'full',price_cents:200,paidUntil:'2026-11-09T00:00:00Z'},plan:{source:'paymenter',workload:'web',compute:'cpu',tier:'full'},server:{workspaceId:'server-review',nodeName:'Main Pi',nodeId:'main',status:'running'}}],provisioner:{connected:true,available:4,limit:5}};
    else if(path==='commerce/servers/server-review/renew'){renews++;json={paymentWaived:waived,paidUntil:'2026-12-09T00:00:00Z'};}
    else if(path==='workspaces/server-review/setup'){setup=body;json={workspaceId:'server-review',setup};}
    else if(path==='workspaces/server-review/files')json={server:{workspaceId:'server-review'},storage:{usedBytes:100,limitBytes:1048576,availableBytes:1048476},entries:[]};
    else if(path==='commerce/intents'){walletQuotes++;json={};}
    else {await route.fallback();return;}
    await route.fulfill({json});
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8118/setup.html');await page.waitForFunction(()=>document.querySelector('#setupStatus').textContent==='');
   await page.locator('[name=setupTier]').nth(1).check();check((waived?'Owner':'Customer')+' still sees the normal Full monthly rate',(await page.locator('#setupStage').innerText()).includes('$2.00 / month'));
   await page.locator('#setupNext').click();await page.locator('#setupNext').click();await page.locator('#setupNext').click();await page.locator('#setupServerName').fill('Review setup');await page.locator('#setupNext').click();
   const review=await page.locator('.setup-review').innerText();check((waived?'Owner':'Customer')+' review keeps the normal monthly price',review.includes('$2.00 / month'));
   if(waived)check('Owner review states the actual zero charge',review.includes('$0.00')&&(await page.locator('.setup-consent').innerText()).includes('no server credits'));
   else check('Customer review still asks to deduct prepaid credits',(await page.locator('.setup-consent').innerText()).includes('Deduct $2.00'));
   await page.locator('#setupNext').click();check('Explicit setup approval is required for '+(waived?'owner':'customer'),created===0);
   await page.locator('#setupConsent').check();await page.locator('#setupNext').click();
   if(waived){await page.waitForFunction(()=>document.querySelector('#setupStatus').textContent.includes('Your server is set up'));check('Zero-credit owner creates and configures the server',created===1&&setup.name==='Review setup');check('Owner setup makes no wallet payment quote',walletQuotes===0);}
   else{await page.waitForFunction(()=>document.querySelector('#setupStatus').textContent.includes('Add server credits first'));check('Unfunded customer is still blocked before allocation',created===0);}
   check((waived?'Owner':'Customer')+' setup fits a phone',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(waived){
    await page.goto('http://127.0.0.1:8118/billing.html?source=paymenter&tier=full');await page.waitForFunction(()=>window.NUC_COMMERCE?.paymentRequired===false);
    await page.locator('#billingProject').fill('Owner legacy route');await page.locator('#billingAcknowledged').check();check('Existing billing shows the normal monthly price',await page.locator('#billingPrice').innerText()==='$2.00 / month');check('Existing billing explains the account exception',(await page.locator('#billingAcknowledgement').innerText()).includes('temporarily waived'));
    await page.locator('#billingSubmit').click();await page.waitForFunction(()=>document.querySelector('#billingNotice').textContent.includes('Payment is temporarily waived'));
    check('Existing billing also allocates without a wallet',created===2&&walletQuotes===0);
    let confirmation='';page.once('dialog',async d=>{confirmation=d.message();await d.accept();});await page.getByRole('button',{name:'Renew one month ↗'}).click();await page.waitForFunction(()=>document.querySelector('#billingNotice').textContent.includes('No credits deducted'));
    check('Renewal review and result correctly show no charge',renews===1&&confirmation.includes('temporarily waived'));
    check('Owner service card does not claim it was paid',(await page.locator('.billing-record').innerText()).includes('Active until'));
   }
   await context.close();
  }
  check('No browser runtime exceptions',errors.length===0);
  fs.writeFileSync('/home/luke/Projects/nucaloric-fleet/deployment/owner-server-access-20261009/browser-verification.json',JSON.stringify({checks,errors},null,2)+'\n');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
