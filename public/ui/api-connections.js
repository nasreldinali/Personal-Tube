import { createLocalModelPicker } from './local-models.js';
import { byId as $, element } from './dom.js';
import { isLocalProvider, providerNames, apiProviderIds } from '../domain/analysis-providers.js';

export function createApiConnections({ text, request, confirm }) {
  const modelPicker=createLocalModelPicker({text,request});
  let result = null;
  let busy = false;
  const provider = () => $('api-provider').value;
  const clearSecret = () => { $('analysis-key').value = ''; $('api-cost-consent').checked = false; };
  function render(state = result, running = busy) {
    result = state; busy = running;
    $('api-active').textContent = '';
    const id = provider();
    const local = isLocalProvider(id);
    const connection = result?.providers[id];
    const configured = Boolean(connection?.connected);
    const active = result?.selected === id;
    $('local-model-picker').hidden = !local;
    $('local-port-field').hidden = id!=='local-openai';
    $('local-model-load').disabled = busy || !result;
    $('local-port').disabled = busy;
    $('api-key-field').hidden = local;
    $('api-cost-label').hidden = local;
    $('api-local-help').hidden = !local;
    $('analysis-key').required = !local;
    $('api-state').textContent = !configured ? text('apiNotConfigured') : `${providerNames[id]} · ${connection.model} · ${text(connection.tested ? 'analysisTested' : 'apiConfigured')}${active ? ` · ${text('activeProvider')}` : ''}`;
    for (const name of ['api-save','api-provider','api-model','analysis-key','api-cost-consent']) $(name).disabled = busy;
    $('api-test').disabled = busy || !configured || !active;
    $('api-forget').disabled = busy || !configured;
    $('api-use').hidden = !configured || active;
    $('api-use').disabled = busy;
  }
  $('api-provider').addEventListener('change', () => {
    clearSecret(); modelPicker.reset(); $('local-port').value=result?.providers[provider()]?.port || 8080; $('api-cost-consent').checked = false;
    $('api-model').value = result?.providers[provider()]?.model || '';
    render();
  });
  $('api-connection-form').addEventListener('submit', async event => {
    event.preventDefault();
    const id = provider();
    const configuration = {provider:id,model:$('api-model').value.trim(),key:$('analysis-key').value.trim(),acknowledgeCost:isLocalProvider(id)?false:$('api-cost-consent').checked};
    if(id==='local-openai')configuration.port=Number($('local-port').value);
    clearSecret();
    await request('configure', id, {configuration});
  });
  $('api-use').addEventListener('click', () => { void request('connect',provider()); });
  $('api-test').addEventListener('click', () => {
    const id=provider(); confirm('apiTestConfirm',()=>request('test',id,{confirm:true}));
  });
  $('api-forget').addEventListener('click', () => {
    const id=provider(); confirm('apiRemoveConfirm',()=>request('forget',id,{confirm:true}));
  });
  function setMethod(method, preferred) {
    const ids = apiProviderIds.filter(id => isLocalProvider(id) === (method === 'local'));
    const selected = ids.includes(preferred) ? preferred : ids.includes(provider()) ? provider() : ids[0];
    clearSecret(); modelPicker.reset(); $('local-port').value=result?.providers[selected]?.port || 8080; $('api-cost-consent').checked=false;
    $('api-provider').replaceChildren(...ids.map(id => { const option=element('option','',providerNames[id]); option.value=id; return option; }));
    $('api-provider').value=selected;
    $('api-model').value=result?.providers[selected]?.model || '';
    $('api-model').placeholder=method==='local'?'gemma4:e4b':'';
    $('api-method-help').textContent='';
    render();
  }
  return { render, clearSecret, setMethod };
}
