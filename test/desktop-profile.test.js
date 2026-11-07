import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDesktopProfile } from '../scripts/desktop-profile.mjs';

test('desktop profile accepts only the versioned local Chrome directory and a display name', () => {
  assert.equal(parseDesktopProfile(null), null);
  assert.deepEqual(parseDesktopProfile({ version: 1, directory: 'Profile 2', name: 'Work', marker: 'fixture-marker-12345' }), { version: 1, directory: 'Profile 2', name: 'Work', marker: 'fixture-marker-12345' });
  assert.equal(parseDesktopProfile({ version: 1, directory: 'Default', name: 'Personal', marker: 'fixture-marker-12345' }).directory, 'Default');
  for (const data of [{ version: 2, directory: 'Default', name: 'Work', marker: 'fixture-marker-12345' }, { version: 1, directory: '../other', name: 'Work', marker: 'fixture-marker-12345' }, { version: 1, directory: '--user-data-dir=other', name: 'Work', marker: 'fixture-marker-12345' }, { version: 1, directory: 'Default', name: 'Work\nOther' }, { version: 1, directory: 'Default', name: '' }]) assert.throws(() => parseDesktopProfile({marker:'fixture-marker-12345',...data}), /profile/i);
});
