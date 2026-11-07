import { byId as $ } from './dom.js';
import { isLocalProvider, subscriptionProviders } from '../domain/analysis-providers.js';

export function createConnectionMethod({ setMethod, clearSecret = () => {} }) {
  let initialized = false;
  function show(method, provider) {
    initialized = true;
    clearSecret();
    for (const name of ['subscription','api','local','youtube','help']) $(`method-${name}`).setAttribute('aria-pressed', String(name === method));
    $('subscription-connections').hidden = method !== 'subscription';
    $('model-connections').hidden = !['api','local'].includes(method);
    $('connection-youtube').hidden = method !== 'youtube';
    $('connection-help').hidden = method !== 'help';
    $('connection-analysis-intro').hidden = ['youtube','help'].includes(method);
    if (['api','local'].includes(method)) setMethod(method, provider);
  }
  for (const method of ['subscription','api','local','youtube','help']) $(`method-${method}`).addEventListener('click', () => { initialized=true; show(method); });
  return {
    show,
    reset() { initialized=false; },
    render(provider) {
      if (initialized || !provider) return;
      initialized=true;
      show((provider === 'minimax' || subscriptionProviders.includes(provider)) ? 'subscription' : isLocalProvider(provider) ? 'local' : 'api', provider);
    },
  };
}
