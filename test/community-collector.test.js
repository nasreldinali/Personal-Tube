import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommunityCollector } from '../server/community-collector.js';
import { boundedJSON } from '../server/bounded-http.js';

test('collector fetches real-source routes with bounds and emits pending evidence', async () => {
  const urls = [];
  const collect = createCommunityCollector({ now: () => Date.parse('2026-11-03T00:00:00Z'), request: async url => {
    urls.push(url);
    return { hits: [{ objectID: '123', comment_text: '<a href="https://youtu.be/abcdefghijk">Excellent lecture</a>', story_title: 'Mathematics', author: 'fixture-user', created_at: '2026-11-02T10:00:00Z' }], nbPages: 1 };
  } });
  const result = await collect({ version: 1, source: 'hn', query: '', scope: '', days: 7 });
  assert.equal(result.comments.length, 1);
  assert.equal(result.comments[0].stance, 'pending');
  assert.equal(result.comments[0].author.includes('fixture-user'), false);
  assert.ok(urls.every(url => new URL(url).hostname === 'hn.algolia.com'));
  assert.ok(urls.length <= 4);
});
test('collector refuses unknown sources, injected scopes, unapproved Reddit and honors backoff', async () => {
  let calls = 0;
  const collect = createCommunityCollector({ now: () => 100000, request: async () => { calls++; return { items: [], backoff: 10 }; } });
  await assert.rejects(collect({ version: 1, source: 'file', query: '', scope: '', days: 7 }));
  await assert.rejects(collect({ version: 1, source: 'reddit', query: '', scope: '../all', days: 7 }));
  await assert.rejects(collect({ version: 1, source: 'reddit', query: '', scope: 'videos', days: 7 }));
  assert.equal(calls, 0);
  await collect({ version: 1, source: 'stackexchange', scope: 'stackoverflow', query: '', days: 7 });
  await assert.rejects(collect({ version: 1, source: 'stackexchange', scope: 'superuser', query: '', days: 7 }));
  assert.equal(calls, 1);
});
test('HTTP adapter refuses redirects, non-allowlisted destinations and oversized responses', async () => {
  let calls = 0;
  const fetcher = async (url, options) => { calls++; assert.equal(options.redirect, 'error'); return new Response('x'.repeat(40)); };
  await assert.rejects(boundedJSON('http://127.0.0.1/private', {}, fetcher));
  assert.equal(calls, 0);
  await assert.rejects(boundedJSON('https://hn.algolia.com/api/v1/search', { maxBytes: 20 }, fetcher));
});
