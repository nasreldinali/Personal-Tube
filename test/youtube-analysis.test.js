import test from 'node:test';
import assert from 'node:assert/strict';
import { createYouTubeAnalysis } from '../server/youtube-analysis.js';
import { VIDEO } from './fixtures.js';

const input = { version: 1, videos: [{ id: VIDEO.id, title: 'Fixture', comments: [{id:'one',text:'Recommended tutorial',likes:1}] }] };
test('YouTube analysis refuses unknown input before execution and validates model output', async () => {
  let calls = 0;
  const analyze = createYouTubeAnalysis({ classify: async () => { calls++; return {version:1,items:[]}; }, now: () => 1000 });
  await assert.rejects(analyze({...input,apiKey:'must-not-send'}));
  assert.equal(calls,0);
  await assert.rejects(analyze(input), {code:'invalidClassification'});
  assert.equal(calls,1);
});
test('YouTube analysis uses bounded mode, rejects concurrent calls and enforces cooldown', async () => {
  let done, clock=1000;
  const analyze = createYouTubeAnalysis({classify: (rows, mode) => {
    assert.equal(mode,'youtube'); assert.equal(rows.length,1);
    return new Promise(resolve=>{done=resolve;});
  }, now:()=>clock});
  const first=analyze(input);
  await assert.rejects(analyze(input),{code:'busy'});
  done({version:1,items:[{key:`0:${VIDEO.id}`,stance:'rec',quote:'Recommended tutorial'}]});
  assert.equal((await first).version,1);
  await assert.rejects(analyze(input),{code:'communityRateLimit'});
  clock+=15000;
  const next=analyze(input); done({version:1,items:[{key:`0:${VIDEO.id}`,stance:'reference',quote:''}]});
  await next;
});
