import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommunityAnalysis } from '../server/community-analysis.js';
import { normalizeComment } from '../public/domain/community-evidence.js';

const row = () => normalizeComment({ id: '1', source: 'hn', date: '2026-11-02T00:00:00Z', text: 'I recommend https://youtu.be/abcdefghijk', sourceUrl: 'https://news.ycombinator.com/item?id=1' });
test('analysis uses a bounded server-held batch and validates evidence before accepting labels', async () => {
  let calls = 0;
  const analysis = createCommunityAnalysis({ classify: async rows => { calls++; assert.equal(rows.length,1); return { version: 1, items: [{ key: '0:abcdefghijk', stance: 'rec', quote: 'I recommend' }] }; } });
  const result = await analysis([row()]);
  assert.equal(result[0].labels.abcdefghijk.stance, 'rec');
  assert.equal(calls, 1);
  await assert.rejects(analysis(Array.from({length:25},row)));
  assert.equal(calls, 1);
});
test('a fabricated positive model quote fails closed without changing the input', async () => {
  const rows = [row()];
  const analysis = createCommunityAnalysis({ classify: async () => ({ version: 1, items: [{ key: '0:abcdefghijk', stance: 'strong_rec', quote: 'Fake!' }] }) });
  await assert.rejects(analysis(rows));
  assert.deepEqual(rows[0].labels, {});
});
