/* Scoped, inspectable service paths. The diagram never starts a payment or a launch. */
(() => {
 const svgNS = 'http://www.w3.org/2000/svg';
 const checkoutConfig = window.NUC_HOSTING_CONFIG;
 window.addEventListener('nuc-billing-ready',({detail})=>{
  if(!detail.connected)return;
  for(const [key,product] of Object.entries(detail.catalog)){
   if(product.planType!=='free')continue;
   const label=document.querySelector(`[data-price-label="${key}"]`);
   if(label){label.textContent='Free';const note=label.parentElement.querySelector('span');if(note)note.textContent=key==='server'?'Static website hosting':key==='ai'?'Planning only':'Setup planner';}
   const cta=document.querySelector(`[data-plan-link="${key}"]`);
   if(cta&&key==='server'){cta.firstChild.textContent='Create a free website';cta.href='billing.html?source=paymenter&workload=web&compute=cpu#billingCreate';}
  }
  for(const key of ['server','ai']){
   const s=payment[key];
   s.status='FREE ENROLLMENT / CONNECTED';s.hub=['AVAILABLE NOW','Free workspace enrollment','Sign in and enroll this workspace with Paymenter. No payment is due. Machine capacity and remote access await setup.','billing.html?source=paymenter&workload='+(key==='ai'?'model':'web'),'OPEN BILLING'];
   s.invoice=['NO PAYMENT DUE','A Free product plan','The free enrollment creates an order and service record without an invoice or payment gateway. Paid plans can use a gateway later.','billing.html','YOUR BILLING'];
   s.compute=['AWAITING SETUP','Connect the hosting backend','Server provisioning is managed by the NUCALORIC backend. Billing enrollment does not create or start a machine.','hosting.html#workspaceBuilder','PLAN THE MACHINE'];
   s.access=['AWAITING SETUP','Machine access','An active billing record is separate from a paired machine or provisioned server. Remote control is not connected yet.','billing.html','VIEW WORKSPACES'];
  }
  if(detail.provisioner?.connected){
   const s=payment.server;
   s.status=`FREE PI WEBSITE / ${detail.provisioner.available} OF ${detail.provisioner.limit} SLOTS AVAILABLE`;s.hubTitle='Paymenter';s.hubNote='Free account & service';s.titles={invoice:'Free service',compute:'Website server',access:'Your workspace'};s.notes={invoice:'No card required',compute:'32 MB / 0.25 CPU',access:'Website & command line'};
   const availability=document.querySelector('.pricing-availability');if(availability)availability.textContent=`Free website hosting is connected. ${detail.provisioner.available} of ${detail.provisioner.limit} Pi slots are available. Own-hardware and model options remain planning tools.`;
   s.hub=['AVAILABLE NOW','Create a free website server','Sign in to allocate a small static website on the Pi. Five slots total; no payment is due.','billing.html?source=paymenter&workload=web','CREATE A WEBSITE'];
   s.server=['32 MB / 0.25 CPU','Small static website','This Pi offers static website containers. Apps, game servers and AI runtimes need a different server configuration.','billing.html?source=paymenter&workload=web','OPEN BILLING'];
   s.compute=['FIVE SLOTS TOTAL','Allocated by NUCALORIC','The website backend creates the container and enforces its memory/CPU limits. Billing shows the actual server state.','billing.html','VIEW SERVERS'];
   s.access=['COMMAND LINE / WEBSITE','Manage your website','Use the Account command line inside your website container. Start/stop, HTML publication and removal are available in Billing. These Pi URLs currently work on the local network.','billing.html','MANAGE SERVERS'];
  }
  document.querySelectorAll('[data-ribbon-flow="payment"] [data-flow-id="hub"]').forEach(button=>button.click());
 });
 document.querySelectorAll('[data-price-label]').forEach(el => {
  const product = checkoutConfig?.products?.[el.dataset.priceLabel === 'server' ? 'cpu' : 'gpu'];
  if (el.dataset.priceLabel === 'basic' || typeof product?.priceLabel !== 'string' || !product.priceLabel.trim()) return;
  if (!Array.isArray(product.reviewedFor) || !product.reviewedFor.includes(el.dataset.priceLabel === 'server' ? 'web' : 'model')) return;
  el.textContent = product.priceLabel.trim().slice(0, 90);
 });
 const launch = {
  hub: ['AVAILABLE NOW', 'Your launch plan', 'Save your identity, supply and budget as a portable plan. No transaction is submitted.', '#coinDesk', 'OPEN COIN DESK'],
  identity: ['AVAILABLE NOW', 'Give your coin an identity', 'Choose a name and ticker, add artwork, and write the reason it exists.', '#coinIdentity', 'EDIT IDENTITY'],
  supply: ['AVAILABLE NOW', 'Decide the allocation', 'Choose the supply, creator share and community allocation. These are planning values until a launch is approved.', '#coinDistribution', 'EDIT ALLOCATION'],
  budget: ['AVAILABLE NOW', 'Set the budget', 'Plan liquidity and reserves against your limit. Review the amounts before committing funds.', '#coinBudget', 'EDIT BUDGET'],
  export: ['AVAILABLE NOW', 'Keep your plan', 'Save on this device or export a JSON copy. The plan can be imported again without submitting a transaction.', '#coinWorkbench', 'SAVE OR EXPORT'],
  wallet: ['PLANNED', 'Review and approve', 'The planned live launch will require a real wallet signature after reviewing the transaction and costs. Wallet signing is not enabled here yet.', 'roadmap.html#phase-1', 'VIEW WALLET ROADMAP'],
  pool: ['PLANNED', 'Launch the pool', 'A reviewed launch route will submit the approved transaction, confirm it on-chain and return a receipt. Pool deployment is not enabled here yet.', 'roadmap.html#phase-2', 'VIEW LAUNCH ROADMAP']
 };
 const payment = {
  server: {
   hubTitle: 'Paymenter', hubNote: 'Free account & service', status: 'FREE WEBSITE PLAN / CONNECT YOUR ACCOUNT', titles: { invoice: 'Free service', compute: 'Website server', access: 'Your workspace' }, notes: { invoice: 'No card required', compute: '32 MB / 0.25 CPU', access: 'Website & command line' },
   hub: ['FREE PLAN','Start with your account','Create a free website through the connected workspace site. No card or payment is required. Public access needs the Pi HTTPS connection.','billing.html?source=paymenter&workload=web&compute=cpu#billingCreate','OPEN BILLING'],
   own: null,
   server: ['FREE WEBSITE','A small home for your website','The Pi provides five static website slots with 32 MB RAM and 0.25 CPU each. App runtimes and AI compute are separate.','billing.html?source=paymenter&compute=cpu&workload=web#billingCreate','CREATE A WEBSITE'],
   invoice: ['NO PAYMENT DUE', 'Your Free service record', 'Paymenter saves a zero-cost order and service. This Free plan needs no invoice, card or payment gateway.', 'billing.html', 'OPEN BILLING'],
   compute: ['PI WEBSITE HOSTING', 'Allocate a website slot', 'The connected workspace site allocates one of five Pi website containers. Billing shows available capacity before creation.', 'billing.html?source=paymenter&workload=web&compute=cpu#billingCreate', 'CREATE A WEBSITE'],
   access: ['YOUR ACCOUNT', 'Build and manage your website', 'Use Services to publish HTML and start or stop your server. Its command line is available in Account while the server is running. Public access awaits the Pi HTTPS connection.', 'services.html', 'YOUR SERVICES']
  },
  own: {
   hubTitle: 'Your local setup', hubNote: 'No checkout needed', status: 'LOCAL PLANNING / AVAILABLE', titles: { invoice: 'Plan export', compute: 'Your machine', access: 'Device access' }, notes: { invoice: 'No platform checkout', compute: 'Your Pi or Linux PC', access: 'Pairing planned' },
   hub: ['AVAILABLE NOW', 'Start on your machine', 'Use the free local planner and export a setup script. Your hardware, power and network costs remain yours.', 'hosting.html?source=own&hardware=pi#workspaceBuilder', 'PLAN YOUR HARDWARE'],
   own: ['AVAILABLE NOW', 'Raspberry Pi or Linux PC', 'Choose your machine and access approach. Review the setup script before running it locally; remote pairing is not enabled yet.', 'hosting.html?source=own&hardware=pi#workspaceBuilder', 'PLAN YOUR HARDWARE'],
   invoice: ['NO CHECKOUT', 'No platform payment', 'The local planner and its exports do not start a subscription. Hardware and other services you use have their own costs.', 'hosting.html?source=own#workspaceBuilder', 'OPEN FREE PLANNER'],
   compute: ['YOUR HARDWARE', 'Use what you own', 'Your machine supplies the compute. Check architecture, memory, storage and runtime support against the workload.', 'hosting.html?source=own&hardware=pi#workspaceBuilder', 'CHECK YOUR SETUP'],
   access: ['PLANNED', 'Connect the machine', 'Planning works now. Device enrollment and remote workspace access are a later step; your machine is not paired by exporting a plan.', 'roadmap.html#phase-3', 'VIEW HARDWARE ROADMAP']
  },
  ai: {
   hubTitle: 'Model workspace', hubNote: 'Compute & runtime', status: 'AI BILLING / PLANNED', titles: { invoice: 'Invoice', compute: 'Model runtime', access: 'Private endpoint' }, notes: { invoice: 'Configured product price', compute: 'Model-ready hardware', access: 'Private model endpoint' },
   hub: ['PLANNED', 'Plan model compute', 'Select CPU or GPU after reviewing your model’s memory needs. Managed AI billing and deployment are not connected yet.', 'hosting.html?source=paymenter&compute=gpu&workload=model#workspaceBuilder', 'PLAN AI COMPUTE'],
   ai: ['PLANNED', 'Size the model workspace', 'Plan compute for a self-hosted model. An AI provider subscription is separate from hosting your own model.', 'hosting.html?source=paymenter&compute=gpu&workload=model#workspaceBuilder', 'PLAN AI COMPUTE'],
   invoice: ['PLANNED', 'Review the hosting price', 'A configured product will define the compute price. Model API subscriptions or usage fees are not included unless explicitly listed.', 'hosting.html?source=paymenter&compute=gpu&workload=model#workspaceBuilder', 'REVIEW COMPUTE PLAN'],
   compute: ['PLANNED', 'Prepare the runtime', 'Verify memory, drivers and model compatibility on the actual machine before installing the inference runtime.', 'hosting.html?source=paymenter&compute=gpu&workload=model#workspaceBuilder', 'PLAN THE RUNTIME'],
   access: ['PLANNED', 'Connect the endpoint', 'The intended endpoint is private and authenticated. Saving this plan does not start a model or expose an API.', 'roadmap.html#phase-4', 'VIEW AI ROADMAP']
  }
 };
 document.querySelectorAll('[data-ribbon-flow]').forEach(board => {
  const isLaunch = board.dataset.ribbonFlow === 'launch';
  const diagram = board.querySelector('.ribbon-diagram'), svg = board.querySelector('svg.ribbon-lines');
  const buttons = [...board.querySelectorAll('[data-flow-id]')];
  let service = 'server', selected = 'hub', frame;
  const inputs = isLaunch ? ['identity', 'supply', 'budget'] : ['own', 'server', 'ai'];
  const outputs = isLaunch ? ['export', 'wallet', 'pool'] : ['invoice', 'compute', 'access'];
  const set = (selector, value) => { const el = board.querySelector(selector); if (el) el.textContent = value; };
  function draw() {
   frame = 0;
   const bounds = diagram.getBoundingClientRect();
   if (!bounds.width || !bounds.height) return;
   svg.replaceChildren(); svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
   const mobile = matchMedia('(max-width:760px)').matches;
   [...inputs.map(id => [id, 'hub']), ...outputs.map(id => ['hub', id])].forEach(([from, to]) => {
    const first = board.querySelector(`[data-flow-id="${from}"]`).getBoundingClientRect();
    const last = board.querySelector(`[data-flow-id="${to}"]`).getBoundingClientRect();
    const sx = mobile ? first.left + first.width / 2 - bounds.left : first.right - bounds.left;
    const sy = mobile ? first.bottom - bounds.top : first.top + first.height / 2 - bounds.top;
    const tx = mobile ? last.left + last.width / 2 - bounds.left : last.left - bounds.left;
    const ty = mobile ? last.top - bounds.top : last.top + last.height / 2 - bounds.top;
    const bend = mobile ? (ty - sy) * .55 : (tx - sx) * .6;
    const d = mobile ? `M ${sx} ${sy} C ${sx} ${sy + bend}, ${tx} ${ty - bend}, ${tx} ${ty}` : `M ${sx} ${sy} C ${sx + bend} ${sy}, ${tx - bend} ${ty}, ${tx} ${ty}`;
    const active = isLaunch ? selected === 'hub' || selected === from || selected === to : from === service || outputs.includes(to) && (selected === 'hub' || selected === to || selected === service);
    for (const className of ['ribbon-ribbon', 'ribbon-line']) {
     const path = document.createElementNS(svgNS, 'path');
     path.setAttribute('d', d); path.setAttribute('class', className + (active ? ' is-selected' : '')); svg.append(path);
    }
   });
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
  function select(id) {
   if (!isLaunch && inputs.includes(id)) service = id;
   selected = id;
   const state = isLaunch ? launch : payment[service];
   const detail = state[id] || state.hub;
   buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.flowId === selected)));
   set('[data-flow-detail-label]', detail[0]); set('[data-flow-detail-title]', detail[1]); set('[data-flow-detail-copy]', detail[2]);
   const link = board.querySelector('[data-flow-detail-link]'); link.href = detail[3]; link.textContent = detail[4] + ' ↗';
   if (detail[3].startsWith('https://')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; } else { link.removeAttribute('target'); link.removeAttribute('rel'); }
   if (!isLaunch) {
    set('[data-flow-hub-title]', state.hubTitle); set('[data-flow-hub-note]', state.hubNote); set('[data-flow-status]', state.status);
    for (const [key, value] of Object.entries(state.titles)) set(`[data-flow-id="${key}"] b`, value);
    for (const [key, value] of Object.entries(state.notes)) set(`[data-flow-note="${key}"]`, value);
   }
   schedule();
  }
  buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.flowId)));
  new ResizeObserver(schedule).observe(diagram);
  document.fonts.ready.then(schedule);
  select('hub');
 });
})();
