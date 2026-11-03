import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, readState, parseChannel, safeImage, visibleVideos, YouTubeClient } from '../public/core.js';

test('baseline schema refuses unknown versions and absent storage starts empty', () => {
  assert.deepEqual(readState({ getItem: () => null }, 1), emptyState());
  assert.throws(() => readState({ getItem: () => '{"version":99,"channels":[]}' }, 1));
});
test('baseline channel parser strips surrounding spaces and keeps username case', () => {
  assert.deepEqual(parseChannel('  @SomeChannel  '), { forHandle: '@SomeChannel' });
  assert.deepEqual(parseChannel('https://youtube.com/user/SomeChannel'), { forUsername: 'SomeChannel' });
});
test('baseline empty feed and image allowlist are stable', () => {
  assert.deepEqual(visibleVideos(emptyState(), { now: 1 }), []);
  assert.equal(safeImage('javascript:alert(1)'), '');
  assert.equal(safeImage('http://i.ytimg.com/a'), '');
  assert.equal(safeImage('https://i.ytimg.com/a'), 'https://i.ytimg.com/a');
});
test('baseline channel resolution refuses missing uploads', async () => {
  const client = new YouTubeClient('fixture', async () => ({ ok: true, json: async () => ({ items: [] }) }));
  await assert.rejects(client.resolve('@missing'));
});
