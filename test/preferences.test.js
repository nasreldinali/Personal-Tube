import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePreferences, preferenceAttributes } from '../public/domain/preferences.js';
import { messages, t, number, areaName } from '../public/locale.js';

test('preferences default to English and automatic theme; reject unsupported versions and values', () => {
  assert.deepEqual(parsePreferences(null), { version: 1, language: 'en', theme: 'auto' });
  assert.throws(() => parsePreferences({ version: 2, language: 'en', theme: 'dark' }));
  assert.throws(() => parsePreferences({ version: 1, language: 'xx', theme: 'dark' }));
  assert.throws(() => parsePreferences({ version: 1, language: 'en', theme: 'invalid' }));
});
test('Arabic and English apply correct direction; automatic theme removes override', () => {
  assert.deepEqual(preferenceAttributes({ version: 1, language: 'ar', theme: 'light' }), { lang: 'ar', dir: 'rtl', theme: 'light' });
  assert.deepEqual(preferenceAttributes({ version: 1, language: 'en', theme: 'auto' }), { lang: 'en', dir: 'ltr', theme: null });
});
test('message catalogs have complete parity and matching template fields', () => {
  assert.deepEqual(Object.keys(messages.ar).sort(), Object.keys(messages.en).sort());
  for (const key of Object.keys(messages.en)) {
    assert.ok(messages.ar[key].trim());
    assert.deepEqual(messages.ar[key].match(/\{\w+\}/g)?.sort() || [], messages.en[key].match(/\{\w+\}/g)?.sort() || [], key);
  }
  assert.throws(() => t('en', 'missing-key'));
  assert.equal(number('ar', 123), '١٢٣');
  assert.equal(number('en', 123), '123');
  assert.notEqual(areaName('ar', 'software', 'Software'), 'Software');
});
