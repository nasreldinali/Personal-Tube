import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserStore } from '../public/data/browser-store.js';
import { YouTubeClient } from '../public/data/youtube.js';
import { apiResponse, memoryStorage, CHANNEL } from './fixtures.js';

test('saved key reaches only the Google request header and resolves the requested channel', async () => {
  const store = new BrowserStore(memoryStorage(), memoryStorage());
  store.saveKey(' fixture-secret ', false);
  const client = new YouTubeClient(store.readKey(), async (url, options) => {
    assert.equal(url.origin, 'https://www.googleapis.com');
    assert.equal(url.searchParams.get('forHandle'), '@fixture');
    assert.equal(url.href.includes('fixture-secret'), false);
    assert.equal(options.headers['X-Goog-Api-Key'], 'fixture-secret');
    return apiResponse({ items: [{ id: CHANNEL.id, snippet: { title: CHANNEL.title }, contentDetails: { relatedPlaylists: { uploads: CHANNEL.uploads } } }] });
  });
  assert.equal((await client.resolve('https://youtube.com/@fixture?si=shared')).id, CHANNEL.id);
});
