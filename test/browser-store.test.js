import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserStore } from '../public/data/browser-store.js';
import { emptyLibrary, toggleLibrary, parseBackup } from '../public/domain/library.js';
import { emptyState } from '../public/domain/feed.js';
import { memoryStorage, NOW, CHANNEL, VIDEO } from './fixtures.js';

test('malformed pasted keys cannot replace a working saved key', () => {
  const store = new BrowserStore(memoryStorage(), memoryStorage());
  store.saveKey('fixture-secret', false);
  for (const value of ['fixture\u200e', 'مفتاح', 'fixture key', 'fixture\r\nheader']) {
    assert.throws(() => store.saveKey(value, true), error => error.code === 'keyFormat');
    assert.equal(store.readKey(), 'fixture-secret');
    assert.equal(store.remembersKey(), false);
  }
});

test('library toggles are immutable and reject invalid IDs or actions', () => {
  const original = emptyLibrary();
  const changed = toggleLibrary(original, 'later', VIDEO.id);
  assert.deepEqual(original.later, []);
  assert.deepEqual(changed.later, [VIDEO.id]);
  assert.deepEqual(toggleLibrary(changed, 'later', VIDEO.id).later, []);
  assert.throws(() => toggleLibrary(original, '__proto__', VIDEO.id));
  assert.throws(() => toggleLibrary(original, 'later', '<script>'));
});
test('browser storage persists language, theme, channels and library; exports exclude all key material', () => {
  const storage = memoryStorage();
  const store = new BrowserStore(storage, memoryStorage());
  store.writePreferences({ version: 1, language: 'ar', theme: 'dark' });
  store.writeState({ ...emptyState(), channels: [CHANNEL] });
  store.writeLibrary(toggleLibrary(emptyLibrary(), 'later', VIDEO.id));
  store.saveKey('fixture-secret', false);
  const exported = store.exportData(NOW);
  assert.equal(JSON.stringify(exported).includes('fixture-secret'), false);
  assert.equal(new BrowserStore(storage, memoryStorage()).readPreferences().language, 'ar');
  assert.equal(exported.channels.length, 1);
  assert.equal(exported.library.later.length, 1);
});
test('unknown versions and malformed backups refuse before any writes', () => {
  const store = new BrowserStore(memoryStorage(), memoryStorage());
  store.writeState({ ...emptyState(), channels: [CHANNEL] });
  assert.throws(() => store.importData('{"version":999}', NOW));
  assert.equal(store.readState(NOW).channels.length, 1);
  assert.throws(() => parseBackup({ version: 1, format: 'personaltube-backup', channels: [{ id: '../x' }] }));
});
test('blocked storage and invalid schema fail visibly, and export/import round trip contains no cache', () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.throws(() => new BrowserStore(blocked, blocked).readPreferences());
  const a = new BrowserStore(memoryStorage(), memoryStorage());
  a.writeState({ ...emptyState(), channels: [CHANNEL], cache: { [CHANNEL.id]: { video: VIDEO, fetchedAt: NOW } } });
  const b = new BrowserStore(memoryStorage(), memoryStorage());
  b.importData(JSON.stringify(a.exportData(NOW)), NOW);
  assert.equal(b.readState(NOW).channels[0].id, CHANNEL.id);
  assert.deepEqual(b.readState(NOW).cache, {});
});

test('backup refuses coercible channel IDs and null objects rather than losing lists', () => {
  const store = new BrowserStore(memoryStorage(), memoryStorage());
  store.writeState({ ...emptyState(), channels: [CHANNEL] });
  const backup = store.exportData(NOW);
  for (const malformed of [
    { ...backup, channels: [{ ...CHANNEL, id: [CHANNEL.id] }] },
    { ...backup, preferences: null },
    { ...backup, library: null },
  ]) assert.throws(() => parseBackup(malformed));
});

test('stale tab cannot restore a channel after another tab clears local data', () => {
  const shared = memoryStorage();
  const a = new BrowserStore(shared, memoryStorage());
  a.writeState({ ...emptyState(), channels: [CHANNEL] });
  const stale = a.readState(NOW);
  const b = new BrowserStore(shared, memoryStorage());
  b.clearPersonalData();
  assert.throws(() => a.writeState(stale), error => error.code === 'storageConflict');
  assert.equal(b.readState(NOW).channels.length, 0);
});

test('expired metadata is removed from serialized cache, not only from the returned view', () => {
  const local = memoryStorage();
  const store = new BrowserStore(local, memoryStorage());
  store.writeMetadata({ [VIDEO.id]: { duration: 'PT1M', fetchedAt: NOW - 2 * 86400000 } });
  assert.deepEqual(store.readMetadata(NOW), {});
  assert.equal(local.getItem('personaltube.metadata.v1').includes(VIDEO.id), false);
});

test('a failed import rolls back and can be retried after a transient storage failure', () => {
  const local = memoryStorage();
  const store = new BrowserStore(local, memoryStorage());
  store.writeState({ ...emptyState(), channels: [CHANNEL] });
  const backup = { ...store.exportData(NOW), days: 3 };
  const original = local.setItem;
  let fail = true;
  local.setItem = (key, value) => { if (key === 'personaltube.preferences.v1' && fail) { fail = false; throw new Error('Fixture full storage'); } original(key, value); };
  assert.throws(() => store.importData(JSON.stringify(backup), NOW));
  store.importData(JSON.stringify(backup), NOW);
  assert.equal(store.readState(NOW).days, 3);
});


test('new interface languages survive storage and backup transfer without changing channels',()=>{
 for(const language of ['de','es']) {
  const storage=memoryStorage();const source=new BrowserStore(storage,memoryStorage());
  source.writePreferences({version:1,language,theme:'light'});source.writeState({...emptyState(),channels:[CHANNEL]});
  assert.equal(new BrowserStore(storage,memoryStorage()).readPreferences().language,language);
  const target=new BrowserStore(memoryStorage(),memoryStorage());target.importData(JSON.stringify(source.exportData(NOW)),NOW);
  assert.equal(target.readPreferences().language,language);assert.equal(target.readState(NOW).channels[0].id,CHANNEL.id);
 }
});
