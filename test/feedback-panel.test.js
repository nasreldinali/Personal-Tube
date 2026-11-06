import test from 'node:test';
import assert from 'node:assert/strict';
import { createFeedbackPanel } from '../public/ui/feedback-panel.js';
import { setupDocumentFixture } from './fixtures.js';

test('feedback translates safe errors, prioritizes storage faults and clears cancelled confirmations', async () => {
  const f = setupDocumentFixture(); const previous = globalThis.document;
  globalThis.document = { ...f.document, querySelectorAll: () => [] };
  const $ = id => f.document.getElementById(id); const handlers = {};
  let stale = false, blocked = false, language = 'en', calls = 0;
  try {
    const panel = createFeedbackPanel({ text: key => `${language}:${key}`, isStale: () => stale, isStorageBlocked: () => blocked, bind: (id, _event, callback) => { handlers[id] = callback; } });
    panel.notify('refreshed'); assert.equal($('notice').textContent, 'en:refreshed');
    panel.showError({ code: 'untrusted exception', message: 'private fixture' }, 'settings-error'); assert.equal($('settings-error').textContent, 'en:unexpected');
    blocked = true; panel.renderNotice(); assert.equal($('notice').textContent, 'en:storageRead');
    stale = true; panel.renderNotice(); assert.equal($('notice').textContent, 'en:storageConflict');
    panel.askConfirmation('confirmClear', () => { calls++; }); language = 'ar'; panel.renderConfirmation(); assert.equal($('confirm-text').textContent, 'ar:confirmClear');
    $('confirm-dialog').listeners.close(); await handlers['confirm-yes'](); assert.equal(calls, 0);
    panel.askConfirmation('confirmClear', () => { calls++; }); await handlers['confirm-yes'](); assert.equal(calls, 1);
    stale = false; blocked = false; panel.notify(); assert.equal($('notice').hidden, true);
  } finally { globalThis.document = previous; }
});
