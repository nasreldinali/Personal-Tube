import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserStore } from '../public/data/browser-store.js';
import { emptyState, visibleVideos } from '../public/domain/feed.js';
import { refreshChannels } from '../public/services/refresh.js';
import { emptyLibrary, toggleLibrary } from '../public/domain/library.js';
import { memoryStorage, NOW, CHANNEL, VIDEO } from './fixtures.js';

test('add, refresh, save, reload, export, import and delete form one complete local flow', async () => {
  const storage = memoryStorage();
  const store = new BrowserStore(storage, memoryStorage());
  const state = { ...emptyState(), channels: [CHANNEL] };
  await refreshChannels(state, { recent: async () => ({ videos: [VIDEO], limited: false }) }, { now: NOW });
  store.writeState(state);
  assert.equal(visibleVideos(store.readState(NOW), { now: NOW }).length, 1);
  store.writeLibrary(toggleLibrary(emptyLibrary(), 'watched', VIDEO.id));
  const imported = new BrowserStore(memoryStorage(), memoryStorage());
  imported.importData(JSON.stringify(store.exportData(NOW)), NOW);
  assert.deepEqual(imported.readLibrary().watched, [VIDEO.id]);
  assert.equal(imported.readState(NOW).channels.length, 1);
  store.clearPersonalData();
  assert.equal(new BrowserStore(storage, memoryStorage()).readState(NOW).channels.length, 0);
  assert.deepEqual(store.readLibrary(), emptyLibrary());
});
