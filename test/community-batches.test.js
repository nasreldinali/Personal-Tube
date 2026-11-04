import test from 'node:test';
import assert from 'node:assert/strict';
import { communityBatches } from '../public/domain/community-batches.js';
import { classificationInputs } from '../public/domain/community-evidence.js';

const row = (id, links = 1, text = 'Recommend this') => ({ id: String(id), videoIds: Array.from({length:links},(_,i)=>String(i).padStart(11,'a')), title:'Fixture', text, labels:{} });
test('automatic samples fit three bounded analysis calls without splitting comment context', () => {
  const input=Array.from({length:90},(_,i)=>row(i));
  const result=communityBatches(input);
  assert.equal(result.batches.length,3); assert.equal(result.comments.length,72); assert.equal(result.omitted,18);
  const multi=communityBatches(Array.from({length:25},(_,i)=>row(i,5,'x'.repeat(1500))));
  assert.equal(multi.batches.length,3);
  assert.ok(multi.comments.length<25);
  for(const batch of multi.batches){assert.ok(classificationInputs(batch).length<=24);assert.ok(JSON.stringify(classificationInputs(batch)).length<=40000);}
  assert.equal(input[0].labels && Object.keys(input[0].labels).length,0);
});
test('oversized single comments and invalid batch budgets refuse', () => {
  assert.throws(()=>communityBatches([row(1,5,'x'.repeat(10000))]));
  for(const limit of [0,4,-1,1.2])assert.throws(()=>communityBatches([row(1)],limit));
  assert.equal(communityBatches([]).comments.length,0);
});
