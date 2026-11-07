import { AppError } from '../public/domain/errors.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSetupPanel } from '../public/ui/setup-panel.js';
import { createProviderManager } from '../server/provider-manager.js';
import { createMiniMaxSubscription } from '../server/minimax-subscription.js';
import { createHandler } from '../server/http-app.js';
import { setupDocumentFixture, setupFetchFixture } from './fixtures.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('MiniMax setup and isolated sample traverse the UI and HTTP without changing connected CLI accounts',async()=>{
 const before={document:globalThis.document,fetch:globalThis.fetch},f=setupDocumentFixture();let confirmation,clock=100000,fail=false,finish;
 const calls=[];
 const minimax=createMiniMaxSubscription({request:async(provider,request)=>{
  calls.push({provider,request});if(fail)throw new AppError('analysisRateLimit');
  await new Promise(resolve=>{finish=resolve;});
  return {type:'message',stop_reason:'end_turn',content:[{type:'thinking',thinking:'not exposed'},{type:'text',text:JSON.stringify({version:1,items:[{key:'0:abcdefghijk',stance:'rec',quote:'Recommended explanation'}]})}]};
 }});
 const forbidden=()=>{throw Error('must not touch CLI accounts or paid API');};
 const manager=createProviderManager({inspect:async()=>({installed:true,supported:true,connected:true,method:'subscription'}),login:forbidden,logout:forbidden,classifiers:{codex:forbidden,claude:forbidden},minimax,now:()=>clock});
 await manager.control({version:1,action:'select',provider:'claude'});
 globalThis.document=f.document;globalThis.fetch=setupFetchFixture(createHandler({setup:manager.control}));
 const n=id=>f.document.getElementById(id);
 try {
  const ui=createSetupPanel({context:()=>({language:'en',storageReady:true}),finish(){},openYouTube(){},onError:forbidden,confirm:(_,action)=>{confirmation=action;}});
  ui.open();await tick();
  n('minimax-key').value='sk-standard-payg';n('minimax-consent').checked=true;
  await n('minimax-form').listeners.submit({preventDefault(){}});assert.match(n('setup-message').textContent,/subscription key/);assert.equal(calls.length,0);
  n('minimax-key').value='sk-cp-test-only';n('minimax-consent').checked=true;
  await n('minimax-form').listeners.submit({preventDefault(){}});assert.equal(n('minimax-key').value,'');assert.match(n('setup-active').textContent,/Claude/);assert.equal(calls.length,0);
  n('minimax-test').listeners.click();assert.equal(calls.length,0);const pending=confirmation();await tick();
  assert.equal(calls.length,1);assert.equal(n('minimax-save').disabled,true);
  for(const action of ['configure','connect','forget'])await assert.rejects(manager.control({version:1,action,provider:'minimax',...(action==='forget'?{confirm:true}:{})}),{code:'busy'});
  finish();await pending;assert.match(n('minimax-state').textContent,/completed/);assert.match(n('setup-active').textContent,/Claude/);
  const status=await manager.control({version:1,action:'status'});assert.ok(!JSON.stringify(status).includes('sk-cp-test-only'));assert.equal(status.providers.codex.connected,true);assert.equal(status.providers.claude.connected,true);assert.equal(status.usage.claude.attempted,0);assert.equal(status.usage.minimax.completed,1);
  clock+=60000;fail=true;n('minimax-test').listeners.click();await confirmation();assert.equal(calls.length,2);assert.match(n('setup-active').textContent,/Claude/);assert.match(n('setup-message').textContent,/limit/i);
  n('minimax-key').value='unsaved';n('setup-dialog').listeners.close();assert.equal(n('minimax-key').value,'');
  const foreign=await globalThis.fetch('/api/setup',{method:'POST',body:JSON.stringify({version:1,action:'test',provider:'minimax',confirm:true})},'https://foreign.test');assert.equal(foreign.status,403);assert.equal(calls.length,2);
 } finally {globalThis.document=before.document;globalThis.fetch=before.fetch;}
});
