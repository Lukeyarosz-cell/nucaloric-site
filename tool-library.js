/* One account-owned app library, shared by the marketplace and workspace pages. */
(() => {
 const client=window.NUC_BILLING,deviceKey='nucToolLibraryV1';
 const state={catalog:[],apps:[],workspaces:[],mode:'loading',error:null};let queue=Promise.resolve();
 const byId=id=>state.catalog.find(app=>app.id===id);
 function normalize(value){if(value?.version!==1||!Array.isArray(value.apps))throw Error('This app library could not be read. Your saved library was kept.');return value.apps.filter(x=>byId(x.id)&&typeof x.addedAt==='string'&&x.addedAt.length<40&&(!x.workspaceId||/^[a-f\d-]{36}$/i.test(x.workspaceId))).slice(0,64).map(x=>({id:x.id,addedAt:x.addedAt,workspaceId:x.workspaceId||null}));}
 function device(strict=false){try{const raw=localStorage.getItem(deviceKey);return raw?normalize(JSON.parse(raw)):[];}catch{if(strict)throw Error('This device library could not be read. Your saved data was kept.');return[];}}
 function emit(){window.dispatchEvent(new CustomEvent('nuc-tools-change',{detail:state}));document.querySelectorAll('[data-tools-count]').forEach(e=>e.textContent=state.apps.length);}
 const ready=(async()=>{try{
  const response=await fetch('data/tool-catalog.json',{cache:'no-cache'});if(!response.ok)throw Error('The toolbox catalog could not be read.');state.catalog=(await response.json()).apps;
  await client?.ready;
  if(client?.state.user){state.mode='account';const [library,workspaces]=await Promise.all([client.request('apps'),client.request('workspaces')]);state.apps=normalize(library);state.workspaces=workspaces.workspaces||[];}
  else{state.mode='device';state.apps=device(true);}
 }catch(e){state.error=e.message;state.mode='unavailable';}emit();return state;})();
 function mutate(operation,id,workspaceId=null){const task=queue.catch(()=>{}).then(async()=>{
  await ready;if(state.mode==='unavailable')throw Error(state.error||'Your app library is temporarily unavailable.');if(!byId(id))throw Error('Choose a tool from this catalog.');
  if(workspaceId&&!state.workspaces.some(w=>w.id===workspaceId))throw Error('Choose one of your own server workspaces.');
  if(state.mode==='account'){
   const data=await client.request('apps/'+encodeURIComponent(id)+(operation==='remove'?'/remove':''),{method:'POST',body:JSON.stringify({workspaceId})});state.apps=normalize(data);
  }else{
   const next=device(true),index=next.findIndex(x=>x.id===id);if(operation==='remove'){if(index>=0)next.splice(index,1);}else if(index<0)next.push({id,addedAt:new Date().toISOString(),workspaceId:null});else next[index].workspaceId=null;
   try{localStorage.setItem(deviceKey,JSON.stringify({version:1,apps:next}));}catch{throw Error('This browser could not save your app library. Try signing in or free up browser storage.');}state.apps=next;
  }state.error=null;emit();return state;
 });queue=task;return task;}
 window.NUC_TOOL_LIBRARY={state,ready,byId,add:id=>mutate('add',id),remove:id=>mutate('remove',id),assign:(id,workspaceId)=>mutate('add',id,workspaceId),device,async importDevice(){await ready;const local=device();for(const app of local)if(!state.apps.some(x=>x.id===app.id))await mutate('add',app.id);return state;}};
 const element=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 function mountLibrary(){
  let host=document.querySelector('#deskTools');const dashboard=!!host;
  if(!host&&document.querySelector('[data-billing-workspace],[data-services-workspace]')){host=element('section','account-app-library');const main=document.querySelector('main .wrap')||document.querySelector('main');main?.append(host);}
  if(!host)return;
  const module=element('section','workspace-app-library');host.append(module);const title=element('h3','','Your app library.'),copy=element('p','app-library-copy','Add the tools you want to use. Set them up when you’re ready.'),link=element('a','app-library-link','Find a few good tools ↗');link.href='tools.html?library=1';module.append(title,copy,link);
  const list=element('div','workspace-app-list'),notice=element('p','app-library-status');notice.setAttribute('role','status');module.append(list,notice);
  function render(){list.replaceChildren();if(state.mode==='loading'){notice.textContent='Reading your app library…';return;}if(state.error){notice.textContent=state.error;return;}notice.textContent=state.mode==='account'?'Saved with your account.':'Saved on this device. Sign in to keep an account library.';
   if(!state.apps.length){list.append(element('p','app-library-empty','Your next useful tool belongs here.'));return;}
   for(const record of state.apps){const app=byId(record.id),row=element('div','workspace-app-row'),logo=element('img','');logo.src=app.logo;logo.alt='';logo.width=28;logo.height=28;const text=element('div',''),name=element('strong','',app.name);const workspace=state.workspaces.find(w=>w.id===record.workspaceId);text.append(name,element('small','',workspace?'For '+workspace.project+' · setup next':record.workspaceId?'Server unavailable · choose a new location':'In your profile · setup next'));const setup=element('a','','Set up ↗');setup.href=app.setupPath||app.setupUrl;if(!app.setupPath){setup.target='_blank';setup.rel='noopener noreferrer';}row.append(logo,text,setup);list.append(row);}
  }addEventListener('nuc-tools-change',render);render();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountLibrary,{once:true});else mountLibrary();
 addEventListener('storage',e=>{if(e.key===deviceKey&&state.mode==='device'){try{state.apps=device(true);state.error=null;}catch(error){state.error=error.message;state.mode='unavailable';}emit();}});
})();
