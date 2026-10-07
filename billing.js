(() => {
  const root=document.querySelector('[data-billing-workspace]');
  const client=window.NUC_BILLING;
  if(!root||!client)return;
  const el=id=>document.getElementById(id);
  let requestKey=null,lastPayload=null;
  const notice=message=>{el('billingNotice').textContent=message;};
  function plan() {
    const source=el('billingSource').value,workload=el('billingWorkload').value;
    return {version:1,project:el('billingProject').value.trim(),source,hardware:el('billingHardware').value,workload,compute:el('billingCompute').value,repository:el('billingRepository').value.trim(),tokenMint:el('billingMint').value.trim(),access:el('billingAccess').value,endpoint:el('billingEndpoint').value.trim()};
  }
  function selectedProduct(){const p=plan();return client.state.catalog[p.source==='own'?'basic':p.workload==='model'?'ai':'server'];}
  function update(){const product=selectedProduct();el('billingProduct').textContent=product?.name||'Workspace enrollment';el('billingPrice').textContent=product?.priceLabel||'Not connected';el('billingSubmit').disabled=!client.state.user||!product;}
  try {
    const saved=JSON.parse(localStorage.getItem('nucHostingPlan')||'null');
    if(saved?.version===1){for(const [key,id] of Object.entries({project:'billingProject',source:'billingSource',hardware:'billingHardware',workload:'billingWorkload',compute:'billingCompute',repository:'billingRepository',tokenMint:'billingMint',access:'billingAccess',endpoint:'billingEndpoint'})){if(typeof saved[key]==='string')el(id).value=saved[key];}}
  }catch{}
  const query=new URLSearchParams(location.search);
  if(['own','paymenter'].includes(query.get('source')))el('billingSource').value=query.get('source');
  if(['web','dev','model'].includes(query.get('workload')))el('billingWorkload').value=query.get('workload');
  function node(tag,text,className){const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;}
  async function loadWorkspaces(){
    const data=await client.request('workspaces');const list=el('billingWorkspaces');list.replaceChildren();
    if(!data.workspaces.length){list.append(node('p','Your first workspace starts here. Save a plan in Hosting or enroll below.','billing-muted'));return;}
    for(const w of data.workspaces){
      const card=node('article','','billing-record');card.dataset.workspaceId=w.id;
      const header=node('div','','billing-record-head');header.append(node('h3',w.project),node('span',w.billingStatus==='active'?'Enrolled':w.billingStatus==='cancelled'?'Cancelled':w.billingStatus,'billing-badge'));card.append(header,node('p',w.product,'billing-muted'));
      const details=node('dl','','billing-details');
      for(const [label,value] of [['BILLING',w.price!==null?`${w.currency} ${Number(w.price).toFixed(2)} · Free`: 'Unavailable'],['MACHINE',w.machineStatus==='awaiting-pairing'?'Awaiting pairing':w.machineStatus==='awaiting-server'?'Awaiting server':'Not connected'],['RECORD',`Order #${w.orderId} · Service #${w.serviceId??'unavailable'}`]]){const d=node('div','');d.append(node('dt',label),node('dd',value));details.append(d);}card.append(details);
      const actions=node('div','','billing-actions');
      if(w.serviceUrl){const url=new URL(w.serviceUrl,location.href);if(url.origin===location.origin&&url.pathname.startsWith('/billing/')){const a=node('a','View billing record ↗','billing-link');a.href=url.href;actions.append(a);}}
      if(w.canCancel){const button=node('button','Cancel enrollment','billing-link');button.type='button';button.addEventListener('click',()=>{el('billingCancelName').textContent=w.project;el('billingCancelDialog').showModal();el('billingConfirmCancel').onclick=async()=>{button.disabled=true;el('billingConfirmCancel').disabled=true;try{await client.request('workspaces/'+w.id+'/cancel',{method:'POST',body:'{}'});el('billingCancelDialog').close();await loadWorkspaces();notice('Enrollment cancelled. No machine was changed.');}catch(e){notice(e.message);}finally{button.disabled=false;el('billingConfirmCancel').disabled=false;}};});actions.append(button);}
      card.append(actions);list.append(card);
    }
  }
  el('billingForm').addEventListener('input',update);
  el('billingForm').addEventListener('submit',async event=>{
    event.preventDefault();if(!el('billingForm').reportValidity())return;
    const payload=JSON.stringify(plan());
    if(payload!==lastPayload){
      try{const saved=JSON.parse(localStorage.getItem('nucBillingRequest')||'null');requestKey=saved?.payload===payload?saved.key:crypto.randomUUID();localStorage.setItem('nucBillingRequest',JSON.stringify({key:requestKey,payload}));}catch{requestKey=crypto.randomUUID();}
      lastPayload=payload;
    }
    el('billingSubmit').disabled=true;notice('Creating your free enrollment…');
    try{const data=await client.request('workspaces',{method:'POST',body:JSON.stringify({requestKey,plan:plan()})});notice(`Enrolled ${data.workspace.project}. No payment is due; machine access is waiting for setup.`);await loadWorkspaces();}
    catch(e){notice(e.message);}finally{update();}
  });
  el('billingRefresh').addEventListener('click',async()=>{el('billingRefresh').disabled=true;try{await loadWorkspaces();notice('Billing records refreshed.');}catch(e){notice(e.message);}finally{el('billingRefresh').disabled=false;}});
  el('billingLogout').addEventListener('click',async()=>{try{await client.request('logout',{method:'POST',body:'{}'});location.reload();}catch(e){notice(e.message);}});
  el('billingCancelClose').addEventListener('click',()=>el('billingCancelDialog').close());
  client.ready.then(async state=>{
    el('billingConnection').textContent=state.connected?'FREE WORKSPACES / CONNECTED':'BILLING / WAITING FOR SERVER';
    el('billingAccount').textContent=state.user?.name||'Your workspace account';
    el('billingAccountNote').textContent=state.user?state.user.email:state.connected?'Sign in with your Paymenter account to keep enrollment and billing records together.':'Billing is ready in the local installation. This public site will connect when the Raspberry Pi backend is online.';
    el('billingSignedOut').hidden=Boolean(state.user)||!state.connected;
    el('billingSignedIn').hidden=!state.user;
    el('billingEnrollmentNote').textContent=state.user?'Free enrollment has no renewal charge. Manage it from your workspace record.':'Sign in to enroll. Free workspaces have no renewal charge.';
    el('billingForm').hidden=!state.connected;
    el('billingRefresh').hidden=!state.user;
    if(!state.connected){el('billingWorkspaces').replaceChildren(node('p',state.error||'You can still plan and export your workspace from Hosting. Public account enrollment awaits the billing server.','billing-muted'));}
    else if(state.user){try{await loadWorkspaces();}catch(e){notice(e.message);}}
    else{el('billingWorkspaces').replaceChildren(node('p','Sign in to see your enrolled workspaces.','billing-muted'));}
    update();
  });
})();
