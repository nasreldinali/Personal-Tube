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

test('independent endorsers exclude copied praise and count criticism separately',()=>{
 const make=(id,author,text,stance)=>normalizeComment({id,source:'hn',author,text,videoIds:['abcdefghijk'],date:'2026-11-06T12:00:00Z',sourceUrl:`https://news.ycombinator.com/item?id=${id}`,labels:{abcdefghijk:{stance,quote:text,origin:'analysis'}}},true);
 const rows=[make('1','alice','A clear explanation','rec'),make('2','bob','A clear explanation','rec'),make('3','alice','Another useful part','strong_rec'),make('4','charlie','The explanation is incorrect','critical')];
 const video=rankEvidence(rows)[0];assert.equal(video.independentRecommenders,1);assert.equal(video.positiveComments,2);assert.equal(video.criticalComments,1);
});

test('classification receives the requested topic as bounded data alongside the source context',async()=>{
 const {classificationInputs}=await import('../public/domain/community-evidence.js');
 const row={...comment('1','2026-01'),topic:'AI agents'};
 assert.equal(classificationInputs([row])[0].topic,'AI agents');
 assert.equal(classificationInputs([{...row,topic:'x'.repeat(500)}])[0].topic.length,120);
});

test('bounded evidence retains late independent endorsements and criticism',()=>{
 const rows=Array.from({length:20},(_,i)=>comment(String(i),'2026-01',String(i),'reference'));
 rows.push({...comment('21','2026-02','alice','rec'),text:'This tutorial explains the hard part clearly.'});
 rows.push({...comment('22','2026-02','bob','strong_rec'),text:'I recommend watching this explanation first.'});
 rows.push({...comment('23','2026-02','critic','critical'),text:'One example has a mistake.'});
 const video=rankEvidence(rows)[0];
 assert.equal(video.independentRecommenders,2);assert.ok(video.evidence.length<=20);
 assert.equal(video.evidence.filter(row=>['rec','strong_rec'].includes(row.stance)).length,2);
 assert.ok(video.evidence.some(row=>row.stance==='critical'));
 assert.ok(video.evidence.every(row=>!Object.hasOwn(row,'priority')));
});
