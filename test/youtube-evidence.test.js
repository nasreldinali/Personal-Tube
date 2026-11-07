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
  const result = positiveYouTubeVideos(videos(), labels(), 'language models');
  assert.equal(result.length, 1);
  assert.equal(result[0].evidence.positive, 2);
  assert.equal(result[0].evidence.critical, 1);
  assert.equal(result[0].evidence.analyzed, 3);
  assert.equal(result[0].evidence.comments.length, 2);
  assert.equal(result[0].evidence.comments[1].quote, videos()[0].evidence.comments[1].text);
  for (const stances of [['rec','reference','reference'], ['rec','reference','critical'], ['reference','joke','critical'], ['rec','critical','critical']]) assert.deepEqual(positiveYouTubeVideos(videos(), labels(stances), 'language models'), []);
  for (const change of [{ quote: 'fabricated endorsement' }, { stance: 'positive' }, { key: '99:abcdefghijk' }]) {
    const value = labels(); Object.assign(value.items[0], change);
    assert.throws(() => positiveYouTubeVideos(videos(), value, 'language models'), { code: 'invalidClassification' });
  }
  assert.throws(() => positiveYouTubeVideos(videos(), { ...labels(), version: 2 }, 'language models'));
  assert.throws(() => positiveYouTubeVideos(videos(), { version: 1, items: [] }, 'language models'));
});

test('YouTube payload strips unrelated fields and validates bounds, duplicates and contact redaction', () => {
  const input = youtubeAnalysisInput(videos(), 'language models');
  assert.deepEqual(Object.keys(input).sort(), ['topic','version','videos']);
  assert.deepEqual(Object.keys(input.videos[0]).sort(), ['comments','description','id','title']);
  assert.equal(youtubeAnalysisRows(input).length, 3);
  for (const value of [{ ...input, version: 9 }, { ...input, key: 'secret' }, { ...input, videos: [...input.videos,...input.videos] }, { ...input, videos: Array(9).fill(input.videos[0]) }]) assert.throws(() => youtubeAnalysisRows(value));
  const huge = structuredClone(input); huge.videos[0].comments[0].text = 'a'.repeat(1001);
  assert.throws(() => youtubeAnalysisRows(huge));
  const duplicate = structuredClone(input); duplicate.videos[0].comments[1].id = 'a';
  assert.throws(() => youtubeAnalysisRows(duplicate));
  const contact = videos(); contact[0].evidence.comments[0].text = 'Contact example@example.test';
  assert.equal(youtubeAnalysisRows(youtubeAnalysisInput(contact, 'language models'))[0].text.includes('@'), false);
});

test('topic and public context survive redaction and refuse absent, oversized or legacy input', () => {
  const source = videos(); source[0].description = 'A lesson about embeddings. Write to example@example.test';
  const topic = 'x'.repeat(199) + 'z';
  const input = youtubeAnalysisInput(source, topic);
  assert.equal(input.version, 2);
  const rows = youtubeAnalysisRows(input);
  assert.equal(rows[0].topic, topic);
  assert.match(rows[0].title, /embeddings/);
  assert.ok(!rows[0].title.includes('@'));
  for (const change of [{topic:''},{topic:'  '},{topic:null},{topic:'x'.repeat(201)},{version:1},{topic:undefined}]) {
    assert.throws(() => youtubeAnalysisRows({...input,...change}), {code:'invalidYouTubeAnalysis'});
  }
  for (const change of [{description:'x'.repeat(1001)},{description:null},{url:'https://example.test'}]) {
    assert.throws(() => youtubeAnalysisRows({...input,videos:[{...input.videos[0],...change}]}), {code:'invalidYouTubeAnalysis'});
  }
});
