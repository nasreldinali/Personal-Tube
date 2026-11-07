import { byId as $ } from './dom.js';

export function createMiniMaxConnection({ text, request, confirm }) {
  const clearSecret = () => { $('minimax-key').value = ''; $('minimax-consent').checked = false; };
  function render(result, busy) {
    const state = result?.providers.minimax;
    const connected = Boolean(state?.connected);
    const active = result?.selected === 'minimax';
    $('minimax-state').textContent = text(!connected ? 'minimaxNotConfigured' : state.tested ? 'analysisTested' : 'apiConfigured');
    $('minimax-badge').textContent = active ? text('activeProvider') : connected ? text('minimaxSaved') : '';
    for (const id of ['minimax-save', 'minimax-key', 'minimax-consent']) $(id).disabled = busy || !state;
    $('minimax-test').disabled = busy || !connected;
    $('minimax-forget').disabled = busy || !connected;
    $('minimax-use').hidden = !connected || active;
    $('minimax-use').disabled = busy;
  }
  $('minimax-form').addEventListener('submit', async event => {
    event.preventDefault();
    const configuration = { provider: 'minimax', key: $('minimax-key').value.trim(), confirmSubscription: $('minimax-consent').checked };
    clearSecret();
    await request('configure', 'minimax', { configuration });
  });
  $('minimax-test').addEventListener('click', () => confirm('minimaxTestConfirm', () => request('test', 'minimax', { confirm: true })));
  $('minimax-use').addEventListener('click', () => { void request('connect', 'minimax'); });
  $('minimax-forget').addEventListener('click', () => confirm('apiRemoveConfirm', () => request('forget', 'minimax', { confirm: true })));
  return { render, clearSecret };
}
