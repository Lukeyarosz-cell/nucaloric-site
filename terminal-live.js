/* Real Docker PTY: ordered input, acknowledged output and terminal escape sequences. */
(()=>{
 const el=id=>document.getElementById(id),consoleEl=el('cliConsole');if(!consoleEl||!window.Terminal)return;
 const ambient=document.body.classList.contains('atelier-dashboard');
 const terminal=new Terminal({allowTransparency:ambient,fontFamily:'"NUCMono", "SFMono-Regular", Consolas, monospace',fontSize:13,lineHeight:1.35,cursorBlink:true,scrollback:2000,convertEol:false,theme:{background:ambient?'#090909c2':'#090909',foreground:'#f1e8ed',cursor:'#ff91bd',selectionBackground:'#ff91bd40',black:'#090909',red:'#fb809e',green:'#b1d9b8',yellow:'#e6d3a8',blue:'#a3bfd8',magenta:'#ff91bd',cyan:'#b1d8da',white:'#eee5eb',brightBlack:'#999099'}}),fit=new FitAddon.FitAddon();
 terminal.loadAddon(fit);const host=document.createElement('div');host.id='cliLiveTerminal';host.setAttribute('aria-label','Interactive server terminal');consoleEl.insertBefore(host,el('cliOutput'));terminal.open(host);
 const controls=document.createElement('div');controls.className='terminal-session-tools';controls.innerHTML='<span id="terminalSessionState" role="status">Choose a running server</span><button type="button" id="terminalReconnect">Reconnect</button><button type="button" id="terminalHelp">Commands</button>';host.before(controls);
 let selected=null,session=null,cursor=0,seq=0,generation=0,queue='',timer=0,inflight=false,resizing=false,localLine=null,prompt=false,line='',lastTail='',aiBusy=false,lastRequest=0;
 const client=window.NUC_BILLING,encoder=new TextEncoder(),decoder=new TextDecoder(),status=el('terminalSessionState');
 const b64=bytes=>btoa(String.fromCharCode(...bytes)),bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
 function write(value){terminal.write(String(value).replace(/\r?\n/g,'\r\n'));}
 async function api(action,body,target=selected){return client.request('workspaces/'+target.id+'/shell/'+action,{method:'POST',body:JSON.stringify(body)});}
 function dimensions(){try{fit.fit();}catch{}return{cols:Math.max(20,Math.min(300,terminal.cols)),rows:Math.max(5,Math.min(120,terminal.rows))};}
 function loading(on){host.classList.toggle('is-connecting',on);if(on)host.classList.remove('is-command-running');}
 async function connect(target){
  const old=session,prior=selected,epoch=++generation;clearTimeout(timer);session=null;queue='';selected=target;terminal.reset();prompt=false;localLine=null;cursor=0;seq=0;inflight=false;lastTail='';
  if(old&&prior)api('close',{session:old},prior).catch(()=>{});
  if(!target?.canUseTerminal){status.textContent='Choose a running server';return;}
  status.textContent='Connecting to '+target.server.nodeName+'…';loading(true);
  try{const result=await api('open',dimensions(),target);if(epoch!==generation){api('close',{session:result.session},target).catch(()=>{});return;}session=result.session;cursor=result.cursor;seq=result.seq;status.textContent=target.server.nodeName+' · /bin/sh';write('\x1b[38;5;218m N U C A L O R I C\x1b[0m\n\n pwd · ls -lah · cd /tmp · /ai · /help\n Ctrl+C interrupts · Ctrl+L clears · Tab completes\n Shared server · 5m idle / 1h session · writable /tmp\n\n');loading(false);pump(epoch);}
  catch(error){if(epoch!==generation)return;loading(false);status.textContent=error.message;write('\n'+error.message+'\n');}
 }
 async function pump(epoch=generation){
  if(epoch!==generation||!session||inflight)return;const delay=450-(Date.now()-lastRequest);if(delay>0){clearTimeout(timer);timer=setTimeout(()=>pump(epoch),delay);return;}lastRequest=Date.now();inflight=true;let hasOutput=false;const outgoing=queue.slice(0,1000);queue=queue.slice(outgoing.length);const nextSeq=outgoing?seq+1:seq;
  try{const d=await api('io',{session,cursor,seq:nextSeq,input:b64(encoder.encode(outgoing))});if(epoch!==generation)return;seq=d.seq;
   if(d.output){hasOutput=true;const data=bytes(d.output);await new Promise(resolve=>terminal.write(data,resolve));cursor=d.cursor;lastTail=(lastTail+decoder.decode(data,{stream:true})).slice(-300);const plain=lastTail.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'');if(/nucaloric:[^\r\n]* \$ $/.test(plain)){prompt=true;line='';host.classList.remove('is-command-running');}}else cursor=d.cursor;
   if(d.closed){session=null;status.textContent='Shell exited · reconnect to continue';return;}
   if(!aiBusy)status.textContent=selected.server.nodeName+' · /bin/sh';
  }catch(error){if(epoch!==generation)return;session=null;status.textContent=error.message;write('\nConnection interrupted. Reconnect to start a new shell.\n');}
  finally{if(epoch===generation){inflight=false;if(session)timer=setTimeout(()=>pump(epoch),queue?40:document.hidden?4000:hasOutput?450:800);}}
 }
 function send(data){if(!session)return;if(queue.length+data.length>8192){status.textContent='Input is busy. Wait for the server.';return;}queue+=data;clearTimeout(timer);if(!inflight)pump();}
 async function slash(command){
  aiBusy=true;status.textContent=command.startsWith('/ai')?'Connecting to local AI…':'Running workspace command…';host.classList.add('is-ai-waiting');
  if(!window.NUC_TERMINAL_COMMAND?.run(command)){write('A workspace request is already running.\n');}
  while(window.NUC_TERMINAL_COMMAND?.busy())await new Promise(r=>setTimeout(r,100));
  aiBusy=false;host.classList.remove('is-ai-waiting');if(selected)status.textContent=selected.server.nodeName+' · /bin/sh';send('\r');
 }
 terminal.onData(data=>{
  if(!session){return;}if(aiBusy){if(data==='\x03')write('AI request continues on the worker. Open Chat to check its result.\n');return;}
  if(localLine!==null){
   if(data==='\r'){const command=localLine;localLine=null;if(/^\/(?:ai|files|compact|credits|server|wallet|github|help)(?:\s|$)/.test(command)){write('\n');slash(command);}else{terminal.write('\r\x1b[2K');prompt=false;line='';host.classList.add('is-command-running');send(command+'\r');}return;}
   if(data==='\x03'){localLine=null;write('^C\n');send('\r');return;}
   if(data==='\x7f'){if(localLine.length){localLine=localLine.slice(0,-1);terminal.write('\b \b');}return;}
   if(!/[\x00-\x1f\x7f]/.test(data)&&localLine.length+data.length<=1500){localLine+=data;terminal.write(data);}return;
  }
  if(prompt&&line===''&&data.startsWith('/')&&!/[\r\n]/.test(data)){localLine=data;terminal.write(data);return;}
  if(data.includes('\r')||data.includes('\n')){prompt=false;line='';host.classList.add('is-command-running');}
  else if(data==='\x03'){prompt=false;line='';queue='';}
  else if(data==='\x7f')line=line.slice(0,-1);else line+=data;
  send(data);
 });
 terminal.attachCustomKeyEventHandler(event=>{if(event.type==='keydown'&&event.ctrlKey&&event.shiftKey&&event.code==='KeyC'){navigator.clipboard?.writeText(terminal.getSelection());return false;}return true;});
 el('terminalReconnect').addEventListener('click',()=>connect(selected));el('terminalHelp').addEventListener('click',()=>{if(!aiBusy)window.NUC_TERMINAL_COMMAND?.run('/help');});
 async function resize(){const size=dimensions();if(!session||resizing)return;resizing=true;try{await api('resize',{session,...size});}catch{}finally{resizing=false;}}
 let resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,180);}).observe(host);
 window.addEventListener('nuc-tool-focus',e=>{if(e.detail==='terminal')setTimeout(()=>{resize();terminal.focus();},100);});
 window.addEventListener('nuc-runtime-change',()=>{const id=window.NUC_DEV_RUNTIME?.selected(),target=window.NUC_DEV_RUNTIME?.list().find(w=>w.id===id);if(target?.id!==selected?.id||Boolean(target?.canUseTerminal)!==Boolean(selected?.canUseTerminal))connect(target);});
 window.addEventListener('pagehide',()=>{clearTimeout(timer);if(session&&selected)fetch('/billing/nucaloric/api/workspaces/'+selected.id+'/shell/close',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'Content-Type':'application/json','X-CSRF-TOKEN':client.state.csrfToken},body:JSON.stringify({session})}).catch(()=>{});});
 window.NUC_TERMINAL={write,clear:()=>terminal.clear(),change:connect,focus:()=>terminal.focus(),prefill(command){
  if(!session||!prompt||line!==''||localLine!==null||aiBusy||typeof command!=='string'||/[\x00-\x1f\x7f]/.test(command)||command.length>4096)return false;
  line=command;send(command);terminal.focus();return true;
 },get session(){return session;},get terminal(){return terminal;}};
 client.ready.then(()=>{const target=window.NUC_DEV_RUNTIME?.list().find(w=>w.id===window.NUC_DEV_RUNTIME.selected());if(target?.canUseTerminal&&!selected)connect(target);});
})();
