(() => {
  const name=document.getElementById('dashboardWorkspaceName'),client=window.NUC_BILLING;
  if(!name||!client)return;
  const card=name.closest('.account-project-card'),panel=document.querySelector('.cli-workspace');
  const el=id=>document.getElementById(id),select=el('cliServerSelect'),input=el('cliCommand'),output=el('cliOutput');
  const account=document.createElement('a');account.className='product-primary';account.href='billing.html';account.textContent='ACCOUNT & BILLING ↗';account.style.marginTop='12px';card.append(account);
  const requestedServer=new URLSearchParams(location.search).get('server');
  const activity=window.NUC_WORK_ACTIVITY('cliActivity',panel.querySelector('.cli-gated-body'),el('cliConsole'));
  panel.querySelector('.cli-unlock-copy p').textContent='Sign in to create or manage a Free website server. Its command line appears here when the server is running.';
  panel.querySelector('.cli-unlock-copy a').textContent='OPEN SERVER ACCOUNT ↗';
  let refreshing=null;
  let aiCost=0;let rows=[],selected=null,busy=false,history=[],historyIndex=0,cwd='/usr/share/nginx/html',aiCoin=null,aiModels=[],attachments=[],compact=false;
  const controls=document.createElement('div');controls.className='cli-ai-controls';controls.hidden=true;controls.innerHTML='<label>MODEL <select id=cliAiModel aria-label="Terminal AI model"></select></label><label>CONTEXT <select id=cliAiContext aria-label="Terminal AI context"><option value=2048>2048 tokens</option><option value=1024>1024 tokens</option></select></label>';el('cliConsole').insertBefore(controls,el('cliOutput'));
  function showWorkspace(workspace){
    if(!workspace)return;
    name.textContent=workspace.project;
    el('workspacePlanStatus').textContent=workspace.server?workspace.server.status==='running'?'Active server':'Server '+workspace.server.status:'Enrolled';
    el('workspacePlanBadge').textContent=workspace.server?.status==='running'?'FREE SERVER / RUNNING':workspace.server?'FREE SERVER / '+workspace.server.status.toUpperCase():'FREE ENROLLED';
    el('dashboardWorkspaceNote').textContent=workspace.server?`${workspace.server.nodeName||'Main Pi'} website slot ${workspace.server.slot} · ${workspace.server.status}.`:workspace.machineStatus==='awaiting-pairing'?'Saved in your account · Awaiting machine pairing.':'Saved in your account · Awaiting a configured server.';
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
    if(prior!==selected?.id){output.textContent='';history=[];historyIndex=0;input.value='';el('cliNotice').textContent='';if(ready){cwd='/usr/share/nginx/html';const art=document.createElement('span');art.className='cli-login-art';art.setAttribute('aria-label','NUCALORIC');output.append(art);append('Welcome '+(client.state.user?.name||'builder')+' · '+selected.project+'\n\nStarter commands: pwd · ls -lah · cat index.html\nAI: /ai · /ai your question · /compact context\nFiles: /files · /files put notes.md your notes\nType help for all commands.\n\n','note');}}
    el('cliServerName').textContent=selected?.project||'';window.dispatchEvent(new CustomEvent('nuc-runtime-change',{detail:{selectedId:selected?.id||null}}));
    const copy=panel.querySelector('.cli-unlock-copy p'),link=panel.querySelector('.cli-unlock-copy a');
    copy.textContent=selected?'Start your website server in Billing, then refresh this page to connect.':'Create a free website server in Billing to use its command line.';link.textContent=selected?'MANAGE SERVER ↗':'CREATE A SERVER ↗';
  }
  async function readServers(){
    const data=await client.request('workspaces');rows=data.workspaces.filter(w=>w.billingStatus==='active');const servers=rows.filter(w=>w.server&&w.canManageServer);
    const previous=selected?.id;select.replaceChildren();for(const w of servers){const option=document.createElement('option');option.value=w.id;option.textContent=w.project+' · '+w.server.status;select.append(option);}
    select.hidden=!servers.length;const id=servers.find(w=>w.id===previous)?.id||servers.find(w=>w.id===requestedServer)?.id||servers.find(w=>w.canUseTerminal)?.id||servers[0]?.id;
    select.value=id||'';choose(id);if(!servers.length)showWorkspace(rows[0]);
  }
  function refresh(){
    if(refreshing)return refreshing;
    if(busy)return Promise.reject(Error('Wait for the current command before refreshing your server.'));
    activity.set('connecting','Checking your server','Reading your owned workspaces from the Main Pi.');input.disabled=true;el('cliRun').disabled=true;select.disabled=true;
    panel.setAttribute('aria-busy','true');el('cliConnection').textContent='CONNECTING';
    refreshing=readServers().then(()=>{activity.set('idle');}).catch(error=>{
      activity.set('error','Server status unavailable',error.message);el('cliConnection').textContent='UNAVAILABLE';throw error;
    }).finally(()=>{refreshing=null;panel.setAttribute('aria-busy','false');select.disabled=false;input.disabled=!selected?.canUseTerminal;el('cliRun').disabled=input.disabled;});
    return refreshing;
  }
  select.addEventListener('change',()=>choose(select.value));
  el('cliClear').addEventListener('click',()=>{output.textContent='';el('cliNotice').textContent='';if(!busy&&!refreshing)activity.set('idle');input.focus();});
  el('cliRefresh').addEventListener('click',async()=>{el('cliRefresh').disabled=true;try{await refresh();el('cliNotice').textContent='Server status refreshed.';}catch(e){el('cliNotice').textContent=e.message;}finally{el('cliRefresh').disabled=false;}});
  const quote=value=>"'"+value.replace(/'/g,"'\\''")+"'";
  const api=(path,data)=>client.request(path,data===undefined?{}:{method:'POST',body:JSON.stringify(data)});
  const fileApi=(name='',data)=>api('files'+(name?'/'+encodeURIComponent(name):''),data);
  async function setupAI(){
    const data=await api('ai/coins');aiCost=data.creditsPerMessage||0;aiModels=(data.ai.models||[]).filter(m=>m.installed);
    if(!aiModels.length)throw Error('The local AI worker is unavailable.');
    if(!aiCoin){const chosen=document.querySelector('#aiCoinSelect')?.value;aiCoin=data.coins.find(c=>c.id===chosen)||data.coins[0];
      if(!aiCoin)aiCoin=(await api('ai/coins',{name:(selected.project+' developer').slice(0,60),ticker:'DEV',story:'Developer workspace for '+selected.project+'. Help with NUCALORIC, useful project planning and website code.',builders:40,community:30})).coin;
    }
    const before=el('cliAiModel').value;el('cliAiModel').replaceChildren();for(const m of aiModels){const o=document.createElement('option');o.value=m.id;o.textContent=m.name;el('cliAiModel').append(o);}if(aiModels.some(m=>m.id===before))el('cliAiModel').value=before;
    controls.hidden=false;if(aiCost)append(aiCost+' AI credits per request. Failed jobs are refunded.\n','note');return aiCoin;
  }
  function help(){append('NUCALORIC commands\n  pwd, ls -lah, cat index.html, cd /tmp, whoami, df -h\n  clear                 clear this terminal\n  /wallet               connect and link a Solana wallet\n  /github               open your creator connections\n  /credits              show AI and server balances\n  /server stats         inspect your container usage\n  /server logs          read your container logs\n  /ai                   choose model and context\n  /ai model tiny|small|reasoning|code  switch local model\n  /ai context 1024|2048 choose context budget\n  /ai <question>        chat in this terminal\n  /ai attach notes.md   include up to three private files\n  /ai detach            remove file attachments\n  /compact context      use 1024 tokens and shorter recent history\n  /files                list your private account files\n  /files pull name      copy an owned website file into AI storage\n  /files read name      read an owned text file\n  /files put name text  save a text file on the main USB drive\n  /files rm name        remove an owned text file\n\nLimits: one AI job per account, 20 messages/hour. Chat: 192 tokens; code: 384; reasoning: 768 total + bounded final answer.\nFiles: 20 files/account, 20,000 characters/file. Website shell: 8s/64KB.\nContext compaction reduces prompt size; saved files and history stay intact.\nCtrl+L clear · ↑/↓ history · Tab complete commands.\n\n','note');}
  input.addEventListener('keydown',event=>{
    if(event.ctrlKey&&event.key.toLowerCase()==='l'){event.preventDefault();output.textContent='';return;}
    if(event.ctrlKey&&event.key.toLowerCase()==='c'){event.preventDefault();input.value='';append('^C\n','note');return;}
    if(event.key==='Tab'){event.preventDefault();const choices=['pwd','ls -lah','cat index.html','cd /tmp','whoami','df -h','clear','help','/wallet','/github','/credits','/server stats','/server logs','/ai','/ai model tiny','/ai model small','/ai model reasoning','/ai model code','/ai context 1024','/ai context 2048','/compact context','/files','/files read','/files put','/files pull'];const matches=choices.filter(c=>c.startsWith(input.value));if(matches.length===1)input.value=matches[0];else if(matches.length>1)append(matches.join('   ')+'\n','note');return;}
    if(!['ArrowUp','ArrowDown'].includes(event.key)||!history.length)return;event.preventDefault();historyIndex=Math.max(0,Math.min(history.length,historyIndex+(event.key==='ArrowUp'?-1:1)));input.value=history[historyIndex]||'';
  });
  el('cliCommandForm').addEventListener('submit',async event=>{
    event.preventDefault();const command=input.value.trim();if(busy||refreshing||!selected?.canUseTerminal||!command)return;
    const id=selected.id;busy=true;activity.set('server','Waiting for your server',selected.server.nodeName+' · running your command');panel.setAttribute('aria-busy','true');panel.classList.add('is-running');input.disabled=true;el('cliRun').disabled=true;select.disabled=true;el('cliRefresh').disabled=true;el('cliAiModel').disabled=true;el('cliAiContext').disabled=true;
    history.push(command);history=history.slice(-50);historyIndex=history.length;append('nucaloric:'+cwd+' $ '+command+'\n','command');input.value='';el('cliNotice').textContent='Running…';
    try{
      if(command==='clear'){output.textContent='';}
      else if(command==='help'||command==='/help')help();
      else if(command==='/wallet'){window.NUC_WALLET.open();append('Approve the connection and account-link message in your wallet.\n','note');}
      else if(command==='/github'){window.NUC_CONNECTIONS.open();append('GitHub connections opened in your dashboard.\n','note');}
      else if(command==='/credits'){const d=await api('credits');append('AI: '+d.balances.ai+' credits · Server: '+d.balances.server+' credits\nCurrent Free slots remain free. AI cost: '+d.aiCreditsPerMessage+' credits/message.\n','note');}
      else if(command==='/server stats'||command==='/server logs'){const d=await api('workspaces/'+id+'/server/'+command.split(' ')[1],{});append((d.output===undefined?JSON.stringify(d,null,2):d.output)+'\n');}
      else if(command==='/compact context'||command==='/conpact context'){compact=true;el('cliAiContext').value='1024';append('Context compacted: 1024-token budget, two recent messages, shorter notes and file excerpts. Saved history and files preserved.\n','note');}
      else if(command.startsWith('/files')){
        const match=command.match(/^\/files(?:\s+(read|put|rm|pull)\s+([^\s]+)(?:\s+([\s\S]+))?)?$/);if(!match)throw Error('Use /files, /files read name, /files pull name, /files put name text, or /files rm name.');
        if(!match[1]){const d=await fileApi();append(d.files.map(f=>f.name+'  '+f.bytes+' bytes').join('\n')||'No private files yet.');append('\nMain Pi USB storage · 20 files/account · 20,000 characters/file\n','note');}
        else if(match[1]==='read')append((await fileApi(match[2])).content+'\n');
        else if(match[1]==='pull'){const name=match[2];if(!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(name)||name.includes('..'))throw Error('Use a simple website file name without paths.');const r=await api('workspaces/'+id+'/server/terminal',{command:'head -c 20000 -- '+quote('/usr/share/nginx/html/'+name)});if(r.exitCode!==0)throw Error('That file could not be read from your selected website.');await fileApi(name,{content:r.output});attachments=[name];append('Copied '+name+' from your owned website to private USB storage and attached it to AI.\n','note');}
        else if(match[1]==='put'){if(!match[3])throw Error('Add text after the file name.');const d=await fileApi(match[2],{content:match[3]});append('Saved '+d.name+' ('+d.bytes+' bytes).\n','note');}
        else {await api('files/'+encodeURIComponent(match[2])+'/delete',{});attachments=attachments.filter(n=>n!==match[2]);append('Removed '+match[2]+'.\n','note');}
      }
      else if(command==='/ai'||command.startsWith('/ai ')){
        activity.set('ai-setup','Connecting to local AI','Checking models and private context.');await setupAI();const rest=command.slice(3).trim();
        if(!rest)append('Choose your model and context above. Then /ai <question>.\nShared worker limits: 20 messages/hour, one pending job per account. Chat: 192 tokens; code: 384; reasoning: 768 total. Reasoning can take up to three minutes.\nContext and storage are bounded. /compact context reduces the next prompt without deleting saved data.\n','note');
        else if(/^model (tiny|small|reasoning|code)$/.test(rest)){el('cliAiModel').value='nucaloric:'+rest.split(' ')[1];if(!el('cliAiModel').value)throw Error('That model is unavailable.');append('Selected '+el('cliAiModel').value+'.\n','note');}
        else if(/^context (1024|2048)$/.test(rest)){el('cliAiContext').value=rest.split(' ')[1];compact=el('cliAiContext').value==='1024';append('Context budget: '+el('cliAiContext').value+' tokens.\n','note');}
        else if(rest.startsWith('attach ')){attachments=rest.slice(7).split(',').map(n=>n.trim()).filter(Boolean);if(attachments.length>3)throw Error('Attach at most three owned files.');for(const n of attachments)await fileApi(n);append('Attached: '+attachments.join(', ')+'.\n','note');}
        else if(rest==='detach'){attachments=[];append('Files detached.\n','note');}
        else {
          activity.set('ai-queued','Sending to the Distiller',el('cliAiModel').selectedOptions[0]?.textContent||'Local model');const coinId=aiCoin.id;await api('ai/coins/'+coinId+'/chat',{requestKey:client.uuid(),model:el('cliAiModel').value,message:rest,contextTokens:Number(el('cliAiContext').value),compact:compact||el('cliAiContext').value==='1024',files:attachments});el('cliNotice').textContent='Local AI is answering…';activity.set('ai-waiting','Waiting for local AI','Queued or generating on Distiller · '+el('cliAiModel').selectedOptions[0]?.textContent);
          const deadline=Date.now()+((aiModels.find(m=>m.id===el('cliAiModel').value)?.timeoutSeconds||90)+25)*1000;let d;while(Date.now()<deadline){await new Promise(resolve=>setTimeout(resolve,3000));d=await api('ai/coins/'+coinId);if(!d.coin.pendingJob)break;}
          if(d?.coin.pendingJob)throw Error('The reply is still running. Open Coin AI to check it.');if(d?.coin.lastError)throw Error(d.coin.lastError);const reply=[...d.messages].reverse().find(m=>m.role==='assistant');if(!reply)throw Error('No reply available yet.');append('\n'+el('cliAiModel').value+' > '+reply.content+'\n\n','ai');
        }
      }
      else {
        const cd=command.match(/^cd(?:\s+(.+))?$/);const shell=cd?'cd '+quote(cwd)+' && cd '+quote(cd[1]||'/usr/share/nginx/html')+' && pwd':'cd '+quote(cwd)+' && '+command;
        const result=await api('workspaces/'+id+'/server/terminal',{command:shell});
        if(cd&&result.exitCode===0){const next=result.output.trim();if(/^\/[a-zA-Z0-9_./-]*$/.test(next)){cwd=next;panel.querySelector('.cli-directory span:last-child').textContent=cwd;}}
        append(result.output||'');append('\n');el('cliNotice').textContent=result.truncated?'Output limited to 64 KB.':result.exitCode?'Exited with code '+result.exitCode+'.':'Ready.';
      }
      if(command.startsWith('/'))el('cliNotice').textContent='Ready.';
    }catch(e){activity.set('error','Request could not finish',e.message);append(e.message+'\n','error');el('cliNotice').textContent=e.message;}
    finally{if(el('cliActivity').dataset.phase!=='error')activity.set('idle');panel.setAttribute('aria-busy','false');busy=false;panel.classList.remove('is-running');select.disabled=false;el('cliRefresh').disabled=false;el('cliAiModel').disabled=false;el('cliAiContext').disabled=false;input.disabled=!selected?.canUseTerminal;el('cliRun').disabled=input.disabled;if(!input.disabled&&!document.querySelector('#deskManager')?.open)input.focus({preventScroll:true});}
  });
  window.NUC_DEV_RUNTIME={list:()=>structuredClone(rows),selected:()=>selected?.id||null,select:id=>{if(busy||refreshing)throw Error('Wait for your current server request to finish before changing workspace.');if(!rows.some(w=>w.id===id&&w.canManageServer&&w.server))throw Error('Choose your provisioned website.');select.value=id;choose(id);},refresh};
  client.ready.then(async state=>{
    if(state.externalUrl){const url=new URL(state.externalUrl);url.pathname='/dashboard.html';account.href=url.href;account.textContent='OPEN PI ACCOUNT ↗';panel.querySelector('.cli-unlock-copy a').href=url.href;panel.querySelector('.cli-unlock-copy a').textContent='OPEN PI COMMAND LINE ↗';panel.querySelector('.cli-unlock-copy p').textContent='Your server and command line run on the Raspberry Pi. Continue to your account there.';return;}
    if(!state.connected||!state.user)return;
    try{await refresh();}catch{el('cliAccessStatus').textContent='Unavailable';panel.querySelector('.cli-unlock-copy p').textContent='Server status is unavailable. Your workspace records are preserved; refresh to reconnect.';}
  });
})();
