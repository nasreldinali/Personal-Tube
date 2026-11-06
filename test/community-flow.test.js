import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommunityController } from '../server/community-controller.js';
import { normalizeComment } from '../public/domain/community-evidence.js';

test('collect, classify and rank uses server evidence; fabricated batches and expired sessions refuse', async () => {
  let time = 0;
  const row = normalizeComment({ id: '1', source: 'hn', date: '2026-11-02T00:00:00Z', text: 'I recommend https://youtu.be/abcdefghijk', author: 'opaque', sourceUrl: 'https://news.ycombinator.com/item?id=1' });
  const controller = createCommunityController({ now: () => time, id: () => 'fixed-fixture', archive: async () => ({version:1,videos:[]}), catalog: async () => ({videos:[]}), collect: async () => ({comments:[row],scanned:1,limited:false}), analyze: async rows => rows.map(r => ({...r,labels:{abcdefghijk:{stance:'rec',quote:'I recommend',origin:'analysis'}}})) });
  const first = await controller({version:1,action:'collect',source:'hn',query:'',scope:'',days:7});
  assert.equal(first.pending,1);
  const second = await controller({version:1,action:'analyze',session:first.session,sort:'top'});
  assert.equal(second.videos[0].score,1);
  assert.equal(second.pending,0);
  await assert.rejects(controller({version:1,action:'analyze',session:'fake'}));
  time=3600001;
  await assert.rejects(controller({version:1,action:'results',session:first.session}));
});
test('invalid ranking never spends analysis quota or changes source evidence', async () => {
  let calls=0;
  const row=normalizeComment({id:'1',source:'hn',date:'2026-11-02T00:00:00Z',text:'https://youtu.be/abcdefghijk',sourceUrl:'https://news.ycombinator.com/item?id=1'});
  const controller=createCommunityController({now:()=>0,id:()=> 'fixture',archive:async()=>({}),catalog:async()=>({videos:[]}),collect:async()=>({comments:[row]}),analyze:async rows=>{calls++;return rows;}});
  await controller({version:1,action:'collect'});
  await assert.rejects(controller({version:1,action:'analyze',session:'fixture',sort:'not-a-sort'}));
  assert.equal(calls,0);
});
test('clear-all and scheduled expiry remove server evidence without a later read', async () => {
  let expire;
  const controller=createCommunityController({now:()=>0,id:()=> 'fixture',schedule:task=>{expire=task;return()=>{};},archive:async()=>({}),catalog:async()=>({videos:[]}),collect:async()=>({comments:[]}),analyze:async rows=>rows});
  await controller({version:1,action:'collect'});
  await controller({version:1,action:'clearAll'});
  await assert.rejects(controller({version:1,action:'results',session:'fixture'}));
  await controller({version:1,action:'collect'});
  expire();
  await assert.rejects(controller({version:1,action:'results',session:'fixture'}));
});
test('expired analysis cannot return deleted evidence or make clear-all report success while still active', async () => {
  let expire, finish;
  const row=normalizeComment({id:'1',source:'hn',date:'2026-11-02T00:00:00Z',text:'https://youtu.be/abcdefghijk',sourceUrl:'https://news.ycombinator.com/item?id=1'});
  const controller=createCommunityController({now:()=>0,id:()=> 'fixture',schedule:task=>{expire=task;return()=>{};},archive:async()=>({}),catalog:async()=>({videos:[]}),collect:async()=>({comments:[row]}),analyze:rows=>new Promise(resolve=>{finish=()=>resolve(rows);})});
  await controller({version:1,action:'collect'});
  const pending=controller({version:1,action:'analyze',session:'fixture'});
  expire();
  await assert.rejects(controller({version:1,action:'clearAll'}));
  finish();
  await assert.rejects(pending);
  assert.equal((await controller({version:1,action:'clearAll'})).version,1);
});
test('expired metadata lookup cannot return deleted collection results', async () => {
  let expire, finish, started;
  const ready=new Promise(resolve=>{started=resolve;});
  const controller=createCommunityController({now:()=>0,id:()=> 'fixture',schedule:task=>{expire=task;return()=>{};},archive:async()=>({}),catalog:async()=>({videos:[]}),collect:async()=>({comments:[]}),analyze:async rows=>rows,enrich:videos=>new Promise(resolve=>{finish=()=>resolve(videos);started();})});
  const pending=controller({version:1,action:'collect'});
  await ready;expire();finish();await assert.rejects(pending);
});
test('automatic discovery caps server-held evidence before any model call', async () => {
  const comments=Array.from({length:100},(_,i)=>normalizeComment({id:String(i),source:'hn',date:'2026-11-04T00:00:00Z',text:'https://youtu.be/abcdefghijk',sourceUrl:`https://news.ycombinator.com/item?id=${i}`}));
  const controller=createCommunityController({now:()=>0,id:()=> 'fixture',archive:async()=>({}),catalog:async()=>({videos:[]}),collect:async()=>({comments,scanned:100,limited:false}),analyze:async()=>{throw new Error('not during collection');}});
  const result=await controller({version:1,action:'discover'});
  assert.equal(result.totalComments,72);assert.equal(result.foundComments,100);assert.equal(result.analysisLimit,3);assert.deepEqual(result.videos,[]);
});
test('automatic session refuses model attempts beyond its server budget, including failed attempts',async()=>{
  let calls=0;
  const row=normalizeComment({id:'1',source:'hn',date:'2026-11-04T00:00:00Z',text:'https://youtu.be/abcdefghijk',sourceUrl:'https://news.ycombinator.com/item?id=1'});
  const controller=createCommunityController({now:()=>0,id:()=> 'fixture',archive:async()=>({}),catalog:async()=>({videos:[]}),collect:async()=>({comments:[row]}),analyze:async()=>{calls++;throw new Error('offline');}});
  await controller({version:1,action:'discover'});
  for(let i=0;i<3;i++)await assert.rejects(controller({version:1,action:'analyze',session:'fixture'}));
  await assert.rejects(controller({version:1,action:'analyze',session:'fixture'}),{code:'communityAnalysisStopped'});
  assert.equal(calls,3);
});

test('automatic results refuse a lone endorsement and retain multiple independent supporters',async()=>{
 for(const count of [1,2]) {
  const comments=Array.from({length:count},(_,i)=>normalizeComment({id:String(i),author:`person${i}`,source:'hn',date:'2026-11-06T12:00:00Z',text:`Useful explanation ${i} https://youtu.be/abcdefghijk`,sourceUrl:`https://news.ycombinator.com/item?id=${i}`}));
  const controller=createCommunityController({now:()=>0,id:()=> 'fixture',archive:async()=>({}),catalog:async()=>({videos:[]}),collect:async()=>({comments,scanned:count}),analyze:async rows=>rows.map(row=>({...row,labels:{abcdefghijk:{stance:'rec',quote:row.text,origin:'analysis'}}}))});
  await controller({version:1,action:'discover'});const result=await controller({version:1,action:'analyze',session:'fixture',sort:'top'});
  assert.equal(result.videos.length,count===1?0:1);
 }
});
