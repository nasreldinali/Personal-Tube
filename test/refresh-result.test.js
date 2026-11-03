import test from 'node:test';
import assert from 'node:assert/strict';
import { applyRefreshResult } from '../public/services/refresh-result.js';
import { emptyState } from '../public/domain/feed.js';
import { CHANNEL, VIDEO, NOW } from './fixtures.js';

test('late refresh cannot restore cleared data or overwrite an import or expiry change', () => {
  const fetched = { ...emptyState(), channels: [CHANNEL], cache: { [CHANNEL.id]: { video: VIDEO, fetchedAt: NOW } } };
  for (const current of [emptyState(), { ...emptyState(), days: 1 }]) {
    const result = applyRefreshResult(current, fetched, 1, 2);
    assert.equal(result.applied, false);
    assert.equal(result.state, current);
  }
});
test('matching refresh changes only caches for current channels, preserving current preferences', () => {
  const current = { ...emptyState(), days: 3, channels: [CHANNEL] };
  const fetched = { ...emptyState(), cache: { [CHANNEL.id]: { video: VIDEO, fetchedAt: NOW }, stale: { video: VIDEO } } };
  const result = applyRefreshResult(current, fetched, 2, 2);
  assert.equal(result.applied, true);
  assert.equal(result.state.days, 3);
  assert.equal(result.state.cache[CHANNEL.id].video.id, VIDEO.id);
  assert.equal(result.state.cache.stale, undefined);
});
