import { createApiConnections } from './api-connections.js';
import { providerIds, providerNames } from '../domain/analysis-providers.js';
import { byId as $, element } from './dom.js';
import { t, number } from '../locale.js';
import { AppError } from '../domain/errors.js';

export function createSetupPanel({ context, finish, openYouTube, onError, schedule = setTimeout, cancel = clearTimeout, now = Date.now, confirm = () => {} }) {
  let result = null;
  let running = false;
  let message = '';
  let messageValues = {};
  let timer = null;
  let pollUntil = 0;
  let opened = false;
  let returningFromYouTube = false;
  const providers = ['codex', 'claude'];
  const name = provider => provider === 'claude' ? 'Claude' : providerNames[provider];
  const text = (key, values) => t(context().language, key, values);
  const apiPanel = createApiConnections({text,request,confirm});
  function stopPolling() { if (timer !== null) cancel(timer); timer = null; }
  function render() {
    $('setup-check').disabled = running;
    $('setup-youtube').textContent = text(context().hasKey ? 'manageConnection' : 'connectAction');
    $('setup-youtube-state').textContent = text(context().hasKey ? 'keySaved' : 'keyNeeded');
    for (const provider of providers) {
      const state = result?.providers[provider];
      const active = Boolean(state?.connected && result.selected === provider);
      const pending = state?.connection === 'pending' && !state.connected;
      const button = $(`setup-${provider}`);
      const missing = state && (!state.installed || !state.supported);
      button.disabled = running || context().busy || Boolean(result?.busy) || pending || !state;
      button.textContent = text(!state ? 'setupChecking' : missing ? 'installAction' : pending ? 'loginWaiting' : active ? 'usingProvider' : state.connected ? 'useProvider' : 'signInAction', { provider: name(provider) });
      button.setAttribute('aria-pressed', String(active));
      $(`setup-logout-${provider}`).hidden = !state?.connected;
      $(`setup-logout-${provider}`).disabled = running || context().busy || Boolean(result?.busy) || pending;
      $(`setup-card-${provider}`).dataset.active = String(active);
      $(`setup-badge-${provider}`).textContent = active ? text('activeProvider') : state?.connected ? text('connectedBadge') : '';
      const status = !state ? 'setupChecking' : !state.installed ? 'providerMissing' : !state.supported ? 'classifierVersion' : active ? ((state.tested ?? result.usage[provider].completed > 0) ? 'analysisTested' : 'activeConnectionHelp') : state.connected ? 'availableConnectionHelp' : pending ? 'loginAutoCheck' : state.connection === 'failed' ? 'connectionFailed' : state.method === 'other' ? 'subscriptionRequired' : 'providerDisconnected';
      $(`setup-state-${provider}`).textContent = text(status);
    }
    $('setup-status').replaceChildren(...['setupRuntime', context().storageReady ? 'setupStorageReady' : 'setupStorageBlocked'].map(key => element('li', '', text(key))));
    $('setup-message').textContent = running ? text('setupChecking') : message ? text(message, messageValues) : '';
    $('setup-usage').replaceChildren();
    apiPanel.render(result, running || context().busy || Boolean(result?.busy) || Boolean(result && providers.some(p=>result.providers[p]?.connection==='pending' && !result.providers[p]?.connected)));
    if (result) for (const provider of providerIds.filter(p=>result.usage[p])) {
      const usage = result.usage[provider];
      $('setup-usage').append(element('p', '', `${name(provider)} · ${text('usageCounts', Object.fromEntries(Object.entries(usage).map(([key, value]) => [key, number(context().language, value)])))}`));
    }
  }
  function poll() {
    stopPolling();
    if (!opened || !result || !providers.some(p => result.providers[p].connection === 'pending' && !result.providers[p].connected)) return;
    if (!pollUntil) pollUntil = now() + 185000;
    if (now() >= pollUntil) { message = 'connectionFailed'; render(); return; }
    timer = schedule(() => {
      timer = null;
      if (!opened) return;
      if (now() >= pollUntil) { message = 'connectionFailed'; render(); return; }
      void request('status');
    }, 2500);
  }
  async function request(action, provider = result?.selected || 'codex', extras = {}) {
    if (running) return;
    stopPolling(); running = true; message = ''; render();
    let succeeded = false;
    try {
      const response = await fetch('/api/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: 1, action, provider, ...extras }), signal: AbortSignal.timeout(action === 'test' ? 130000 : 25000) });
      const data = await response.json();
      if (!response.ok) throw new AppError(data.error || 'connectionFailed');
      if (data.version !== 1 || !providerIds.includes(data.selected) || !data.providers || !data.usage) throw new AppError('invalidSetup');
      for (const p of providers) if (!data.providers[p] || !data.usage[p] || ['attempted', 'completed', 'failed', 'inputs'].some(k => !Number.isSafeInteger(data.usage[p][k]) || data.usage[p][k] < 0)) throw new AppError('invalidSetup');
      result = data; succeeded = true;
      if (action === 'connect') { pollUntil = now() + 185000; message = data.providers[provider].connected ? 'providerSelected' : 'loginAutoCheck'; messageValues = { provider: name(provider) }; }
    } catch (error) {
      const allowed = ['busy', 'providerMissing', 'classifierVersion', 'connectionCooldown', 'connectionFailed', 'invalidSetup', 'analysisConnectionRequired', 'analysisKeyRequired', 'analysisCostRequired', 'analysisModelRequired', 'analysisAuthFailed', 'analysisRateLimit', 'analysisUnavailable', 'invalidClassification'];
      message = allowed.includes(error.code) ? error.code : 'setupCheckFailed';
    } finally { running = false; render(); if (succeeded) poll(); }
  }
  for (const provider of providers) $(`setup-${provider}`).addEventListener('click', () => {
    const state = result?.providers[provider];
    if (!state) return;
    if (!state.installed || !state.supported) { $('setup-requirements').open = true; $('setup-help').open = true; $('setup-help').scrollIntoView({ block: 'nearest' }); return; }
    void request('connect', provider);
  });
  for (const provider of providers) $(`setup-logout-${provider}`).addEventListener('click', () => {
    confirm(provider === 'codex' ? 'logoutCodexConfirm' : 'logoutClaudeConfirm', () => request('logout',provider,{confirm:true}));
  });
  $('setup-open').addEventListener('click', open);
  $('setup-check').addEventListener('click', () => { pollUntil = 0; void request('status'); });
  $('setup-dialog').addEventListener('close', () => { opened = false; stopPolling(); apiPanel.clearSecret(); });
  $('setup-youtube').addEventListener('click', () => { returningFromYouTube = true; $('settings-back').hidden = false; opened = false; stopPolling(); $('setup-dialog').close(); openYouTube(); });
  $('settings-back').addEventListener('click', () => $('settings-dialog').close());
  $('settings-dialog').addEventListener('close', () => {
    if (!returningFromYouTube) return;
    returningFromYouTube = false; $('settings-back').hidden = true; open();
  });
  $('setup-finish').addEventListener('click', () => { opened = false; stopPolling(); $('setup-dialog').close(); });
  function open() {
    try { finish(); } catch (error) { onError(error); }
    opened = true; pollUntil = 0; render(); $('setup-dialog').showModal(); void request('status');
  }
  return { open, render };
}
