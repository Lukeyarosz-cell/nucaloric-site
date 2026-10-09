/* Same-origin Paymenter session bridge. No admin key is exposed to the browser. */
(() => {
  const state = {connected:false, user:null, catalog:{}, provisioner:{connected:false}, externalUrl:null, csrfToken:null, error:null};
  function uuid(){
    if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
    // LAN HTTP testing lacks randomUUID; getRandomValues still provides secure bytes.
    const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
  }
  async function request(path, options = {}) {
    if (!state.connected) throw new Error('Billing is not connected on this host yet.');
    const headers = {Accept:'application/json', ...options.headers};
    if (options.method && options.method !== 'GET') {
      headers['Content-Type']='application/json'; headers['X-CSRF-TOKEN']=state.csrfToken;
    }
    const response = await fetch('/billing/nucaloric/api/'+path, {...options, headers, credentials:'same-origin', cache:'no-store'});
    const data = await response.json().catch(()=>({}));
    if (!response.ok) {
      if(response.status===401&&state.user){state.user=null;window.dispatchEvent(new Event('nuc-account-expired'));}
      const error=new Error(response.status===401 ? 'Sign in to your account to continue.' : response.status===419 ? 'Your session expired. Reload and try again.' : Object.values(data.errors||{}).flat()[0] || data.message || 'Billing is temporarily unavailable.');
      error.status=response.status;throw error;
    }
    return data;
  }
  const ready = (async () => {
    try {
      // Private sessions belong to the live origin; never share account cookies through GitHub.
      if(location.hostname.endsWith('.github.io')){const live=await window.NUC_LIVE_SITE?.ready;if(live?.origin)state.externalUrl=new URL('/billing.html',live.origin).href;return state;}
      const response=await fetch('/api/billing/config',{cache:'no-store'});
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return state;
      const config=await response.json();
      if(config.externalOrigin){const origin=new URL(config.externalOrigin);if(['http:','https:'].includes(origin.protocol)&&!origin.username&&!origin.password)state.externalUrl=new URL('/billing.html',origin).href;return state;}
      if (!config.connected || config.basePath!=='/billing') return state;
      state.connected=true;
      const [session,catalog]=await Promise.all([request('session'),request('catalog')]);
      state.user=session.user;state.csrfToken=session.csrfToken;state.catalog=catalog.products||{};state.provisioner=catalog.provisioner||{connected:false};
    } catch (error) {state.connected=false;state.error='Billing is temporarily unavailable. Your records are preserved.';}
    finally {window.dispatchEvent(new CustomEvent('nuc-billing-ready',{detail:state}));}
    return state;
  })();
  window.NUC_BILLING={state,ready,request,uuid};
})();
