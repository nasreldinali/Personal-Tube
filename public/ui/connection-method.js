import { byId as $ } from './dom.js';
import { isLocalProvider, subscriptionProviders } from '../domain/analysis-providers.js';

export function createConnectionMethod({ setMethod, clearSecret = () => {}, text = key => key }) {
  let initialized = false;
  let methodName = 'subscription';
  let subscription = 'codex';
  const subscriptions = [...subscriptionProviders, 'minimax'];
  function showSubscription(provider = subscription) {
    subscription = subscriptions.includes(provider) ? provider : 'codex';
    $('subscription-provider').value = subscription;
    for (const id of subscriptionProviders) $(`setup-card-${id}`).hidden = id !== subscription;
    $('minimax-panel').hidden = subscription !== 'minimax';
    $('minimax-panel').open = subscription === 'minimax';
  }
  function renderIntro() {
    if (!['subscription','api','local'].includes(methodName)) return;
    $('connection-route-title').textContent = text(`connectionTitle_${methodName}`);
    $('connection-route-help').textContent = text(`connectionHint_${methodName}`);
  }
  $('subscription-provider').addEventListener('change', () => {
    clearSecret();
    showSubscription($('subscription-provider').value);
  });
  function show(method, provider) {
    initialized = true;
    methodName = method;
    $('setup-connection-body').scrollTop = 0;
    renderIntro();
    clearSecret();
    for (const name of ['subscription','api','local','youtube','help']) $(`method-${name}`).setAttribute('aria-pressed', String(name === method));
    $('subscription-connections').hidden = method !== 'subscription';
    $('model-connections').hidden = !['api','local'].includes(method);
    $('connection-youtube').hidden = method !== 'youtube';
    $('connection-help').hidden = method !== 'help';
    $('connection-analysis-intro').hidden = ['youtube','help'].includes(method);
    if (method === 'subscription') showSubscription(provider);
    if (['api','local'].includes(method)) setMethod(method, provider);
  }
  for (const method of ['subscription','api','local','youtube','help']) $(`method-${method}`).addEventListener('click', () => { initialized=true; show(method); });
  return {
    show,
    reset() { initialized=false; },
    render(provider) {
      renderIntro();
      if (initialized || !provider) return;
      initialized=true;
      show((provider === 'minimax' || subscriptionProviders.includes(provider)) ? 'subscription' : isLocalProvider(provider) ? 'local' : 'api', provider);
    },
  };
}
