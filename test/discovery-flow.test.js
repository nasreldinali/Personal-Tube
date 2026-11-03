import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendVideos } from '../public/services/recommendations.js';
import { parseRecommendationSettings } from '../public/domain/recommendations.js';
import { BrowserStore } from '../public/data/browser-store.js';
import { parseCommunityImport } from '../public/domain/community.js';
import { memoryStorage, NOW, VIDEO, CHANNEL } from './fixtures.js';

test('recommendation path queries a topic, verifies metrics/audio and exposes analyzed positive evidence', async () => {
  const calls = [];
  const client = { request: async (resource, params) => {
    calls.push({ resource, params });
    if (resource === 'search') return { items: [{ id: { videoId: VIDEO.id } }] };
    if (resource === 'videos') return { items: [{ id: VIDEO.id, snippet: { title: 'Fixture', channelId: CHANNEL.id, channelTitle: 'Fixture', defaultAudioLanguage: 'en' }, status: { privacyStatus: 'public' }, statistics: { viewCount: '500000', likeCount: '6000' } }] };
    return { items: ['Excellent explanation, highly recommended', 'Very helpful, worth watching'].map((text, i) => ({ snippet: { topLevelComment: { id: `fixture${i}`, snippet: { textOriginal: text, likeCount: 10 } } } })) };
  } };
  const result = await recommendVideos(client, { ...parseRecommendationSettings(null), query: 'physics', language: 'en' }, async input => ({ version: 1, items: input.videos[0].comments.map((c,i) => ({ key: `${i}:${VIDEO.id}`, stance: 'rec', quote: c.text })) }));
  assert.equal(result.videos.length, 1);
  assert.equal(result.videos[0].channelCategory, 'physics');
  assert.equal(result.videos[0].evidence.comments.length, 2);
  assert.equal(calls[0].params.q, 'physics');
  assert.equal(calls[0].params.relevanceLanguage, 'en');
  assert.equal(calls.length, 3);
  assert.equal(calls[2].params.maxResults, '20');
});
test('community and recommendation settings round-trip through v2 backups while v1 remains readable', () => {
  const a = new BrowserStore(memoryStorage(), memoryStorage());
  const discovery = a.readDiscovery();
  discovery.collapsed = true;
  discovery.collections = [parseCommunityImport(JSON.stringify([{ url: 'https://youtu.be/abcdefghijk', title: 'Fixture talk' }]), 'reddit', 'Fixture')];
  a.writeDiscovery(discovery);
  a.saveKey('fixture-secret', true);
  const backup = a.exportData(NOW);
  assert.equal(backup.version, 2);
  assert.equal(JSON.stringify(backup).includes('fixture-secret'), false);
  const b = new BrowserStore(memoryStorage(), memoryStorage());
  b.importData(JSON.stringify(backup), NOW);
  assert.equal(b.readDiscovery().collections[0].videos.length, 1);
  assert.equal(b.readDiscovery().collapsed, true);
  const legacy = { ...backup, version: 1 }; delete legacy.discovery;
  b.importData(JSON.stringify(legacy), NOW);
  assert.equal(b.readDiscovery().collections.length, 0);
  b.clearPersonalData();
  assert.equal(b.readDiscovery().collapsed, false);
});

test('aggregate UTF-8 backup budget refuses an oversized merge while preserving recoverable prior data', () => {
  const store = new BrowserStore(memoryStorage(), memoryStorage());
  const records = Array.from({ length: 1000 }, (_, i) => ({ id: String(i).padStart(11,'a'), title: 'م'.repeat(500), channelTitle: 'م'.repeat(250), topic: '', sourceUrl: '' }));
  const first = { source: 'reddit', name: 'Fixture', enabled: true, videos: records };
  const second = { ...first, source: 'kaggle' };
  const discovery = store.readDiscovery();
  store.writeDiscovery({ ...discovery, collections: [first] });
  assert.throws(() => store.writeDiscovery({ ...discovery, collections: [first, second] }), { code: 'backupTooLarge' });
  const exported = JSON.stringify(store.exportData(NOW), null, 2);
  assert.ok(new TextEncoder().encode(exported).length <= 2000000);
  const target = new BrowserStore(memoryStorage(), memoryStorage());
  target.importData(exported, NOW);
  assert.equal(target.readDiscovery().collections.length, 1);
});
