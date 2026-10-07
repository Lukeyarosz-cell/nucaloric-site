import {getWallets} from '@wallet-standard/app';
import {Transaction, VersionedTransaction} from '@solana/web3.js';
import {Buffer} from 'buffer';

const registry=getWallets();
const targets=[
 {id:'phantom',name:'Phantom',icon:'assets/partners/phantom.svg',url:'https://phantom.com/download'},
 {id:'solflare',name:'Solflare',icon:'assets/partners/solflare.ico',url:'https://solflare.com/download'},
 {id:'jupiter',name:'Jupiter Wallet',icon:'assets/partners/jupiter.ico',url:'https://jup.ag/mobile'},
 {id:'brave',name:'Brave Wallet',icon:null,url:'https://brave.com/wallet/'},
 {id:'backpack',name:'Backpack',icon:'assets/partners/backpack.ico',url:'https://backpack.app/download'},
];
const state={connected:false,address:null,provider:null,verified:false};
let active=null,account=null,legacy=null,off=null,busy=false;
const dialog=document.querySelector('#walletModal'),card=dialog?.querySelector('.modal-card');
function idFor(name){return targets.find(t=>String(name).toLowerCase().includes(t.id))?.id;}
function injected(id){
 if(id==='phantom')return window.phantom?.solana||(window.solana?.isPhantom?window.solana:null);
 if(id==='solflare')return window.solflare?.isSolflare?window.solflare:null;
 if(id==='backpack')return window.backpack?.solana||((window.backpack?.isBackpack||window.backpack?.connect)?window.backpack:null);
 if(id==='brave')return window.braveSolana;
 return null;
}
function discovered(id){return registry.get().find(w=>idFor(w.name)===id&&w.chains.some(c=>c.startsWith('solana:'))&&w.features['standard:connect'])||injected(id);}
function short(address){return address?address.slice(0,5)+'…'+address.slice(-4):'Connect';}
function tell(message){const node=document.querySelector('#walletConnectionNote');if(node)node.textContent=message;}
function changed(){
 document.querySelectorAll('.wallet-label').forEach(n=>n.textContent=short(state.address));
 document.querySelectorAll('[data-wallet-address]').forEach(n=>n.textContent=state.address?short(state.address):'Connect a wallet');
 if(card){
  card.querySelectorAll('[data-wallet-provider]').forEach(b=>{const detected=Boolean(discovered(b.dataset.walletProvider));b.disabled=busy;const em=b.querySelector('em');if(em)em.textContent=detected?'CONNECT ↗':'GET WALLET ↗';b.dataset.detected=String(detected);});
  const details=card.querySelector('.wallet-session');details.hidden=!state.connected;
  details.querySelector('[data-connected-address]').textContent=state.address||'';
  details.querySelector('[data-wallet-proof]').textContent=state.verified?'Linked to your account':'Wallet connected · account link not verified';
  details.querySelector('[data-wallet-link]').disabled=busy||state.verified;details.querySelector('[data-wallet-unlink]').hidden=!state.verified;details.querySelector('[data-wallet-unlink]').disabled=busy;
 }
 window.dispatchEvent(new CustomEvent('nuc-wallet-change',{detail:{...state}}));
}
function reset(){off?.();off=null;active=account=legacy=null;Object.assign(state,{connected:false,address:null,provider:null,verified:false});changed();}
async function checkLinked(){
 await window.NUC_BILLING?.ready;
 if(!state.connected||!window.NUC_BILLING?.state.user)return;
 try{const d=await window.NUC_BILLING.request('wallets');state.verified=d.wallets.some(w=>w.address===state.address);changed();}catch{state.verified=false;changed();}
}
async function connect(id){
 if(busy)return;const provider=discovered(id);
 if(!provider){const target=targets.find(t=>t.id===id);tell('Install '+target.name+', or open NUCALORIC in its wallet browser.');window.open(target.url,'_blank','noopener,noreferrer');return;}
 busy=true;changed();tell('Approve the connection in your wallet.');
 try{
  off?.();off=null;
  let address;
  if(provider.features){
   const result=await provider.features['standard:connect'].connect();
   const selected=(result.accounts||provider.accounts).find(a=>a.chains.some(c=>c.startsWith('solana:')));
   if(!selected)throw Error('This wallet did not return a Solana account.');
   active=provider;account=selected;legacy=null;address=selected.address;
   if(provider.features['standard:events'])off=provider.features['standard:events'].on('change',e=>{if(e.accounts&&!e.accounts.some(a=>a.address===state.address))reset();});
  }else{
   const result=await provider.connect();address=String(result?.publicKey||provider.publicKey||'');
   active=account=null;legacy=provider;
   const disconnect=()=>reset(),update=key=>{if(!key||String(key)!==state.address)reset();};
   provider.on?.('disconnect',disconnect);provider.on?.('accountChanged',update);
   off=()=>{provider.removeListener?.('disconnect',disconnect);provider.removeListener?.('accountChanged',update);};
  }
  if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address))throw Error('The wallet returned an invalid Solana address.');
  Object.assign(state,{connected:true,address,provider:id,verified:false});
  try{localStorage.setItem('nucWalletPreference',id);}catch{}
  tell('Connected. Link it to your account to use credits and coin transactions.');
  await checkLinked();
 }catch(e){reset();tell(e?.code===4001?'Wallet connection declined.':e?.message||'Wallet connection failed.');}
 finally{busy=false;changed();}
}
async function link(){
 if(busy||!state.connected)return;
 await window.NUC_BILLING?.ready;
 if(!window.NUC_BILLING?.state.user){tell('Sign in to NUCALORIC before linking this wallet.');return;}
 busy=true;changed();tell('Approve the account-link message. This signature has no network fee.');
 const address=state.address;
 try{
  const challenge=await window.NUC_BILLING.request('wallets/challenge',{method:'POST',body:JSON.stringify({address,provider:state.provider})});
  const message=new TextEncoder().encode(challenge.message);let signature;
  if(active?.features['solana:signMessage']){
   const [result]=await active.features['solana:signMessage'].signMessage({account,message});signature=result.signature;
  }else if(legacy?.signMessage){const result=await legacy.signMessage(message,'utf8');signature=result.signature||result;}
  else throw Error('This wallet does not support account-link message signatures. Update it and try again.');
  if(state.address!==address||signature.length!==64)throw Error('Wallet changed during verification. Connect again.');
  const result=await window.NUC_BILLING.request('wallets/verify',{method:'POST',body:JSON.stringify({id:challenge.id,signature:Buffer.from(signature).toString('base64')})});
  state.verified=result.verified===true;tell('Wallet linked to your NUCALORIC account.');
 }catch(e){tell(e.message||'Wallet verification failed.');}
 finally{busy=false;changed();}
}
async function signTransaction(base64,network='mainnet-beta'){
 if(!state.connected)throw Error('Connect a wallet first.');
 const bytes=Uint8Array.from(Buffer.from(base64,'base64'));const address=state.address;let signed;
 if(active?.features['solana:signTransaction']){
  const chain=network==='devnet'?'solana:devnet':'solana:mainnet';
  if(!account.chains.includes(chain))throw Error('This wallet account does not support '+network+'.');
  const [result]=await active.features['solana:signTransaction'].signTransaction({account,chain,transaction:bytes});signed=result.signedTransaction;
 }else if(legacy?.signTransaction){
  const decoded=VersionedTransaction.deserialize(bytes);
  const transaction=decoded.version==='legacy'?Transaction.from(bytes):decoded;
  const result=await legacy.signTransaction(transaction);
  signed=result.serialize({requireAllSignatures:false,verifySignatures:false});
 }else throw Error('This wallet does not support signing transactions. Update it and try again.');
 if(state.address!==address)throw Error('Wallet changed during signing. No transaction was submitted.');
 return Buffer.from(signed).toString('base64');
}
async function unlink(){if(busy||!state.verified)return;busy=true;changed();try{await window.NUC_BILLING.request('wallets/unlink',{method:'POST',body:JSON.stringify({address:state.address})});state.verified=false;tell('Account link removed. The wallet remains connected to this browser.');}catch(e){tell(e.message);}finally{busy=false;changed();}}
async function disconnect(){try{await (active?.features['standard:disconnect']?.disconnect()||legacy?.disconnect?.());}finally{reset();tell('Wallet disconnected from this browser. Your account link is preserved.');}}
function open(){
 if(!dialog)return;dialog.classList.add('open');dialog.setAttribute('aria-hidden','false');changed();
 if(!window.isSecureContext&&!registry.get().length)tell('Wallet extensions may require the public HTTPS site. You can also open the site in a wallet browser.');
}
if(card){
 card.querySelectorAll('.wallet-choice').forEach(b=>b.remove());
 const description=card.querySelector('p');description.textContent='Choose your Solana wallet. You approve connections, account links and each transaction in your wallet.';
 const group=document.createElement('div');group.className='wallet-providers';
 for(const target of targets){const button=document.createElement('button');button.type='button';button.className='wallet-choice';button.dataset.walletProvider=target.id;
  if(target.icon){const img=document.createElement('img');img.src=target.icon;img.alt='';button.append(img);}else{const letter=document.createElement('span');letter.className='wallet-letter';letter.textContent='B';button.append(letter);}
  const name=document.createElement('strong');name.textContent=target.name;const action=document.createElement('em');button.append(name,action);button.addEventListener('click',()=>connect(target.id));group.append(button);
 }
 card.append(group);
 const details=document.createElement('div');details.className='wallet-session';details.hidden=true;details.innerHTML='<code data-connected-address></code><small data-wallet-proof></small><div class="connection-actions"><button type="button" data-wallet-link>Link to account ↗</button><button type="button" data-wallet-unlink>Remove account link</button><button type="button" data-wallet-disconnect>Disconnect</button></div>';card.append(details);
 details.querySelector('[data-wallet-link]').addEventListener('click',link);details.querySelector('[data-wallet-disconnect]').addEventListener('click',disconnect);details.querySelector('[data-wallet-unlink]').addEventListener('click',unlink);
 const note=document.createElement('p');note.id='walletConnectionNote';note.setAttribute('role','status');note.className='wallet-connection-note';card.append(note);
}
registry.on('register',changed);registry.on('unregister',changed);
window.addEventListener('nuc-billing-ready',checkLinked);
document.querySelectorAll('[data-wallet]').forEach(b=>b.addEventListener('click',open));
window.NUC_WALLET={state,connect,link,disconnect,signTransaction,open,targets};
changed();
