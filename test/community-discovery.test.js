import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverCommunity } from '../public/services/community-discovery.js';

const result=pending=>({version:1,session:'fixture',analysisLimit:3,totalComments:50,foundComments:80,pending,analyzed:50-pending,videos:[]});
test('one search collects then completes all selected evidence without manual batch actions',async()=>{
  const calls=[],progress=[];
  const responses=[result(50),result(26),result(2),result(0)];
  const found=await discoverCommunity({request:async input=>{calls.push(input);return responses.shift();},onProgress:value=>progress.push(value),isCancelled:()=>false},{source:'hn',query:'math'});
  assert.deepEqual(calls.map(c=>c.action),['discover','analyze','analyze','analyze']);
  assert.ok(calls.slice(1).every(c=>c.sort==='top'&&c.session==='fixture'));
  assert.equal(found.pending,0);assert.equal(progress.at(-1).analyzed,50);
});
test('cancellation stops before the next chargeable call and retains only completed results',async()=>{
  let stop=false,calls=0;
  const found=await discoverCommunity({request:async()=>{calls++;return result(50);},onProgress:()=>{stop=true;},isCancelled:()=>stop},{source:'hn'});
  assert.equal(calls,1);assert.equal(found.stopped,true);assert.equal(found.analyzed,0);
});
test('no progress, session changes, malformed counts and provider failures never trigger another analysis',async()=>{
  for(const second of [result(50),{...result(26),session:'other'},{...result(26),analyzed:99}]){
    let calls=0;
    await assert.rejects(discoverCommunity({request:async()=>++calls===1?result(50):second,onProgress:()=>{},isCancelled:()=>false},{}));
    assert.equal(calls,2);
  }
  let calls=0;
  await assert.rejects(discoverCommunity({request:async()=>{if(++calls===1)return result(50);throw new Error('provider unavailable');},onProgress:()=>{},isCancelled:()=>false},{}));
  assert.equal(calls,2);
});
test('empty results need no model calls and invalid collection summaries refuse',async()=>{
  let calls=0;
  const empty={...result(0),totalComments:0,analyzed:0,foundComments:0};
  const found=await discoverCommunity({request:async()=>{calls++;return empty;},onProgress:()=>{},isCancelled:()=>false},{});
  assert.equal(calls,1);assert.equal(found.totalComments,0);
  for(const change of [{analysisLimit:100},{totalComments:73,pending:73,analyzed:0},{version:2}])await assert.rejects(discoverCommunity({request:async()=>({...empty,...change}),onProgress:()=>{},isCancelled:()=>false},{}));
});
test('automatic analysis cannot exceed its call budget even with apparently decreasing progress',async()=>{
  let calls=0;
  await assert.rejects(discoverCommunity({request:async()=>result(50-calls++),onProgress:()=>{},isCancelled:()=>false},{}),{code:'communityAnalysisStopped'});
  assert.equal(calls,4);
});
test('stop during an analysis waits for that response and never schedules the next one',async()=>{
  let finish,started,stop=false,calls=0;
  const ready=new Promise(resolve=>{started=resolve;});
  const pending=discoverCommunity({request:async()=>{if(++calls===1)return result(50);started();return new Promise(resolve=>{finish=resolve;});},onProgress:()=>{},isCancelled:()=>stop},{});
  await ready;stop=true;finish(result(26));
  const response=await pending;
  assert.equal(calls,2);assert.equal(response.stopped,true);assert.equal(response.analyzed,24);
});
