import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommunityImport, mergeCollections, safeSourceLink } from '../public/domain/community.js';
import { parseDiscovery } from '../public/domain/discovery.js';

test('community import extracts YouTube references and deduplicates without inventing endorsement', () => {
  const text = JSON.stringify({ url: 'https://youtu.be/abcdefghijk', title: 'A useful talk', permalink: '/r/test/comments/abc/thread/' }) + '\n' + JSON.stringify({ body: 'https://www.youtube.com/watch?v=abcdefghijk' });
  const collection = parseCommunityImport(text, 'reddit', 'Fixture');
  assert.equal(collection.videos.length, 1);
  assert.equal(collection.videos[0].title, 'A useful talk');
  assert.equal(collection.videos[0].sourceUrl, 'https://www.reddit.com/r/test/comments/abc/thread/');
  assert.equal(collection.videos[0].recommenders, undefined);
  assert.equal(mergeCollections([], collection).length, 1);
});
test('community imports reject unknown formats, unsafe URLs and excessive sizes', () => {
  assert.equal(safeSourceLink('javascript:alert(1)', 'reddit'), '');
  assert.equal(safeSourceLink('https://reddit.com.evil.test/x', 'reddit'), '');
  assert.equal(safeSourceLink('https://user:secret@reddit.com/x', 'reddit'), '');
  assert.throws(() => parseCommunityImport('x'.repeat(2000001), 'reddit', 'Fixture'));
  assert.throws(() => parseCommunityImport('{"format":"personaltube-community","version":99,"videos":[]}', 'reddit', 'Fixture'));
  assert.throws(() => parseCommunityImport('not json', 'reddit', 'Fixture'));
  assert.throws(() => parseCommunityImport('[]', 'ngrams', 'Fixture'));
});
test('discovery state is versioned and refuses malformed persisted collection data', () => {
  const state = parseDiscovery(null);
  assert.equal(state.collapsed, false);
  assert.deepEqual(state.collections, []);
  assert.throws(() => parseDiscovery({ ...state, version: 9 }));
  assert.throws(() => parseDiscovery({ ...state, collapsed: 'yes' }));
  assert.throws(() => parseDiscovery({ ...state, collections: [{ source: 'reddit', name: 'x', videos: [{ id: '../x' }] }] }));
});

test('community source identifiers cannot be coerced from arrays in storage or imports', () => {
  const valid = parseCommunityImport('[{"url":"https://youtu.be/abcdefghijk"}]', 'reddit', 'Fixture');
  const state = parseDiscovery(null);
  assert.throws(() => parseDiscovery({ ...state, collections: [{ ...valid, source: ['reddit'] }] }));
  assert.throws(() => parseCommunityImport('[{"url":"https://youtu.be/abcdefghijk"}]', ['reddit'], 'Fixture'));
  assert.equal(safeSourceLink('https://reddit.com/r/test', ['reddit']), '');
});
