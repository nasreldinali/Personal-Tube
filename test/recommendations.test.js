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
  const row = { id: VIDEO.id, snippet: { title: 'Fixture', description: 'x'.repeat(1500), channelId: CHANNEL.id, channelTitle: 'Fixture', defaultAudioLanguage: 'ar-SA' }, status: { privacyStatus: 'public' }, statistics: { viewCount: '200000', likeCount: '3000' } };
  assert.equal(candidateVideos([row], settings).length, 1);
  assert.equal(candidateVideos([row], settings)[0].description.length,1000);
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
test('analysis sample excludes creators, repeated authors and duplicate text, retaining up to twenty', () => {
  const comment = (id, text, author) => ({snippet:{topLevelComment:{id,snippet:{textOriginal:text,likeCount:1,authorChannelId:{value:author}}}}});
  const rows = [comment('owner','Buy my course',CHANNEL.id),comment('a','Helpful tutorial','viewer-a'),comment('b','Another comment','viewer-a'),comment('c','  Helpful   tutorial ','viewer-b'),comment('d','   ','viewer-c'),...Array.from({length:20},(_,i)=>comment(`v${i}`,`Useful detail ${i}`,`author${i}`))];
  const sample=commentSample(rows,CHANNEL.id);
  assert.equal(sample.comments.length,20);
  assert.equal(sample.comments[0].id,'a');
  assert.equal(sample.comments.some(c=>['owner','b','c','d'].includes(c.id)),false);
});


test('comment sampling reaches beyond engagement-heavy head comments without increasing analysis size', () => {
  const rows=Array.from({length:110},(_,i)=>({snippet:{topLevelComment:{id:`c${i}`,snippet:{textOriginal:`Distinct viewer comment ${i}`,likeCount:110-i,authorChannelId:{value:`author${i}`}}}}}));
  const sample=commentSample(rows,CHANNEL.id);
  assert.equal(sample.sampled,20);
  assert.equal(new Set(sample.comments.map(c=>c.id)).size,20);
  for(const id of ['c0','c1','c2','c3','c4','c99'])assert.ok(sample.comments.some(c=>c.id===id));
  assert.ok(sample.comments.filter(c=>Number(c.id.slice(1))>=20).length>=10);
  assert.ok(sample.comments.every(c=>Number(c.id.slice(1))<100));
});
