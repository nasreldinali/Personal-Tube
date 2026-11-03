import test from 'node:test';
import assert from 'node:assert/strict';
import { YouTubeClient } from '../public/data/youtube.js';
import { parseChannel } from '../public/domain/feed.js';
import { apiResponse, CHANNEL, NOW } from './fixtures.js';

test('default browser transport is never called with the client as its receiver', async () => {
  const original = globalThis.fetch;
  let received = false;
  globalThis.fetch = function () {
    if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
    received = true;
    return Promise.resolve(apiResponse({ items: [] }));
  };
  try {
    const client = new YouTubeClient('fixture');
    assert.deepEqual(await client.request('channels', { part: 'snippet', forHandle: '@fixture' }), { items: [] });
    assert.equal(received, true);
  } finally { globalThis.fetch = original; }
});

test('malformed key characters reject before fetch and never become a network error', async () => {
  let calls = 0;
  for (const value of ['fixture\u200e', 'مفتاح', 'fixture\nheader', 'fixture key', '', 'x'.repeat(251)]) {
    const client = new YouTubeClient(value, async () => { calls++; throw new TypeError('private fixture'); });
    await assert.rejects(client.resolve('@fixture'), error => error.code === 'keyFormat' && !error.message.includes(value || 'private fixture'));
  }
  assert.equal(calls, 0);
});
test('timeout is distinct from blocked connections and error details stay private', async () => {
  const client = new YouTubeClient('fixture', async () => { throw new DOMException('private fixture', 'TimeoutError'); });
  await assert.rejects(client.resolve('@fixture'), error => error.code === 'youtubeTimeout');
  client.fetcher = async () => ({ ok: true, json: async () => { throw new DOMException('private fixture', 'TimeoutError'); } });
  await assert.rejects(client.resolve('@fixture'), error => error.code === 'youtubeTimeout');
  client.fetcher = async () => { throw new TypeError('private fixture'); };
  await assert.rejects(client.resolve('@fixture'), error => error.code === 'network' && !error.message.includes('private fixture'));
});

test('malformed URL escapes and oversized channel input fail with a safe typed error', () => {
  assert.throws(() => parseChannel('https://youtube.com/@bad%ZZ'), error => error.code === 'invalidChannel');
  assert.throws(() => parseChannel('@' + 'x'.repeat(10000)), error => error.code === 'invalidChannel');
});
test('API rejects invalid response shapes and unexpected resource names', async () => {
  const client = new YouTubeClient('fixture', async () => apiResponse({ items: 'not-an-array' }));
  await assert.rejects(client.resolve('@fixture'), error => error.code === 'invalidResponse');
  await assert.rejects(client.request('../outside', {}), error => error.code === 'invalidResource');
});
test('pagination has a fixed request budget and refuses incomplete results', async () => {
  let count = 0;
  const client = new YouTubeClient('fixture', async () => { count++; if (count > 6) throw new Error('Fixture request ceiling'); return apiResponse({ items: [], nextPageToken: `page${count}` }); });
  await assert.rejects(client.latest(CHANNEL, NOW), error => error.code === 'pageLimit');
  assert.ok(count <= 5);
});
test('metadata batches are limited to 50 IDs and malformed IDs never reach the network', async () => {
  let requests = 0;
  const client = new YouTubeClient('fixture', async url => { requests++; assert.ok(url.searchParams.get('id').split(',').length <= 50); return apiResponse({ items: [] }); });
  const ids = Array.from({ length: 60 }, (_, i) => String(i).padStart(11, '0'));
  await client.metadata(ids, NOW);
  assert.equal(requests, 2);
  await assert.rejects(client.metadata(['../bad'], NOW));
  assert.equal(requests, 2);
});
