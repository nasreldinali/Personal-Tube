import { byId as $, element } from './dom.js';
import { t, number } from '../locale.js';
import { AppError } from '../domain/errors.js';
export function createSetupPanel({ context, finish, openYouTube, onError }) {
  let result = null;
  let running = false;
  let message = '';
  const text=(key,values)=>t(context().language,key,values);
  function render() {
    $('setup-check').disabled=running;
    $('setup-provider').disabled=running||context().busy;
    $('setup-connect').disabled=running||context().busy||!result||!result.providers[result.selected].installed||!result.providers[result.selected].supported||result.providers[result.selected].connected;
    if(result)$('setup-provider').value=result.selected;
    $('setup-status').replaceChildren();
    const lines=[text('setupRuntime'),text(context().storageReady?'setupStorageReady':'setupStorageBlocked'),text(context().hasKey?'setupKeyPresent':'setupKeyMissing')];
    if(result)for(const provider of ['codex','claude']){
      const p=result.providers[provider];const state=!p.installed?'providerMissing':!p.supported?'classifierVersion':p.connected?'providerConnected':p.connection==='pending'?'connectionPending':p.connection==='failed'?'connectionFailed':p.method==='other'?'subscriptionRequired':'providerDisconnected';
      lines.push(`${provider==='codex'?'Codex':'Claude Code'}: ${text(state)}`);
    }
    for(const line of lines)$('setup-status').append(element('li','',line));
    $('setup-message').textContent=running?text('setupChecking'):message?text(message):'';
    $('setup-usage').replaceChildren();
    if(result)for(const provider of ['codex','claude']){
      const usage=result.usage[provider];$('setup-usage').append(element('p','',`${provider==='codex'?'Codex':'Claude'} · ${text('usageCounts',{attempted:number(context().language,usage.attempted),completed:number(context().language,usage.completed),failed:number(context().language,usage.failed),inputs:number(context().language,usage.inputs)})}`));
    }
  }
  async function request(action) {
    if(running)return;const provider=$('setup-provider').value;running=true;message='';render();
    try{
      const response=await fetch('/api/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:1,action,provider}),signal:AbortSignal.timeout(25000)});
      const data=await response.json();if(!response.ok)throw new AppError(data.error||'connectionFailed');
      if(data.version!==1||!['codex','claude'].includes(data.selected)||!data.providers||!data.usage)throw new AppError('invalidSetup');
      for(const p of ['codex','claude'])if(!data.providers[p]||!data.usage[p]||['attempted','completed','failed','inputs'].some(k=>!Number.isSafeInteger(data.usage[p][k])||data.usage[p][k]<0))throw new AppError('invalidSetup');
      result=data;
      if(action==='connect')message=data.providers[data.selected].connected?'providerConnected':'connectionPending';
    }catch(error){message='setupCheckFailed';onError(error);}
    finally{running=false;render();}
  }
  $('setup-open').addEventListener('click',open);
  $('setup-check').addEventListener('click',()=>void request('status'));
  $('setup-provider').addEventListener('change',()=>void request('select'));
  $('setup-connect').addEventListener('click',()=>void request('connect'));
  $('setup-youtube').addEventListener('click',()=>{$('setup-dialog').close();openYouTube();});
  $('setup-finish').addEventListener('click',()=>{try{finish();$('setup-dialog').close();}catch(error){onError(error);}});
  function open(){render();$('setup-dialog').showModal();void request('status');}
  return {open,render};
}
