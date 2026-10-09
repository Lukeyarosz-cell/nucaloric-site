/* A real local project library with portable backups and recoverable archiving. */
(() => {
 const KEY='nucProjectLibrary',kits=['creator','agent','community','custom'],workloads=['web','dev','model'];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uuid=()=>{
  if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
  const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
 };
 function text(value,max,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw Error('A project contains an invalid or oversized field.');return value;}
 function normalizeDraft(value){
  if(value?.version!==1||!value.fields||!kits.includes(value.kit))throw Error('Project format is unsupported.');
  const input=value.fields,fields={};for(const [key,max,required] of [['name',80,true],['purpose',500,true],['milestone',160,false],['repo',2048,false],['demo',2048,false]])fields[key]=text(input[key]??'',max,required);
  for(const key of ['repo','demo'])if(fields[key]){let url;try{url=new URL(fields[key]);}catch{throw Error('Project links must be valid web URLs.');}if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Project links must use HTTP or HTTPS without embedded credentials.');}
  if(!workloads.includes(input.workload))throw Error('Project workspace is invalid.');fields.workload=input.workload;
  const split=Number(input.builderSplit);if(!Number.isFinite(split)||split<0||split>100||split%5!==0)throw Error('Builder allocation must be from 0 to 100, in steps of 5.');fields.builderSplit=String(split);
  if(!Array.isArray(value.tools)||value.tools.length>49)throw Error('Project toolset is invalid.');const tools=[...new Set(value.tools.map(tool=>text(tool,100,true)))];
  return {version:1,kit:value.kit,fields,tools,updatedAt:new Date().toISOString()};
 }
 function normalizeTask(task){if(!task||typeof task.done!=='boolean')throw Error('A milestone is invalid.');return {id:uuid(),title:text(task.title,160,true),done:task.done};}
 let library={version:1,activeId:null,projects:[]},blocked=false;
 try{const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(parsed.version!==1||!Array.isArray(parsed.projects)||parsed.projects.length>100)throw Error('Invalid library');for(const p of parsed.projects){if(!/^[a-f0-9-]{36}$/i.test(p.id)||typeof p.archived!=='boolean'||!Array.isArray(p.tasks)||p.tasks.length>50)throw Error('Invalid library');normalizeDraft(p.draft);for(const t of p.tasks){if(!/^[a-f0-9-]{36}$/i.test(t.id)||typeof t.done!=='boolean')throw Error('Invalid milestone');text(t.title,160,true);}}library=parsed;}}
 catch{blocked=true;}
 const active=()=>library.projects.find(p=>p.id===library.activeId&&!p.archived)||null;
 function commit(next){if(blocked)throw Error('The project library could not be read. Browser storage may be unavailable. Export your current brief to keep a copy.');localStorage.setItem(KEY,JSON.stringify(next));library=next;render();window.dispatchEvent(new Event('nucProjectsChange'));}
 function saveDraft(draft){try{const clean=normalizeDraft(draft),previous=active(),now=new Date().toISOString();if(!previous&&library.projects.length>=100)throw Error('This library holds up to 100 projects. Export a backup to keep your work.');const project=previous?{...previous,draft:clean,updatedAt:now}:{id:uuid(),draft:clean,createdAt:now,updatedAt:now,archived:false,tasks:clean.fields.milestone?[{id:uuid(),title:clean.fields.milestone,done:false}]:[]};commit({...library,activeId:project.id,projects:previous?library.projects.map(p=>p.id===project.id?project:p):[project,...library.projects]});return {ok:true,project};}catch(error){return {ok:false,error:error.message};}}
 window.NUC_PROJECTS={active,saveDraft,startNew(){commit({...library,activeId:null});localStorage.removeItem('nucProjectBrief');},list:()=>structuredClone(library.projects),
  select(id){const project=library.projects.find(p=>p.id===id&&!p.archived);if(!project)throw Error('Choose an active project.');commit({...library,activeId:id});localStorage.setItem('nucProjectBrief',JSON.stringify(project.draft));localStorage.setItem('nucStudioKit',JSON.stringify(project.draft.kit));localStorage.setItem('nucCapabilityShortlist',JSON.stringify(project.draft.tools));return structuredClone(project);},
  addTask(id,title){const project=library.projects.find(p=>p.id===id&&!p.archived);if(!project)throw Error('Choose an active project.');if(project.tasks.length>=50)throw Error('A project holds up to 50 milestones.');const clean=text(title,160,true).trim();update(id,{tasks:[...project.tasks,{id:uuid(),title:clean,done:false}]});},
  setArchived(id,archived){const project=library.projects.find(p=>p.id===id);if(!project)throw Error('That project is unavailable.');update(id,{archived:!!archived});},
  toggleTask(id,taskId,done){const project=library.projects.find(p=>p.id===id&&!p.archived);if(!project||!project.tasks.some(t=>t.id===taskId))throw Error('That milestone is unavailable.');update(id,{tasks:project.tasks.map(t=>t.id===taskId?{...t,done:!!done}:t)});}
 };
 const root=document.querySelector('#projectLibrary');if(!root)return;
 function openStudio(id){const url=new URL('studio.html',location.href);url.searchParams.set('project',id||'new');url.hash='brief';if(url.href===location.href)location.reload();else location.href=url.href;}
 const message=document.querySelector('#libraryStatus'),search=document.querySelector('#projectLibrarySearch'),archive=document.querySelector('#projectArchived');
 function tell(value){message.textContent=value;}
 function update(id,change){const now=new Date().toISOString();commit({...library,projects:library.projects.map(p=>p.id===id?{...p,...change,updatedAt:now}:p)});}
 function render(){
  if(!root)return;const q=search.value.trim().toLowerCase(),list=library.projects.filter(p=>p.archived===archive.checked&&`${p.draft.fields.name} ${p.draft.fields.purpose}`.toLowerCase().includes(q));
  document.querySelector('#projectLibraryCount').textContent=`${list.length} projects · saved on this device`;
  root.innerHTML=list.map(p=>`<article class="project-record" data-project="${p.id}"><small>${p.id===library.activeId?'CURRENT PROJECT · ':''}${esc(p.draft.fields.workload.toUpperCase())} · ${p.tasks.filter(t=>t.done).length}/${p.tasks.length} MILESTONES DONE</small><h3>${esc(p.draft.fields.name)}</h3><p>${esc(p.draft.fields.purpose)}</p><ul class="task-list">${p.tasks.map(t=>`<li><label><input type="checkbox" data-task="${t.id}" ${t.done?'checked':''} ${p.archived?'disabled':''}><span>${esc(t.title)}</span></label></li>`).join('')}</ul>${p.archived?'':`<form class="task-form"><input name="title" placeholder="Next milestone" aria-label="New milestone for ${esc(p.draft.fields.name)}" maxlength="160" required><button type="submit">ADD ↗</button></form>`}<footer>${p.archived?`<button type="button" data-project-action="restore">RESTORE ↗</button>`:`<button type="button" data-project-action="open">OPEN IN STUDIO ↗</button><button type="button" data-project-action="archive">ARCHIVE</button>`}</footer></article>`).join('')||'<div class="working-empty">'+(archive.checked?'No archived projects.':'No saved projects match. Save your brief above or import a project backup.')+'</div>';
  document.querySelector('#exportProjects').disabled=blocked||!library.projects.length;
 }
 root.addEventListener('click',event=>{const button=event.target.closest('[data-project-action]');if(!button)return;const project=library.projects.find(p=>p.id===button.closest('[data-project]').dataset.project);try{
  if(button.dataset.projectAction==='open'){commit({...library,activeId:project.id});localStorage.setItem('nucCapabilityShortlist',JSON.stringify(project.draft.tools));openStudio(project.id);}
  else if(button.dataset.projectAction==='archive'){update(project.id,{archived:true});tell('Project archived. Find it under Archived and restore it anytime.');}
  else {update(project.id,{archived:false});tell('Project restored.');}
 }catch(error){tell(error.message);}});
 root.addEventListener('change',event=>{const checkbox=event.target.closest('[data-task]');if(!checkbox)return;const project=library.projects.find(p=>p.id===checkbox.closest('[data-project]').dataset.project);try{update(project.id,{tasks:project.tasks.map(t=>t.id===checkbox.dataset.task?{...t,done:checkbox.checked}:t)});tell('Milestone updated.');}catch(error){checkbox.checked=!checkbox.checked;tell(error.message);}});
 root.addEventListener('submit',event=>{if(!event.target.matches('.task-form'))return;event.preventDefault();const project=library.projects.find(p=>p.id===event.target.closest('[data-project]').dataset.project);try{if(project.tasks.length>=50)throw Error('A project holds up to 50 milestones.');const title=text(new FormData(event.target).get('title'),160,true).trim();update(project.id,{tasks:[...project.tasks,{id:uuid(),title,done:false}]});tell('Milestone added.');}catch(error){tell(error.message);}});
 search.addEventListener('input',render);archive.addEventListener('change',render);
 document.querySelector('#newProject').addEventListener('click',()=>{try{commit({...library,activeId:null});localStorage.removeItem('nucProjectBrief');localStorage.setItem('nucCapabilityShortlist','[]');localStorage.setItem('nucStudioKit',JSON.stringify('custom'));openStudio();}catch(error){tell(error.message);}});
 document.querySelector('#exportProjects').addEventListener('click',()=>{const backup={format:'nucaloric-projects',version:1,exportedAt:new Date().toISOString(),projects:library.projects};const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='nucaloric-projects-'+new Date().toISOString().slice(0,10)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);tell('Project backup exported. Import it on another device to continue.');});
 document.querySelector('#importProjects').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{await window.NUC_TRANSFER.run({title:file.name,kind:'PROJECT LIBRARY / IMPORT',badge:'JSON',bytes:file.size,destination:'This browser',requirements:[{label:'Backup fits the 2 MB file limit',ok:file.size<=2*1024*1024},{label:'Project library can be read',ok:!blocked},{label:'Backup format and project limits checked before saving',ok:null}],phase:'Reading your backup…',success:'Projects imported',completeNote:'Projects were added as new copies. Your existing projects are kept.',task:async update=>{
  const data=JSON.parse(await window.NUC_TRANSFER.read(file,update));if(data.format!=='nucaloric-projects'||data.version!==1||!Array.isArray(data.projects))throw Error('Choose a NUCALORIC project backup.');if(!data.projects.length||data.projects.length+library.projects.length>100)throw Error('Import between 1 and 100 projects, within the library limit.');
  const now=new Date().toISOString(),incoming=data.projects.map(p=>{if(!Array.isArray(p.tasks)||p.tasks.length>50||typeof p.archived!=='boolean')throw Error('Backup milestones or archive state are invalid.');return {id:uuid(),draft:normalizeDraft(p.draft),tasks:p.tasks.map(normalizeTask),archived:p.archived,createdAt:now,updatedAt:now};});
  update('Saving your projects…');commit({...library,projects:[...incoming,...library.projects]});tell(`${incoming.length} projects imported as new copies. Your existing projects were kept.`);
 }});}catch(error){tell(error instanceof SyntaxError?'This file is not valid JSON. No projects were imported.':error.message);}finally{event.target.value='';}});
 render();if(blocked)tell('The project library could not be read. Export your brief to keep a copy.');
})();
