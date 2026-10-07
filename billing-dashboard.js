(() => {
  const name=document.getElementById('dashboardWorkspaceName');
  if(!name||!window.NUC_BILLING)return;
  const card=name.closest('.account-project-card');
  const account=document.createElement('a');account.className='product-primary';account.href='billing.html';account.textContent='ACCOUNT & BILLING ↗';account.style.marginTop='12px';card.append(account);
  window.NUC_BILLING.ready.then(async state=>{
    if(!state.connected||!state.user)return;
    try{
      const {workspaces}=await window.NUC_BILLING.request('workspaces');
      const workspace=workspaces.find(w=>w.billingStatus==='active');if(!workspace)return;
      name.textContent=workspace.project;
      document.getElementById('workspacePlanBadge').textContent='FREE ENROLLED';
      document.getElementById('dashboardWorkspaceNote').textContent=workspace.machineStatus==='awaiting-pairing'?'Saved in your account · Awaiting machine pairing.':'Saved in your account · Awaiting a configured server.';
      document.getElementById('dashboardWorkload').textContent={web:'Website or app',dev:'Developer tools',model:'Self-hosted model'}[workspace.plan.workload];
      document.getElementById('dashboardCompute').textContent=workspace.plan.source==='own'?(workspace.plan.hardware==='pi'?'Your Raspberry Pi':'Your Linux PC'):'Compute plan · hardware pending';
    }catch{/* The account page offers explicit refresh and connection feedback. */}
  });
})();
