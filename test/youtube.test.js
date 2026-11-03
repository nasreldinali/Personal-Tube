import test from 'node:test';
import assert from 'node:assert/strict';
import { YouTubeClient } from '../public/data/youtube.js';
import { parseChannel } from '../public/domain/feed.js';
import { apiResponse, CHANNEL, NOW } from './fixtures.js';

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
