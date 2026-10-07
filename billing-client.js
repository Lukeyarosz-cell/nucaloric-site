/* Same-origin Paymenter session bridge. No admin key is exposed to the browser. */
(() => {
  const state = {connected:false, user:null, catalog:{}, csrfToken:null, error:null};
  async function request(path, options = {}) {
    if (!state.connected) throw new Error('Billing is not connected on this host yet.');
    const headers = {Accept:'application/json', ...options.headers};
    if (options.method && options.method !== 'GET') {
      headers['Content-Type']='application/json'; headers['X-CSRF-TOKEN']=state.csrfToken;
    }
    const response = await fetch('/billing/nucaloric/api/'+path, {...options, headers, credentials:'same-origin', cache:'no-store'});
    const data = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(response.status===401 ? 'Sign in to your account to continue.' : response.status===419 ? 'Your session expired. Reload and try again.' : Object.values(data.errors||{}).flat()[0] || data.message || 'Billing is temporarily unavailable.');
    return data;
  }
  const ready = (async () => {
    try {
      // GitHub Pages stays in the unconnected state until a backend is deployed.
      if(location.hostname.endsWith('.github.io'))return state;
      const response=await fetch('/api/billing/config',{cache:'no-store'});
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return state;
      const config=await response.json();
      if (!config.connected || config.basePath!=='/billing') return state;
      state.connected=true;
      const [session,catalog]=await Promise.all([request('session'),request('catalog')]);
      state.user=session.user;state.csrfToken=session.csrfToken;state.catalog=catalog.products||{};
    } catch (error) {state.connected=false;state.error='Billing is temporarily unavailable. Your records are preserved.';}
    finally {window.dispatchEvent(new CustomEvent('nuc-billing-ready',{detail:state}));}
    return state;
  })();
  window.NUC_BILLING={state,ready,request};
})();
