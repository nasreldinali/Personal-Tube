import test from 'node:test';
import assert from 'node:assert/strict';
import { classificationInputs } from '../public/domain/community-evidence.js';
import { createProviderManager } from '../server/provider-manager.js';
const ready={installed:true,supported:true,connected:true,method:'subscription'};
const valid=rows=>({version:1,items:classificationInputs(rows).map(x=>({key:x.key,stance:'reference',quote:''}))});
const row={id:'one',videoIds:['abcdefghijk'],text:'A useful explanation',title:''};
test('provider selection is explicit, bounded and counts attempts without exposing account data',async()=>{
  let used='';
  const manager=createProviderManager({inspect:async()=>ready,login:async()=>{},classifiers:{codex:async()=>{used='codex';return valid([row]);},claude:async()=>{used='claude';return valid([row]);}},now:()=>100000});
  await manager.control({version:1,action:'select',provider:'claude'});await manager.classify([row]);
  const result=await manager.control({version:1,action:'status'});
  assert.equal(used,'claude');assert.equal(result.usage.claude.attempted,1);assert.equal(result.usage.claude.completed,1);assert.equal(result.usage.claude.inputs,1);
  await assert.rejects(manager.control({version:2,action:'status'}));await assert.rejects(manager.control({version:1,action:'connect',provider:'../sh'}));
});
test('missing login fails closed and a busy classifier cannot be switched',async()=>{
  let finish;let connected=false;
  const manager=createProviderManager({inspect:async()=>({...ready,connected}),login:async()=>{},classifiers:{codex:()=>connected?new Promise(resolve=>{finish=resolve;}):Promise.resolve(valid([row])),claude:async()=>{}},now:()=>100000});
  await assert.rejects(manager.classify([row]),{code:'analysisConnectionRequired'});
  connected=true;const pending=manager.classify([row]);await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(manager.control({version:1,action:'select',provider:'claude'}),{code:'busy'});finish(valid([row]));await pending;
});
test('login is not started for connected accounts and repeated login requests are bounded',async()=>{
  let calls=0;let connected=true;
  const manager=createProviderManager({inspect:async()=>({...ready,connected}),login:async()=>{calls++;},classifiers:{},now:()=>100000});
  await manager.control({version:1,action:'connect',provider:'codex'});assert.equal(calls,0);
  connected=false;await manager.control({version:1,action:'connect',provider:'codex'});await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(manager.control({version:1,action:'connect',provider:'codex'}),{code:'connectionCooldown'});assert.equal(calls,1);
});
test('malformed classification is counted as failed, never completed',async()=>{
 const manager=createProviderManager({inspect:async()=>ready,login:async()=>{},classifiers:{codex:async()=>({version:1,items:[]})},now:()=>100000});
 await assert.rejects(manager.classify([row]));
 const result=await manager.control({version:1,action:'status'});assert.equal(result.usage.codex.completed,0);assert.equal(result.usage.codex.failed,1);
});
test('connecting an already authenticated provider makes it active without launching login',async()=>{
 let calls=0;
 const manager=createProviderManager({inspect:async()=>ready,login:async()=>{calls++;},classifiers:{},now:()=>100000});
 const result=await manager.control({version:1,action:'connect',provider:'claude'});
 assert.equal(result.selected,'claude');assert.equal(calls,0);
});
