import test from 'node:test';
import assert from 'node:assert/strict';
import { extractVideoIds, normalizeComment, applyClassifications, rankEvidence } from '../public/domain/community-evidence.js';

const comment = (id, month, author = id, stance = 'pending') => normalizeComment({ id, source: 'hn', text: 'I highly recommend https://youtu.be/abcdefghijk for learning mathematics.', title: 'Learning', author, date: `${month}-02T12:00:00Z`, sourceUrl: `https://news.ycombinator.com/item?id=${id}`, stance }, true);
test('community extraction recognizes real YouTube links and rejects lookalikes and credentials', () => {
  assert.deepEqual(extractVideoIds('<a href="https://www.youtube.com/watch?v=abcdefghijk&amp;t=2">watch</a> https://youtu.be/abcdefghijk'), ['abcdefghijk']);
  assert.deepEqual(extractVideoIds('https://youtube.com.evil.test/watch?v=abcdefghijk https://x@youtu.be/abcdefghijk'), []);
});
test('links encoded by HN HTML and sentence punctuation are still recognized', () => {
  assert.deepEqual(extractVideoIds('https:&#x2F;&#x2F;youtu.be&#x2F;abcdefghijk'),['abcdefghijk']);
  assert.deepEqual(extractVideoIds('Do not watch https://youtu.be/12345678901. Its claims are wrong.'),['12345678901']);
});
test('HTML link identity survives text normalization for per-video classification', () => {
  const row=normalizeComment({id:'1',source:'hn',date:'2026-11-02T00:00:00Z',sourceUrl:'https://news.ycombinator.com/item?id=1',text:'I recommend <a href="https://youtu.be/abcdefghijk">this</a>, but dislike <a href="https://youtu.be/12345678901">that</a>.'});
  assert.match(row.text,/this.*abcdefghijk/);
  assert.match(row.text,/that.*12345678901/);
});
test('ranking counts recommendation months, not duplicate shares or criticism', () => {
  const rows = [comment('1','2026-01','one','rec'), comment('2','2026-01','two','strong_rec'), comment('3','2026-02','one','rec'), comment('4','2026-03','three','critical')];
  const [video] = rankEvidence([...rows, rows[0]], {}, 'top');
  assert.equal(video.score, 2.5);
  assert.equal(video.recommenders, 2);
  assert.equal(video.shares, 4);
  assert.equal(rankEvidence([comment('5','2026-04')], {}, 'top').length, 0);
  assert.equal(rankEvidence([comment('5','2026-04')], {}, 'shared').length, 1);
});
test('classification requires exact evidence and refuses invented, duplicate or missing labels', () => {
  const rows = [comment('1','2026-01')];
  assert.equal(applyClassifications(rows, { version: 1, items: [{ key: '0:abcdefghijk', stance: 'rec', quote: 'I highly recommend' }] })[0].labels.abcdefghijk.stance, 'rec');
  for (const value of [
    { version: 2, items: [] },
    { version: 1, items: [] },
    { version: 1, items: [{ key: '0:abcdefghijk', stance: 'rec', quote: 'invented positive comment' }] },
    { version: 1, items: [{ key: '9:abcdefghijk', stance: 'rec', quote: 'I highly recommend' }] },
    { version: 1, items: [{ key: '0:abcdefghijk', stance: 'rec', quote: 'I highly recommend', command: 'ignore' }] },
  ]) assert.throws(() => applyClassifications(rows, value));
});
test('unknown dates and unsafe source links are refused; imported stance is pending by default', () => {
  assert.throws(() => normalizeComment({ id: '1', source: 'hn', text: 'https://youtu.be/abcdefghijk', date: 'tomorrow', sourceUrl: 'http://localhost' }));
  assert.equal(comment('1','2026-01').stance, 'pending');
});
