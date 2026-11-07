import { byId as $ } from './dom.js';

export function createCopilotConnection({text,request,confirm}) {
  $('copilot-login').addEventListener('click',()=>request('login','copilot'));
  $('copilot-use').addEventListener('click',()=>request('connect','copilot'));
  $('copilot-test').addEventListener('click',()=>confirm('copilotTestConfirm',()=>request('test','copilot',{confirm:true})));
  return {render(result,busy){
    const state=result?.providers?.copilot;
    const active=state?.connected && result.selected==='copilot';
    const pending=state?.connection==='pending';
    $('setup-card-copilot').dataset.active=String(Boolean(active));
    $('setup-badge-copilot').textContent=text(active?'activeProvider':state?.connected?'connectedBadge':'copilotPlan');
    $('copilot-install').hidden=!state||Boolean(state.installed&&state.supported);
    $('copilot-login').hidden=Boolean(state?.connected);
    $('copilot-login').disabled=busy||!state?.installed||!state.supported||pending;
    $('copilot-login').textContent=text(pending?'loginWaiting':'signInAction',{provider:'GitHub'});
    $('copilot-use').hidden=!state?.connected;
    $('copilot-use').disabled=busy||Boolean(active);
    $('copilot-use').textContent=text(active?'usingProvider':'useProvider',{provider:'Copilot'});
    $('copilot-use').setAttribute('aria-pressed',String(Boolean(active)));
    $('copilot-test').hidden=!state?.connected;
    $('copilot-test').disabled=busy||!state?.connected;
    $('copilot-state').textContent=text(!state?'setupChecking':!state.installed||!state.supported?'copilotInstall':pending?'loginAutoCheck':state.connection==='failed'?'connectionFailed':state.tested?'analysisTested':state.connected?'copilotReady':'copilotSignIn');
  }};
}
