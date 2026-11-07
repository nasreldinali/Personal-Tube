import test from 'node:test';
import assert from 'node:assert/strict';
import { createProviderManager } from '../server/provider-manager.js';
import { classificationInputs } from '../public/domain/community-evidence.js';
test('Copilot login and sample test preserve Claude selection and both existing connections',async()=>{
  let connected=false;let logins=0;let tests=0;let inspected=0;
  const ready={installed:true,supported:true,connected:true,method:'subscription'};
  const manager=createProviderManager({inspect:async()=>{inspected++;return ready;},login:async()=>assert.fail('existing login touched'),logout:async()=>assert.fail('existing logout touched'),classifiers:{},now:()=>100000,copilot:{inspect:async()=>({...ready,connected}),login:async()=>{logins++;connected=true;},classify:async rows=>{tests++;return {version:1,items:classificationInputs(rows).map(x=>({key:x.key,stance:'rec',quote:x.text}))};}}});
  await manager.control({version:1,action:'select',provider:'claude'});
  await assert.rejects(manager.control({version:1,action:'connect',provider:'copilot'}),{code:'analysisConnectionRequired'});
  await manager.control({version:1,action:'login',provider:'copilot'});await new Promise(resolve=>setImmediate(resolve));
  const tested=await manager.control({version:1,action:'test',provider:'copilot',confirm:true});
  assert.equal(tested.selected,'claude');assert.equal(tested.providers.copilot.tested,true);assert.equal(logins,1);assert.equal(tests,1);assert.ok(inspected>0);
  assert.equal(tested.providers.codex.connected,true);assert.equal(tested.providers.claude.connected,true);
  await assert.rejects(manager.control({version:1,action:'logout',provider:'copilot',confirm:true}),{code:'invalidSetup'});
  assert.equal((await manager.control({version:1,action:'connect',provider:'copilot'})).selected,'copilot');
});
