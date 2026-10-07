(() => {
  const root=document.querySelector('[data-billing-workspace],[data-services-workspace]'),client=window.NUC_BILLING;
  if(!root||!client)return;
  const el=id=>document.getElementById(id),form=el('billingForm');
  let requestKey=null,lastPayload=null;
  const notice=message=>{el('billingNotice').textContent=message;};
  function plan(){return {version:1,project:el('billingProject').value.trim(),source:el('billingSource').value,hardware:el('billingHardware').value,workload:el('billingWorkload').value,compute:el('billingCompute').value,repository:el('billingRepository').value.trim(),tokenMint:el('billingMint').value.trim(),access:el('billingAccess').value,endpoint:el('billingEndpoint').value.trim()};}
  function preset(value){
    const values=value==='own'?{source:'own',workload:'web',compute:'cpu',hardware:'pi'}:value==='model'?{source:'paymenter',workload:'model',compute:'gpu',hardware:'pi'}:{source:'paymenter',workload:'web',compute:'cpu',hardware:'pi'};
    for(const [key,id] of Object.entries({source:'billingSource',workload:'billingWorkload',compute:'billingCompute',hardware:'billingHardware'}))el(id).value=values[key];update();
  }
  function update(){
    const capacity=client.state.provisioner;
    if(el('billingSlotsCount'))el('billingSlotsCount').textContent=capacity?.connected?`${capacity.available} / ${capacity.limit}`:'—';
    if(el('billingSlotsNote'))el('billingSlotsNote').textContent=capacity?.connected?'Slots available across the Pi':'Connect to the workspace site';
    if(!form)return;
    const p=plan(),product=client.state.catalog[p.source==='own'?'basic':p.workload==='model'?'ai':'server'],hosted=capacity?.connected&&p.source==='paymenter'&&p.workload==='web'&&p.compute==='cpu';
    el('billingProduct').textContent=product?.name||'Free website plan';el('billingPrice').textContent=product?.priceLabel||'—';el('billingSubmit').disabled=!client.state.user||!product||(hosted&&capacity.available===0);
    el('billingSubmit').textContent=hosted&&capacity.available===0?'All Pi slots are allocated':hosted?'Create free website server ↗':'Save free workspace plan ↗';
    el('billingAcknowledgement').textContent=hosted?'Create a small website server using an available Pi slot. No payment is due.':'Save this plan to my account. This does not pair my machine or allocate model compute.';
    el('billingCapacity').textContent=hosted?'32 MB RAM · 0.25 CPU · HTML, CSS & JavaScript':p.source==='own'?'Your machine · setup planning · pairing pending':p.workload==='model'?'Model planning only · compute is not provided':'Workspace plan only · no app runtime is provided';
    el('billingEnrollmentDescription').textContent=hosted?'A small home for your website. Give it a name and start building.':p.source==='own'?'Keep your own-hardware plan with your account.':'Keep your workload plan with your account. Server capacity is separate.';
    const choice=p.source==='own'?'own':p.workload==='model'?'model':p.workload==='web'&&p.compute==='cpu'?'website':'custom';
    document.querySelectorAll('[data-billing-plan]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.billingPlan===choice)));
  }
  function onCancel(w){el('billingCancelName').textContent=w.project;el('billingCancelDialog').showModal();el('billingConfirmCancel').onclick=async()=>{el('billingConfirmCancel').disabled=true;try{await client.request('workspaces/'+w.id+'/cancel',{method:'POST',body:'{}'});requestKey=null;lastPayload=null;try{localStorage.removeItem('nucBillingRequest');}catch{}el('billingCancelDialog').close();await loadWorkspaces();notice(w.server?'Enrollment cancelled and its Pi server removed.':'Enrollment cancelled.');}catch(e){notice(e.message);}finally{el('billingConfirmCancel').disabled=false;}};}
  async function loadWorkspaces(){
    const data=await client.request('workspaces');if(data.provisioner)client.state.provisioner=data.provisioner;update();
    if(el('billingActiveCount'))el('billingActiveCount').textContent=String(data.workspaces.filter(w=>w.server&&w.billingStatus==='active').length);
    if(el('billingRunningCount'))el('billingRunningCount').textContent=String(data.workspaces.filter(w=>w.canUseTerminal).length);
    window.NUC_SERVICE_RECORDS.render(el('billingWorkspaces'),data.workspaces,{notify:notice,reload:loadWorkspaces,onCancel});
  }
  if(form){
    try{const saved=JSON.parse(localStorage.getItem('nucHostingPlan')||'null');if(saved?.version===1)for(const [key,id] of Object.entries({project:'billingProject',source:'billingSource',hardware:'billingHardware',workload:'billingWorkload',compute:'billingCompute',repository:'billingRepository',tokenMint:'billingMint',access:'billingAccess',endpoint:'billingEndpoint'}))if(typeof saved[key]==='string')el(id).value=saved[key];}catch{}
    const query=new URLSearchParams(location.search);
    for(const [key,values,id] of [['source',['own','paymenter'],'billingSource'],['workload',['web','dev','model'],'billingWorkload'],['compute',['cpu','gpu'],'billingCompute'],['hardware',['pi','pc'],'billingHardware']])if(values.includes(query.get(key)))el(id).value=query.get(key);
    if(query.get('project')?.trim()&&query.get('project').length<=60)el('billingProject').value=query.get('project');
    document.querySelectorAll('[data-billing-plan]').forEach(button=>button.addEventListener('click',()=>preset(button.dataset.billingPlan)));
    form.addEventListener('input',update);form.addEventListener('change',update);
    form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;const payload=JSON.stringify(plan());if(payload!==lastPayload){try{const saved=JSON.parse(localStorage.getItem('nucBillingRequest')||'null');requestKey=saved?.payload===payload?saved.key:client.uuid();localStorage.setItem('nucBillingRequest',JSON.stringify({key:requestKey,payload}));}catch{requestKey=client.uuid();}lastPayload=payload;}el('billingSubmit').disabled=true;notice('Creating your free workspace…');try{const data=await client.request('workspaces',{method:'POST',body:JSON.stringify({requestKey,plan:plan()})});notice(data.allocationError?`Workspace saved. ${data.allocationError}`:data.workspace.server?`${data.workspace.project}: your free website server is ${data.workspace.server.status}.`:`${data.workspace.project}: workspace plan saved. ${data.workspace.plan.source==='own'?'Machine pairing is still pending.':'No compute has been allocated.'}`);await loadWorkspaces();}catch(e){notice(e.message);}finally{update();}});
  }
  el('billingRefresh').addEventListener('click',async()=>{el('billingRefresh').disabled=true;try{await loadWorkspaces();notice('Service status refreshed.');}catch(e){notice(e.message);}finally{el('billingRefresh').disabled=false;}});
  el('billingLogout').addEventListener('click',async()=>{try{await client.request('logout',{method:'POST',body:'{}'});location.reload();}catch(e){notice(e.message);}});
  el('billingCancelClose').addEventListener('click',()=>el('billingCancelDialog').close());
  client.ready.then(async state=>{
    el('billingConnection').textContent=state.connected?'PAYMENTER / FREE PLANS':'WORKSPACES / CONNECTION PENDING';el('billingAccount').textContent=state.user?.name||'Your account';el('billingAccountNote').textContent=state.user?state.user.email:state.connected?'Sign in to manage your servers and plans.':'Account access is available through the connected workspace site.';
    if(el('billingNativeRecords'))el('billingNativeRecords').hidden=!state.connected;
    el('billingSignedOut').hidden=Boolean(state.user)||!state.connected;el('billingSignedIn').hidden=!state.user;el('billingRefresh').hidden=!state.user;if(form)form.hidden=!state.connected;
    if(!state.connected){el('billingWorkspaces').replaceChildren();const p=document.createElement('p');p.className='billing-muted';p.textContent=state.error||'Public account access awaits the Pi HTTPS connection. Your plans remain available in Hosting.';el('billingWorkspaces').append(p);}else if(state.user){try{await loadWorkspaces();}catch(e){notice(e.message);}}else{el('billingWorkspaces').replaceChildren();const p=document.createElement('p');p.className='billing-muted';p.textContent='Sign in to see your services.';el('billingWorkspaces').append(p);}
    update();
  });
})();
