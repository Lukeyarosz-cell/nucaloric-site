/* Shared file and installation feedback. Progress follows completed work, never a timer. */
(() => {
  const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  let dialog,active=false;
  const size=n=>n===undefined?'Verified by your server':n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';
  function create(){
    dialog=el('dialog','transfer-dialog');dialog.setAttribute('aria-labelledby','transferTitle');
    dialog.innerHTML='<div class="transfer-top"><span>NUCALORIC / WORKSPACE TRANSFER</span><button type="button" data-transfer-close aria-label="Close transfer status">×</button></div><div class="transfer-file"><div class="transfer-document" aria-hidden="true"><span data-transfer-badge>FILE</span></div><div><span class="transfer-kind"></span><h2 id="transferTitle"></h2><p class="transfer-meta"></p></div></div><div class="transfer-progress"><div><span class="transfer-phase" role="status" aria-live="polite"></span><strong class="transfer-value"></strong></div><progress aria-label="Transfer progress"></progress></div><div class="transfer-checks"><span>PREREQUISITES</span><ul></ul></div><p class="transfer-note" role="status"></p><div class="transfer-foot"><span></span><button type="button" data-transfer-dismiss>Done ↗</button></div>';
    document.body.append(dialog);
    dialog.querySelectorAll('[data-transfer-close],[data-transfer-dismiss]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
    dialog.addEventListener('close',()=>{if(dialog._opener?.isConnected)dialog._opener.focus({preventScroll:true});});
    return dialog;
  }
  async function run(options){
    if(active)throw Error('A transfer is already running. Wait for it to finish.');
    active=true;const d=dialog||create();d._opener=document.activeElement;d.dataset.state='checking';
    const q=s=>d.querySelector(s),progress=q('progress'),phase=q('.transfer-phase'),value=q('.transfer-value');
    q('#transferTitle').textContent=options.title;q('.transfer-kind').textContent=options.kind||'FILE TRANSFER';
    q('[data-transfer-badge]').textContent=options.badge||'FILE';q('.transfer-meta').textContent=size(options.bytes)+' · '+(options.destination||'Your workspace');
    q('.transfer-note').textContent=options.note||'Checks complete before your files are changed.';q('.transfer-foot span').textContent=options.destination||'Your workspace';
    q('[data-transfer-dismiss]').textContent='Hide status ↗';q('[data-transfer-close]').setAttribute('aria-label','Hide transfer status');
    const list=q('.transfer-checks ul');list.replaceChildren();
    function checks(rows){list.replaceChildren(...rows.map(r=>{const li=el('li','');li.dataset.result=r.ok===true?'pass':r.ok===false?'fail':'pending';li.append(el('i','',r.ok===true?'✓':r.ok===false?'×':'·'),el('span','',r.label));return li;}));}
    function update(text,fraction){phase.textContent=text;if(Number.isFinite(fraction)){progress.max=1;progress.value=Math.max(0,Math.min(1,fraction));value.textContent=Math.round(progress.value*100)+'%';}else{progress.removeAttribute('value');value.textContent='';}}
    update('Checking prerequisites…');checks(options.requirements||[]);if(!d.open)d.showModal();
    try{
      const requirements=options.verify?await options.verify():options.requirements||[];checks(requirements);
      const failure=requirements.find(r=>r.ok===false);if(failure)throw Error(failure.message||failure.label);
      d.dataset.state='working';update(options.phase||'Transferring…');
      const result=await options.task(update);checks(requirements.map(r=>({...r,ok:r.ok===null?true:r.ok}))); 
      d.dataset.state='complete';update(options.success||'Transfer complete',1);q('.transfer-note').textContent=options.completeNote||'Your workspace is ready.';q('[data-transfer-dismiss]').textContent='Done ↗';q('[data-transfer-close]').setAttribute('aria-label','Close transfer status');
      return result;
    }catch(error){d.dataset.state='error';update('Could not finish');progress.value=0;value.textContent='';q('.transfer-note').textContent=error.message||'Please try again.';q('[data-transfer-dismiss]').textContent='Close ↗';throw error;}
    finally{active=false;}
  }
  const read=(file,update,asDataURL=false)=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onprogress=e=>update('Reading your file…',e.lengthComputable?e.loaded/e.total:undefined);reader.onerror=()=>reject(Error('This file could not be read.'));reader.onload=()=>resolve(reader.result);asDataURL?reader.readAsDataURL(file):reader.readAsText(file);});
  window.NUC_TRANSFER={run,read,size};
})();
