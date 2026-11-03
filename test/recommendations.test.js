import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRecommendationSettings, candidateVideos, commentSample } from '../public/domain/recommendations.js';
import { VIDEO, CHANNEL } from './fixtures.js';

test('recommendation settings enforce bounds and declared audio language choices', () => {
  const defaults = parseRecommendationSettings(null);
  assert.equal(defaults.minViews, 100000);
  assert.equal(defaults.language, 'any');
  for (const change of [{ version: 9 }, { language: 'xxx' }, { minViews: -1 }, { minLikes: '10' }, { query: 'x'.repeat(201) }, { includeComments: 'true' }]) assert.throws(() => parseRecommendationSettings({ ...defaults, ...change }));
});
test('recommendation filtering refuses missing statistics and does not confuse text language with audio language', () => {
  const settings = { ...parseRecommendationSettings(null), language: 'ar' };
  const row = { id: VIDEO.id, snippet: { title: 'Fixture', channelId: CHANNEL.id, channelTitle: 'Fixture', defaultAudioLanguage: 'ar-SA' }, status: { privacyStatus: 'public' }, statistics: { viewCount: '200000', likeCount: '3000' } };
  assert.equal(candidateVideos([row], settings).length, 1);
  assert.equal(candidateVideos([{ ...row, snippet: { ...row.snippet, defaultAudioLanguage: undefined, defaultLanguage: 'ar' } }], settings).length, 0);
  assert.equal(candidateVideos([{ ...row, statistics: { viewCount: '200000' } }], settings).length, 0);
  assert.equal(candidateVideos([{ ...row, id: [VIDEO.id] }], settings).length, 0);
});
test('public comment sample is bounded, deduplicated and reports raw likes without a sentiment score', () => {
  const comment = (text, id) => ({ id, snippet: { topLevelComment: { id, snippet: { textOriginal: text, likeCount: 4 } } } });
  assert.deepEqual(commentSample([]).comments, []);
  const sample = commentSample([comment('Highly recommended', 'a'), comment('Highly recommended', 'a'), comment('Not recommended', 'b')]);
  assert.equal(sample.comments.length, 2);
  assert.equal(sample.comments[0].likes, 4);
  assert.equal(sample.comments[1].text, 'Not recommended');
  assert.equal('score' in sample, false);
  assert.equal('positive' in sample, false);
});
