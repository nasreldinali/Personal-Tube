import test from 'node:test';
import assert from 'node:assert/strict';
import { youtubeAnalysisInput, youtubeAnalysisRows, positiveYouTubeVideos } from '../public/domain/youtube-evidence.js';
import { VIDEO } from './fixtures.js';

const videos = () => [{ ...VIDEO, evidence: { sampled: 3, comments: [
  { id: 'a', text: 'This explanation helped me understand. Highly recommended.', likes: 3 },
  { id: 'b', text: 'أنصح بمشاهدة هذا الشرح المفيد', likes: 2 },
  { id: 'c', text: 'Do not watch this misleading video', likes: 100 },
] } }];
const labels = (stances = ['rec','strong_rec','critical']) => ({ version: 1, items: videos()[0].evidence.comments.map((c,i) => ({ key: `${i}:${VIDEO.id}`, stance: stances[i], quote: c.text })) });

test('YouTube analysis binds exact positive quotes, shows dissent and refuses weak evidence', () => {
  const result = positiveYouTubeVideos(videos(), labels());
  assert.equal(result.length, 1);
  assert.equal(result[0].evidence.positive, 2);
  assert.equal(result[0].evidence.critical, 1);
  assert.equal(result[0].evidence.analyzed, 3);
  assert.equal(result[0].evidence.comments.length, 2);
  assert.equal(result[0].evidence.comments[1].quote, videos()[0].evidence.comments[1].text);
  for (const stances of [['rec','reference','reference'], ['rec','reference','critical'], ['reference','joke','critical'], ['rec','critical','critical']]) assert.deepEqual(positiveYouTubeVideos(videos(), labels(stances)), []);
  for (const change of [{ quote: 'fabricated endorsement' }, { stance: 'positive' }, { key: '99:abcdefghijk' }]) {
    const value = labels(); Object.assign(value.items[0], change);
    assert.throws(() => positiveYouTubeVideos(videos(), value), { code: 'invalidClassification' });
  }
  assert.throws(() => positiveYouTubeVideos(videos(), { ...labels(), version: 2 }));
  assert.throws(() => positiveYouTubeVideos(videos(), { version: 1, items: [] }));
});

test('YouTube payload strips unrelated fields and validates bounds, duplicates and contact redaction', () => {
  const input = youtubeAnalysisInput(videos());
  assert.deepEqual(Object.keys(input).sort(), ['version','videos']);
  assert.deepEqual(Object.keys(input.videos[0]).sort(), ['comments','id','title']);
  assert.equal(youtubeAnalysisRows(input).length, 3);
  for (const value of [{ ...input, version: 9 }, { ...input, key: 'secret' }, { ...input, videos: [...input.videos,...input.videos] }, { ...input, videos: Array(9).fill(input.videos[0]) }]) assert.throws(() => youtubeAnalysisRows(value));
  const huge = structuredClone(input); huge.videos[0].comments[0].text = 'a'.repeat(1001);
  assert.throws(() => youtubeAnalysisRows(huge));
  const duplicate = structuredClone(input); duplicate.videos[0].comments[1].id = 'a';
  assert.throws(() => youtubeAnalysisRows(duplicate));
  const contact = videos(); contact[0].evidence.comments[0].text = 'Contact example@example.test';
  assert.equal(youtubeAnalysisRows(youtubeAnalysisInput(contact))[0].text.includes('@'), false);
});
