import { byId as $ } from './dom.js';
import { isLocalProvider, subscriptionProviders } from '../domain/analysis-providers.js';

export function createConnectionMethod({ setMethod, clearSecret = () => {} }) {
  let initialized = false;
  function show(method) {
    clearSecret();
    for (const name of ['subscription','api','local']) $(`method-${name}`).setAttribute('aria-pressed', String(name === method));
    $('subscription-connections').hidden = method !== 'subscription';
    $('model-connections').hidden = method === 'subscription';
    if (method !== 'subscription') setMethod(method);
  }
  for (const method of ['subscription','api','local']) $(`method-${method}`).addEventListener('click', () => { initialized=true; show(method); });
  return {
    reset() { initialized=false; },
    render(provider) {
      if (initialized || !provider) return;
      initialized=true;
      show(subscriptionProviders.includes(provider) ? 'subscription' : isLocalProvider(provider) ? 'local' : 'api');
    },
  };
}
