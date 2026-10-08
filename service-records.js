/* Owned service cards shared by Billing and Services. All actions use native sessions. */
(() => {
  const node=(tag,text='',className='')=>{const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;};
  const states={running:'Running',stopped:'Stopped',failed:'Needs attention',missing:'Container missing',unavailable:'Status unavailable','awaiting-pairing':'Hardware plan','awaiting-server':'Not allocated'};
  function render(container,workspaces,{notify,reload,onCancel}){
    container.replaceChildren();
    const active=workspaces.filter(w=>!['cancelled','unavailable'].includes(w.billingStatus)),past=workspaces.filter(w=>['cancelled','unavailable'].includes(w.billingStatus));
    function record(w){
      const card=node('article','','billing-record');card.dataset.workspaceId=w.id;
      const header=node('div','','billing-record-head'),identity=node('div','','service-identity');identity.append(node('span',w.server?'WEBSITE SERVER':w.plan.workload==='model'?'MODEL PLAN':'WORKSPACE PLAN','service-record-kicker'),node('h3',w.project));
      const status=w.billingStatus==='cancelled'?'Cancelled':w.billingStatus!=='active'?w.billingStatus:states[w.machineStatus]||'Saved plan';const badge=node('span',status,'billing-badge');badge.dataset.status=w.machineStatus;header.append(identity,badge);card.append(header);
      const details=node('dl','','billing-details');
      const price=w.price===null?'Unavailable':Number(w.price)===0?'Free':`${w.currency} ${Number(w.price).toFixed(2)}`;
      if(w.term)card.append(node('p',`${w.term.tier} · $${(w.term.price_cents/100).toFixed(2)} / month · Paid until ${new Date(w.term.paidUntil).toLocaleDateString()}`,'billing-muted'));
      const fields=w.server?[['NODE',w.server.nodeName||'Main Pi'],['PLAN',price],['RAM',`${w.server.memoryMB} MB`],['CPU',`${w.server.cpu} CPU`]]:[['PLAN',price],['ACCESS',w.plan.source==='own'?'Pairing pending':w.plan.workload==='model'?'Shared local chat':'No server allocated']];
      for(const [label,value] of fields){const div=node('div');div.append(node('dt',label),node('dd',value));details.append(div);}card.append(details);
      const actions=node('div','','billing-actions service-main-actions'),more=node('details','','service-record-more'),moreBody=node('div','','service-more-actions');more.append(node('summary','Details & actions'),moreBody);
      const action=(kind,label,target=actions)=>{const button=node('button',label,'billing-link');button.type='button';button.addEventListener('click',async()=>{if(kind==='delete'&&!confirm('Remove this website server and free its slot? Your billing enrollment will remain.'))return;button.disabled=true;try{await window.NUC_BILLING.request('workspaces/'+w.id+'/server/'+kind,{method:'POST',body:'{}'});await reload();notify({create:'Website server allocated.',start:'Server started.',stop:'Server stopped.',delete:'Server removed. Its slot is available again.'}[kind]);}catch(e){notify(e.message);button.disabled=false;}});target.append(button);};
      if(w.term&&w.billingStatus!=='cancelled'){const button=node('button','Renew one month ↗','billing-link');button.type='button';let key=window.NUC_BILLING.uuid();button.addEventListener('click',async()=>{if(!confirm(`Use $${(w.term.price_cents/100).toFixed(2)} of server balance to renew this server for one calendar month?`))return;button.disabled=true;try{const d=await window.NUC_BILLING.request('commerce/servers/'+w.id+'/renew',{method:'POST',body:JSON.stringify({requestKey:key})});await reload();notify(d.restartError?'Renewed. '+d.restartError:'Server renewed for one month.');window.dispatchEvent(new Event('nuc-commerce-updated'));}catch(e){notify(e.message);}finally{button.disabled=false;}});actions.append(button);}
      if(w.canAllocate)action('create','Allocate website server');
      if(w.server){
        if(w.server.url){const url=new URL(w.server.url);if(['http:','https:'].includes(url.protocol)){const a=node('a','Open website ↗','billing-primary service-open-site');a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';actions.append(a);}}
        if(w.canUseTerminal){const link=node('a','Command line ↗','billing-link');link.href='dashboard.html?server='+encodeURIComponent(w.id);actions.append(link);}
        if(w.server.nodeId==='distiller'){const link=node('a','Coin AI ↗','billing-link');link.href='dashboard.html#coinAI';actions.append(link);}
        if(w.canManageServer){action(w.server.status==='running'?'stop':'start',w.server.status==='running'?'Stop server':'Start server');
          const editor=node('details','','billing-editor');editor.append(node('summary','Publish a page ↗'));const form=node('form'),label=node('label','Website HTML'),input=node('textarea');input.id='billingHtml-'+w.id;input.required=true;input.maxLength=1048576;input.rows=7;input.placeholder='<!doctype html>…';label.htmlFor=input.id;const help=node('p','One HTML page up to 1 MB. Include your CSS and scripts in the page.','billing-muted'),submit=node('button','Publish page ↗','billing-primary');submit.type='submit';form.append(label,input,help,submit);editor.append(form);card.append(editor);form.addEventListener('submit',async event=>{event.preventDefault();submit.disabled=true;try{await window.NUC_BILLING.request('workspaces/'+w.id+'/server/publish',{method:'POST',body:JSON.stringify({html:input.value})});notify('Website page published.');}catch(e){notify(e.message);}finally{submit.disabled=false;}});
        }
        action('delete','Remove server',moreBody);
      }
      if(!w.server&&w.plan.workload==='model'){const link=node('a','Open local coin AI ↗','billing-primary');link.href='dashboard.html#coinAI';actions.append(link);}
      const reference=node('p',`Order #${w.orderId} · Service #${w.serviceId??'unavailable'}`,'billing-muted');moreBody.append(reference);
      if(w.serviceUrl){const url=new URL(w.serviceUrl,location.href);if(url.origin===location.origin&&url.pathname.startsWith('/billing/')){const a=node('a','View billing record ↗','billing-link');a.href=url.href;moreBody.append(a);}}
      if(w.canCancel){const button=node('button','Cancel enrollment','billing-link service-cancel');button.type='button';button.addEventListener('click',()=>onCancel(w));moreBody.append(button);}
      card.append(actions,more);return card;
    }
    if(!active.length){const empty=node('div','','service-empty');empty.append(node('span','↗','service-empty-mark'),node('h3','Your first server starts here.'),node('p','Purchase a monthly server in Billing, then manage it from your account.','billing-muted'));container.append(empty);}
    for(const w of active)container.append(record(w));
    if(past.length){const history=node('details','','service-history');history.append(node('summary',`Past workspaces · ${past.length}`));const list=node('div','','service-history-list');for(const w of past)list.append(record(w));history.append(list);container.append(history);}
  }
  window.NUC_SERVICE_RECORDS={render};
})();
