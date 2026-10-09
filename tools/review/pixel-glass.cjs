const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.REVIEW_BASE_URL||'http://127.0.0.1:8096',out=process.env.REVIEW_OUTPUT||path.resolve(__dirname,'../../docs/pixel-review');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.REVIEW_BROWSER?{executablePath:process.env.REVIEW_BROWSER}:{})});
const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),p=await ctx.newPage(),checks=[],errors=[],assetFailures=[];
p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(base)&&/\.(css|js|svg|webp|mp4|ttf)(\?|$)/.test(r.url())&&r.status()>=400)assetFailures.push(r.url());});
const check=(name,value)=>{checks.push({name,passed:!!value});assert.ok(value,name);console.log('PASS',name);};
const data=selector=>p.locator(selector).evaluate(e=>e.toDataURL());
const still=async(selector,ms=450)=>{await p.waitForTimeout(80);const a=await data(selector);await p.waitForTimeout(ms);return a===await data(selector);};
fs.mkdirSync(out,{recursive:true});
try {
await p.goto(base+'/index.html');await p.waitForFunction(()=>window.NUC_DOTS&&document.querySelector('#heroWave').width>0);
check('homepage retains the original wave and avoids a full-page pixel or rose background',await p.locator('#heroWave').count()===1&&await p.locator('.pixel-page-field,.campaign-hero').count()===0);
check('homepage background is solid brand ink',await p.locator('.hero-home').evaluate(e=>getComputedStyle(e).backgroundImage==='none'&&getComputedStyle(e).backgroundColor==='rgb(8, 8, 9)'));
check('homepage wave moves',!await still('#heroWave',650));
await p.locator('[data-campaign-motion]').click();check('homepage wave is still when paused',await still('#heroWave'));
await p.reload();check('homepage pause preference survives a reload',await still('#heroWave')&&await p.evaluate(()=>NUC_DOTS.isPaused()));
await p.locator('[data-campaign-motion]').click();check('homepage wave resumes',!await still('#heroWave',650));
await p.locator('[data-campaign-film]').click();await p.waitForFunction(()=>document.querySelector('#campaignFilm').open);check('film pauses the background wave',await still('#heroWave'));await p.keyboard.press('Escape');
await p.locator('#projectKits').scrollIntoViewIfNeeded();check('offscreen homepage wave stops drawing',await still('#heroWave'));
for(const name of ['studio','hosting','registry','pricing','launchpad']){await p.goto(base+'/'+name+'.html');await p.waitForTimeout(150);check(name+' has a live pink-white-blue pixel field',await p.locator('.pixel-page-field[data-dot-palette=ice]').count()===1&&!await still('.pixel-page-field'));}
await p.locator('.launch-circuit').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelectorAll('.launch-cable-pixel').length===4);
check('only available planning and export routes carry moving signals',await p.locator('.launch-cable-pixel').evaluateAll(paths=>paths.length===4&&paths.every(e=>!e.dataset.route.includes('wallet')&&!e.dataset.route.includes('pool'))));
check('wallet and pool connections stay dashed and planned',await p.locator('.ribbon-line.is-planned').count()===2&&await p.locator('.ribbon-node[data-state=planned]').count()===2);
for(const [id,copy,href] of [['identity','identity','#coinIdentity'],['supply','allocation','#coinDistribution'],['budget','budget','#coinBudget'],['export','Keep your plan','#coinWorkbench'],['wallet','Review and approve','roadmap.html#phase-1'],['pool','Launch the pool','roadmap.html#phase-2'],['hub','Your launch plan','#coinDesk']]){
await p.locator(`.launch-circuit [data-flow-id=${id}]`).focus();await p.keyboard.press('Enter');check(id+' works from the keyboard and points to its real destination',(await p.locator('[data-flow-detail-title]').innerText()).toLowerCase().includes(copy.toLowerCase())&&await p.locator('[data-flow-detail-link]').getAttribute('href')===href&&await p.locator(`.launch-circuit [data-flow-id=${id}]`).getAttribute('aria-pressed')==='true');
if(['wallet','pool'].includes(id))check(id+' detail clearly reports a planned integration',await p.locator('[data-flow-detail-label]').innerText()==='PLANNED'&&(await p.locator('[data-flow-detail-copy]').innerText()).includes('not enabled here yet'));
}
await p.locator('[data-modular-motion]').click();await p.locator('.launch-circuit').scrollIntoViewIfNeeded();check('shared motion control pauses console canvas and traveling pixels',await still('.circuit-machine canvas')&&await p.locator('.launch-cable-pixel').first().evaluate(e=>getComputedStyle(e).animationPlayState==='paused'));
await p.locator('[data-modular-motion]').click();await p.locator('.launch-circuit').scrollIntoViewIfNeeded();check('shared control resumes the console',!await still('.circuit-machine canvas'));
await p.locator('.footer').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('.launch-circuit').classList.contains('is-sleeping'));check('offscreen cable animation sleeps',true);
for(const width of [1440,1024,768,760,390,320]){
await p.setViewportSize({width,height:1000});await p.goto(base+'/launchpad.html');await p.locator('.launch-circuit').scrollIntoViewIfNeeded();await p.waitForTimeout(100);
check('console fits and has finite attached cable paths at '+width+'px',await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth&&[...document.querySelectorAll('.launch-circuit .ribbon-lines path')].every(e=>e.getAttribute('d')&&!/NaN|Infinity/.test(e.getAttribute('d'))&&e.getTotalLength()>0)));
if([1440,390].includes(width)){await p.locator('.nav-shell').evaluate(e=>e.style.visibility='hidden');await p.locator('.launch-circuit').screenshot({path:path.join(out,'console-'+width+'.png')});}
}
await p.emulateMedia({reducedMotion:'reduce'});await p.goto(base+'/launchpad.html');await p.locator('.launch-circuit').scrollIntoViewIfNeeded();check('reduced motion renders a still console without cable animation',await still('.circuit-machine canvas')&&await p.locator('.launch-cable-pixel').first().evaluate(e=>getComputedStyle(e).animationName==='none'));
await p.goto(base+'/index.html');check('reduced motion keeps the original homepage wave still',await still('#heroWave'));
check('changed assets and styles resolve',assetFailures.length===0);check('no browser runtime errors',errors.length===0);
}finally{fs.writeFileSync(path.join(out,'pixel-glass-validation.json'),JSON.stringify({checks,errors,assetFailures},null,2));await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
