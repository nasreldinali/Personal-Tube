import { byId as $ } from './dom.js';
import { isLocalProvider, providerNames, apiProviderIds } from '../domain/analysis-providers.js';

export function createApiConnections({ text, request, confirm }) {
  let result = null;
  let busy = false;
  const provider = () => $('api-provider').value;
  const clearSecret = () => { $('analysis-key').value = ''; };
  function render(state = result, running = busy) {
    result = state; busy = running;
    $('api-active').textContent = apiProviderIds.includes(result?.selected) ? providerNames[result.selected] : '';
    const id = provider();
    const local = isLocalProvider(id);
    const connection = result?.providers[id];
    const configured = Boolean(connection?.connected);
    const active = result?.selected === id;
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
    clearSecret(); $('api-cost-consent').checked = false;
    $('api-model').value = result?.providers[provider()]?.model || '';
    render();
  });
  $('api-connection-form').addEventListener('submit', async event => {
    event.preventDefault();
    const id = provider();
    const configuration = {provider:id,model:$('api-model').value.trim(),key:$('analysis-key').value.trim(),acknowledgeCost:isLocalProvider(id)?false:$('api-cost-consent').checked};
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
  return { render, clearSecret };
}
