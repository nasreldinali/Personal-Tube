import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChannel, withinWindow, visibleVideos, readState, emptyState, DAY, CACHE_TTL, YouTubeClient, refreshChannels, safeImage, durationLabel } from '../public/core.js';

const now = Date.parse('2026-11-03T12:00:00Z');
const id = 'UC' + 'a'.repeat(22);
const channel = { id, title: 'Test channel', category: 'تقنية', uploads: 'UUtest' };
const video = { id: 'abcdefghijk', title: 'Latest', publishedAt: new Date(now - DAY).toISOString() };
const response = data => ({ ok: true, json: async () => data });

test('channel forms resolve precisely; foreign domains and ambiguous legacy URLs reject', () => {
  assert.deepEqual(parseChannel(id), { id });
  assert.deepEqual(parseChannel(`https://www.youtube.com/channel/${id}/videos?view=0`), { id });
  assert.deepEqual(parseChannel('youtube.com/@lexfridman/videos'), { forHandle: '@lexfridman' });
  assert.deepEqual(parseChannel('https://youtube.com/@%D8%AA%D9%82%D9%86%D9%8A%D8%A9'), { forHandle: '@تقنية' });
  assert.deepEqual(parseChannel('https://youtube.com/user/Google'), { forUsername: 'Google' });
  for (const input of ['https://evil.test/@name', 'https://youtube.com.evil.test/@name', 'https://youtube.com/watch?v=abcdefghijk', 'https://youtube.com/c/old', 'arbitrary name']) assert.throws(() => parseChannel(input));
});
test('expiration uses publication time with exact boundaries, future and invalid dates excluded', () => {
  for (const days of [1, 3, 7]) {
    assert.equal(withinWindow(new Date(now - days * DAY).toISOString(), days, now), true);
    assert.equal(withinWindow(new Date(now - days * DAY - 1).toISOString(), days, now), false);
  }
  assert.equal(withinWindow('invalid', 7, now), false);
  assert.equal(withinWindow(new Date(now + 1).toISOString(), 7, now), false);
});
test('feed filters by channel category and text; removed channels never reappear', () => {
  const state = { ...emptyState(), channels: [channel], cache: { [id]: { fetchedAt: now, video } } };
  assert.equal(visibleVideos(state, { now, query: 'LATEST', category: 'تقنية' }).length, 1);
  assert.equal(visibleVideos(state, { now, category: 'رياضة' }).length, 0);
  assert.equal(visibleVideos(state, { now: now + 7 * DAY }).length, 0);
  state.channels = [];
  assert.equal(visibleVideos(state, { now }).length, 0);
});
test('storage round trip preserves channels and expiry, rejects malformed storage and expires cache', () => {
  const state = { ...emptyState(), days: 3, channels: [channel, channel], cache: { [id]: { fetchedAt: now, video } } };
  const storage = { getItem: () => JSON.stringify(state) };
  assert.equal(readState(storage, now).channels.length, 1);
  assert.equal(readState(storage, now).days, 3);
  assert.equal(readState(storage, now).cache[id].video.id, video.id);
  assert.deepEqual(readState(storage, now + 8 * DAY).cache, {});
  assert.throws(() => readState({ getItem: () => '{' }, now));
  assert.equal(safeImage('https://evil.test/tracker.png'), '');
});
test('channel API uses handle and uploads playlist from response; key is absent from URL', async () => {
  const client = new YouTubeClient('test-only', async (url, options) => {
    assert.equal(url.searchParams.get('forHandle'), '@test');
    assert.equal(url.searchParams.has('key'), false);
    assert.equal(options.headers['X-Goog-Api-Key'], 'test-only');
    return response({ items: [{ id, snippet: { title: 'Test' }, contentDetails: { relatedPlaylists: { uploads: 'UUactual' } } }] });
  });
  assert.equal((await client.resolve('@test')).uploads, 'UUactual');
});
test('latest uses video publication date, excludes upcoming/private/foreign videos, keeps non-embeddable newest', async () => {
  const make = (vid, age, status = {}, snippet = {}) => ({ id: vid, snippet: { title: vid, channelId: id, publishedAt: new Date(now - age).toISOString(), liveBroadcastContent: 'none', ...snippet }, status: { privacyStatus: 'public', embeddable: true, ...status }, contentDetails: { duration: 'PT1M' } });
  const client = new YouTubeClient('test-only', async url => response(url.pathname.endsWith('playlistItems')
    ? { items: [{ contentDetails: { videoId: 'abcdefghijk' } }] }
    : { items: [make('older000000', 2 * DAY), make('newest00000', DAY, { embeddable: false }), make('future00000', -DAY), make('upcoming000', 1, {}, { liveBroadcastContent: 'upcoming' }), make('private0000', 1, { privacyStatus: 'private' }), make('foreign0000', 1, {}, { channelId: 'other' })] }));
  const result = await client.latest(channel, now);
  assert.equal(result.id, 'newest00000');
  assert.equal(result.embeddable, false);
  assert.equal(result.publishedAt, video.publishedAt);
});
test('latest advances beyond unavailable items and handles empty channels', async () => {
  let calls = 0;
  const client = new YouTubeClient('test-only', async url => {
    calls++;
    if (url.pathname.endsWith('videos')) return response({ items: [] });
    return response(url.searchParams.has('pageToken') ? { items: [] } : { items: [{ contentDetails: { videoId: 'abcdefghijk' } }], nextPageToken: 'next' });
  });
  assert.equal(await client.latest(channel, now), null);
  assert.equal(calls, 3);
});
test('refresh caches successes and preserves failed channels with explicit errors', async () => {
  const second = { ...channel, id: 'UC' + 'b'.repeat(22), title: 'Other' };
  const state = { ...emptyState(), channels: [channel, second], cache: { [second.id]: { video, fetchedAt: now - DAY } } };
  let calls = 0;
  const client = { latest: async c => { calls++; if (c.id === second.id) throw new Error('Offline'); return video; } };
  assert.equal((await refreshChannels(state, client, { now })).length, 1);
  assert.equal(state.cache[id].fetchedAt, now);
  assert.equal(state.cache[second.id].fetchedAt, now - DAY);
  state.channels = [channel];
  await refreshChannels(state, client, { now: now + CACHE_TTL - 1 });
  assert.equal(calls, 2);
  await refreshChannels(state, client, { now: now + CACHE_TTL });
  assert.equal(calls, 3);
  await refreshChannels(state, client, { now, force: true });
  assert.equal(calls, 4);
});
test('successful empty result clears old video; deletion during request stays deleted', async () => {
  const state = { ...emptyState(), channels: [channel], cache: { [id]: { video, fetchedAt: now - DAY } } };
  await refreshChannels(state, { latest: async () => null }, { now });
  assert.equal(state.cache[id].video, null);
  await refreshChannels(state, { latest: async () => { state.channels = []; delete state.cache[id]; return video; } }, { now, force: true });
  assert.equal(state.cache[id], undefined);
});
test('API failures produce safe quota, key and network messages without response secrets', async () => {
  const client = new YouTubeClient('secret', async () => ({ ok: false, status: 403, json: async () => ({ error: { message: 'secret', errors: [{ reason: 'quotaExceeded' }] } }) }));
  await assert.rejects(client.latest(channel, now), /حصة API/);
  client.fetcher = async () => { throw new Error('secret'); };
  await assert.rejects(client.latest(channel, now), /الاتصال/);
});
test('duration formatter', () => {
  assert.equal(durationLabel('PT1H2M3S'), '1:02:03');
  assert.equal(durationLabel('PT9M'), '9:00');
  assert.equal(durationLabel('PT45S'), '0:45');
  assert.equal(durationLabel(''), '');
});
