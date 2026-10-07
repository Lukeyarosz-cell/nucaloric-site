(() => {
  const name=document.getElementById('dashboardWorkspaceName'),client=window.NUC_BILLING;
  if(!name||!client)return;
  const card=name.closest('.account-project-card'),panel=document.querySelector('.cli-workspace');
  const el=id=>document.getElementById(id),select=el('cliServerSelect'),input=el('cliCommand'),output=el('cliOutput');
  const account=document.createElement('a');account.className='product-primary';account.href='billing.html';account.textContent='ACCOUNT & BILLING ↗';account.style.marginTop='12px';card.append(account);
  let rows=[],selected=null,busy=false,history=[],historyIndex=0;
  function showWorkspace(workspace){
    if(!workspace)return;
    name.textContent=workspace.project;
    el('workspacePlanStatus').textContent=workspace.server?workspace.server.status==='running'?'Active server':'Server '+workspace.server.status:'Enrolled';
    el('workspacePlanBadge').textContent=workspace.server?.status==='running'?'FREE SERVER / RUNNING':workspace.server?'FREE SERVER / '+workspace.server.status.toUpperCase():'FREE ENROLLED';
    el('dashboardWorkspaceNote').textContent=workspace.server?`Pi website slot ${workspace.server.slot} · ${workspace.server.status}.`:workspace.machineStatus==='awaiting-pairing'?'Saved in your account · Awaiting machine pairing.':'Saved in your account · Awaiting a configured server.';
    el('dashboardWorkload').textContent={web:'Website or app',dev:'Developer tools',model:'Self-hosted model'}[workspace.plan.workload];
    el('dashboardCompute').textContent=workspace.server?`${workspace.server.memoryMB} MB RAM · ${workspace.server.cpu} CPU`:workspace.plan.source==='own'?(workspace.plan.hardware==='pi'?'Your Raspberry Pi':'Your Linux PC'):'Compute plan · hardware pending';
  }
  function append(text,kind='output'){
    const clean=String(text).replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g,'').replace(/\r\n/g,'\n');
    const entry=document.createElement('span');entry.className='cli-entry cli-entry--'+kind;entry.textContent=clean;output.append(entry);
    let excess=output.textContent.length-100000;
    while(excess>0&&output.firstChild){const first=output.firstChild,length=first.textContent.length;if(length<=excess){first.remove();excess-=length;}else{first.textContent=first.textContent.slice(excess);excess=0;}}
    while(output.childNodes.length>200)output.firstChild.remove();
    output.scrollTop=output.scrollHeight;
  }
  function choose(id){
    const prior=selected?.id;selected=rows.find(w=>w.id===id)||null;
    const ready=Boolean(selected?.canUseTerminal);
    panel.classList.toggle('is-connected',ready);el('cliConsole').hidden=!ready;input.disabled=!ready||busy;el('cliRun').disabled=!ready||busy;
    el('cliConnection').textContent=ready?'CONNECTED':selected?'STOPPED':'LOCKED';el('cliAccessStatus').textContent=ready?'Ready':selected?'Stopped':'Locked';
    showWorkspace(selected||rows[0]);
    if(prior!==selected?.id){output.textContent='';history=[];historyIndex=0;input.value='';el('cliNotice').textContent='';if(ready)append('Connected to '+selected.project+'.\nType a command to begin.\n\n','note');}
    el('cliServerName').textContent=selected?.project||'';
    const copy=panel.querySelector('.cli-unlock-copy p'),link=panel.querySelector('.cli-unlock-copy a');
    copy.textContent=selected?'Start your website server in Billing, then refresh this page to connect.':'Create a free website server in Billing to use its command line.';link.textContent=selected?'MANAGE SERVER ↗':'CREATE A SERVER ↗';
  }
  async function refresh(){
    const data=await client.request('workspaces');rows=data.workspaces.filter(w=>w.billingStatus==='active');const servers=rows.filter(w=>w.server&&w.canManageServer);
    const previous=selected?.id;select.replaceChildren();for(const w of servers){const option=document.createElement('option');option.value=w.id;option.textContent=w.project+' · '+w.server.status;select.append(option);}
    select.hidden=!servers.length;const id=servers.find(w=>w.id===previous)?.id||servers.find(w=>w.canUseTerminal)?.id||servers[0]?.id;
    select.value=id||'';choose(id);if(!servers.length)showWorkspace(rows[0]);
  }
  select.addEventListener('change',()=>choose(select.value));
  el('cliClear').addEventListener('click',()=>{output.textContent='';el('cliNotice').textContent='';input.focus();});
  el('cliRefresh').addEventListener('click',async()=>{el('cliRefresh').disabled=true;try{await refresh();el('cliNotice').textContent='Server status refreshed.';}catch(e){el('cliNotice').textContent=e.message;}finally{el('cliRefresh').disabled=false;}});
  input.addEventListener('keydown',event=>{
    if(!['ArrowUp','ArrowDown'].includes(event.key)||!history.length)return;event.preventDefault();historyIndex=Math.max(0,Math.min(history.length,historyIndex+(event.key==='ArrowUp'?-1:1)));input.value=history[historyIndex]||'';
  });
  el('cliCommandForm').addEventListener('submit',async event=>{
    event.preventDefault();const command=input.value.trim();if(busy||!selected?.canUseTerminal||!command)return;
    const id=selected.id;busy=true;panel.classList.add('is-running');input.disabled=true;el('cliRun').disabled=true;select.disabled=true;el('cliRefresh').disabled=true;
    history.push(command);history=history.slice(-50);historyIndex=history.length;append('$ '+command+'\n','command');input.value='';el('cliNotice').textContent='Running…';
    try{
      const result=await client.request('workspaces/'+id+'/server/terminal',{method:'POST',body:JSON.stringify({command})});append(result.output||'');append('\n');
      el('cliNotice').textContent=result.truncated?'Output limited to 64 KB.':result.exitCode===null?'Output returned; the process is still finishing.':result.exitCode===137?'Command ended at its time or memory limit.':result.exitCode?'Exited with code '+result.exitCode+'.':'Command finished.';
    }catch(e){append(e.message+'\n','error');el('cliNotice').textContent=e.message;try{await refresh();}catch{choose(null);}}
    finally{busy=false;panel.classList.remove('is-running');select.disabled=false;el('cliRefresh').disabled=false;input.disabled=!selected?.canUseTerminal;el('cliRun').disabled=input.disabled;if(!input.disabled)input.focus();}
  });
  client.ready.then(async state=>{
    if(state.externalUrl){const url=new URL(state.externalUrl);url.pathname='/dashboard.html';account.href=url.href;account.textContent='OPEN PI ACCOUNT ↗';panel.querySelector('.cli-unlock-copy a').href=url.href;panel.querySelector('.cli-unlock-copy a').textContent='OPEN PI COMMAND LINE ↗';panel.querySelector('.cli-unlock-copy p').textContent='Your server and command line run on the Raspberry Pi. Continue to your account there.';return;}
    if(!state.connected||!state.user)return;
    try{await refresh();}catch{el('cliAccessStatus').textContent='Unavailable';panel.querySelector('.cli-unlock-copy p').textContent='Server status is unavailable. Your workspace records are preserved; refresh to reconnect.';}
  });
})();
