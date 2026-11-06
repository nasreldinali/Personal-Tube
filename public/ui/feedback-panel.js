import { byId as $ } from './dom.js';
import { messages } from '../locale.js';

export function createFeedbackPanel({ text, isStale, isStorageBlocked, bind }) {
  let confirmation = null;
  let noticeKey = '';
  let noticeValues = {};
  let noticeError = false;
  function notify(name = '', values = {}, error = false) {
    noticeKey = name; noticeValues = values; noticeError = error;
    renderNotice();
  }
  function renderNotice() {
    const name = isStale() ? 'storageConflict' : isStorageBlocked() ? 'storageRead' : noticeKey;
    $('notice').hidden = !name;
    $('notice').textContent = name ? text(name, noticeValues) : '';
    $('notice').dataset.kind = isStorageBlocked() || noticeError ? 'error' : 'info';
  }
  function errorCode(error) { return messages.en[error?.code] ? error.code : 'unexpected'; }
  function showError(error, target) {
    const code = errorCode(error);
    notify(code, {}, true);
    if (target) $(target).textContent = text(code);
  }
  function askConfirmation(message, action) {
    confirmation = { message, action }; $('confirm-text').textContent = text(message); $('confirm-dialog').showModal();
  }
  bind('confirm-yes', 'click', async () => { const action = confirmation?.action; $('confirm-dialog').close(); await action?.(); }, 'settings-error');
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
  $('confirm-dialog').addEventListener('close', () => { confirmation = null; });
  function renderConfirmation() { if (confirmation) $('confirm-text').textContent = text(confirmation.message); }
  return { notify, renderNotice, showError, askConfirmation, renderConfirmation };
}
