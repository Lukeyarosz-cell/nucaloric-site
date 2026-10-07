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
  function update(){
    const product=selectedProduct(),p=plan(),capacity=client.state.provisioner;
    const hosted=capacity?.connected&&p.source==='paymenter'&&p.workload==='web'&&p.compute==='cpu';
    el('billingProduct').textContent=product?.name||'Workspace enrollment';el('billingPrice').textContent=product?.priceLabel||'Not connected';el('billingSubmit').disabled=!client.state.user||!product;
    el('billingSubmit').textContent=hosted?'Create free website server ↗':'Enroll workspace ↗';
    el('billingAcknowledgement').textContent=hosted?'This creates a small static website server on the Pi, subject to available slots. It includes 32 MB RAM and 0.25 CPU.':'This saves a workspace record. Own-hardware pairing, app runtimes and AI compute are separate from enrollment.';
    el('billingCapacity').textContent=capacity?.connected?`Pi website slots: ${capacity.available} of ${capacity.limit} available · 32 MB RAM / 0.25 CPU each.`:'';
    el('billingEnrollmentDescription').textContent=capacity?.connected?'Choose Server workspace, Website or app, and CPU to create a small static website server. Other plans save an enrollment record.':'Bring your Hosting plan into your account. Enrollment creates a billing record; connect the machine separately.';
  }
  try {
    const saved=JSON.parse(localStorage.getItem('nucHostingPlan')||'null');
    if(saved?.version===1){for(const [key,id] of Object.entries({project:'billingProject',source:'billingSource',hardware:'billingHardware',workload:'billingWorkload',compute:'billingCompute',repository:'billingRepository',tokenMint:'billingMint',access:'billingAccess',endpoint:'billingEndpoint'})){if(typeof saved[key]==='string')el(id).value=saved[key];}}
  }catch{}
  const query=new URLSearchParams(location.search);
  if(['own','paymenter'].includes(query.get('source')))el('billingSource').value=query.get('source');
  if(['web','dev','model'].includes(query.get('workload')))el('billingWorkload').value=query.get('workload');
  if(['cpu','gpu'].includes(query.get('compute')))el('billingCompute').value=query.get('compute');
  if(['pi','pc'].includes(query.get('hardware')))el('billingHardware').value=query.get('hardware');
  if(query.get('project')?.trim()&&query.get('project').length<=60)el('billingProject').value=query.get('project');
  function node(tag,text,className){const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;}
  async function loadWorkspaces(){
    const data=await client.request('workspaces');if(data.provisioner)client.state.provisioner=data.provisioner;update();const list=el('billingWorkspaces');list.replaceChildren();
    if(!data.workspaces.length){list.append(node('p','Your first workspace starts here. Save a plan in Hosting or enroll below.','billing-muted'));return;}
    for(const w of data.workspaces){
      const card=node('article','','billing-record');card.dataset.workspaceId=w.id;
      const header=node('div','','billing-record-head');header.append(node('h3',w.project),node('span',w.billingStatus==='active'?'Enrolled':w.billingStatus==='cancelled'?'Cancelled':w.billingStatus,'billing-badge'));card.append(header,node('p',w.product,'billing-muted'));
      const details=node('dl','','billing-details');
      for(const [label,value] of [['BILLING',w.price!==null?`${w.currency} ${Number(w.price).toFixed(2)} · Free`: 'Unavailable'],['MACHINE',{'awaiting-pairing':'Awaiting pairing','awaiting-server':'Awaiting server',running:'Running',stopped:'Stopped',failed:'Failed',missing:'Container missing',unavailable:'Status unavailable'}[w.machineStatus]||'Not connected'],['RECORD',`Order #${w.orderId} · Service #${w.serviceId??'unavailable'}`]]){const d=node('div','');d.append(node('dt',label),node('dd',value));details.append(d);}card.append(details);
      const actions=node('div','','billing-actions');
      if(w.serviceUrl){const url=new URL(w.serviceUrl,location.href);if(url.origin===location.origin&&url.pathname.startsWith('/billing/')){const a=node('a','View billing record ↗','billing-link');a.href=url.href;actions.append(a);}}
      if(w.canCancel){const button=node('button','Cancel enrollment','billing-link');button.type='button';button.addEventListener('click',()=>{el('billingCancelName').textContent=w.project;el('billingCancelDialog').showModal();el('billingConfirmCancel').onclick=async()=>{button.disabled=true;el('billingConfirmCancel').disabled=true;try{await client.request('workspaces/'+w.id+'/cancel',{method:'POST',body:'{}'});el('billingCancelDialog').close();await loadWorkspaces();notice(w.server?'Enrollment cancelled and its Pi server removed.':'Enrollment cancelled.');}catch(e){notice(e.message);}finally{button.disabled=false;el('billingConfirmCancel').disabled=false;}};});actions.append(button);}
      const serverAction=(action,label)=>{const button=node('button',label,'billing-link');button.type='button';button.addEventListener('click',async()=>{
        if(action==='delete'&&!confirm('Remove this website server and free its slot? Your billing enrollment will remain.'))return;
        button.disabled=true;try{await client.request('workspaces/'+w.id+'/server/'+action,{method:'POST',body:'{}'});await loadWorkspaces();notice({create:'Website server allocated.',start:'Server started.',stop:'Server stopped.',delete:'Server removed. Its slot is available again.'}[action]);}catch(e){notice(e.message);button.disabled=false;}
      });actions.append(button);};
      if(w.canAllocate)serverAction('create','Allocate website server');
      if(w.server){
        if(w.server.url){const url=new URL(w.server.url);if(['http:','https:'].includes(url.protocol)){const link=node('a','Open website ↗','billing-link');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}}
        card.append(node('p',`Pi slot ${w.server.slot} · ${w.server.memoryMB} MB RAM · ${w.server.cpu} CPU · Static website`,'billing-muted'));
        if(w.canManageServer){
          serverAction(w.server.status==='running'?'stop':'start',w.server.status==='running'?'Stop server':'Start server');
          const editor=node('details','','billing-editor');editor.append(node('summary','Publish an HTML page'));
          const form=node('form',''),label=node('label','Website HTML'),input=node('textarea','');input.id='billingHtml-'+w.id;input.required=true;input.maxLength=1048576;input.rows=8;input.placeholder='<!doctype html>…';label.htmlFor=input.id;
          const help=node('p','One HTML page up to 1 MB, with inline styles/scripts. Publishing replaces the current page.','billing-muted');
          const submit=node('button','Publish page ↗','billing-primary');submit.type='submit';form.append(label,input,help,submit);editor.append(form);card.append(editor);
          form.addEventListener('submit',async event=>{event.preventDefault();submit.disabled=true;try{await client.request('workspaces/'+w.id+'/server/publish',{method:'POST',body:JSON.stringify({html:input.value})});notice('Website page published. Open the website to view it.');}catch(e){notice(e.message);}finally{submit.disabled=false;}});
        }
        serverAction('delete','Remove server');
      }
      card.append(actions);list.append(card);
    }
  }
  el('billingForm').addEventListener('input',update);
  el('billingForm').addEventListener('submit',async event=>{
    event.preventDefault();if(!el('billingForm').reportValidity())return;
    const payload=JSON.stringify(plan());
    if(payload!==lastPayload){
      try{const saved=JSON.parse(localStorage.getItem('nucBillingRequest')||'null');requestKey=saved?.payload===payload?saved.key:client.uuid();localStorage.setItem('nucBillingRequest',JSON.stringify({key:requestKey,payload}));}catch{requestKey=client.uuid();}
      lastPayload=payload;
    }
    el('billingSubmit').disabled=true;notice('Creating your free enrollment…');
    try{const data=await client.request('workspaces',{method:'POST',body:JSON.stringify({requestKey,plan:plan()})});notice(data.allocationError?`Workspace saved. ${data.allocationError}`:data.workspace.server?`${data.workspace.project}: your free website server is ${data.workspace.server.status}.`:`Enrolled ${data.workspace.project}. ${data.workspace.plan.source==='own'?'Your own machine still needs pairing.':'This plan has no allocated server yet.'}`);await loadWorkspaces();}
    catch(e){notice(e.message);}finally{update();}
  });
  el('billingRefresh').addEventListener('click',async()=>{el('billingRefresh').disabled=true;try{await loadWorkspaces();notice('Billing records refreshed.');}catch(e){notice(e.message);}finally{el('billingRefresh').disabled=false;}});
  el('billingLogout').addEventListener('click',async()=>{try{await client.request('logout',{method:'POST',body:'{}'});location.reload();}catch(e){notice(e.message);}});
  el('billingCancelClose').addEventListener('click',()=>el('billingCancelDialog').close());
  client.ready.then(async state=>{
    if(state.provisioner?.connected&&!query.has('source')){
      try{if(!localStorage.getItem('nucHostingPlan'))el('billingSource').value='paymenter';}catch{el('billingSource').value='paymenter';}
    }
    el('billingConnection').textContent=state.connected?'FREE WORKSPACES / CONNECTED':'BILLING / WAITING FOR SERVER';
    el('billingAccount').textContent=state.user?.name||'Your workspace account';
    el('billingAccountNote').textContent=state.user?state.user.email:state.connected?'Sign in with your Paymenter account to keep enrollment and billing records together.':'Billing runs on the Raspberry Pi. Public account access will be available once its HTTPS connection is configured.';
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
