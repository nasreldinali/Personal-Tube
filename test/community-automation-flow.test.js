import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommunityController } from '../server/community-controller.js';
import { normalizeComment } from '../public/domain/community-evidence.js';
import { discoverCommunity } from '../public/services/community-discovery.js';

test('beginner search automatically analyzes a capped server sample and never presents neutral shares',async()=>{
  let analyzed=0;
  const rows=Array.from({length:100},(_,i)=>normalizeComment({id:String(i),source:'hn',date:'2026-11-04T00:00:00Z',text:'I recommend https://youtu.be/abcdefghijk',sourceUrl:`https://news.ycombinator.com/item?id=${i}`}));
  const controller=createCommunityController({now:()=>0,id:()=> 'fixture',archive:async()=>({}),catalog:async()=>({videos:[]}),collect:async()=>({comments:rows,scanned:100,limited:false}),analyze:async batch=>{analyzed++;return batch.map(r=>({...r,labels:{abcdefghijk:{stance:'reference',quote:'',origin:'analysis'}}}));}});
  const result=await discoverCommunity({request:body=>controller({version:1,...body}),onProgress:()=>{},isCancelled:()=>false},{source:'hn',query:'Fixture'});
  assert.equal(result.analyzed,72);assert.equal(result.pending,0);assert.equal(result.foundComments,100);assert.equal(result.limited,true);assert.equal(analyzed,3);assert.deepEqual(result.videos,[]);
  assert.deepEqual((await controller({version:1,action:'results',session:result.session,sort:'shared'})).videos,[]);
  await controller({version:1,action:'analyze',session:result.session});assert.equal(analyzed,3);
});
