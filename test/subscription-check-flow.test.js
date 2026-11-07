import test from 'node:test';
import assert from 'node:assert/strict';
import { createSetupPanel } from '../public/ui/setup-panel.js';
import { createProviderManager } from '../server/provider-manager.js';
import { createHandler } from '../server/http-app.js';
import { setupDocumentFixture } from './fixtures.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('setup sample buttons traverse same-origin HTTP and selected subscription classification without logout or API',async()=>{
 const before={document:globalThis.document,fetch:globalThis.fetch},f=setupDocumentFixture(),calls=[];let confirmation;
 const classify=provider=>async()=>{calls.push(provider);return {version:1,items:[{key:'0:abcdefghijk',stance:'rec',quote:'Recommended explanation'}]};};
 const manager=createProviderManager({inspect:async()=>({installed:true,supported:true,connected:true,method:'subscription'}),login:async()=>{throw Error('must not login');},logout:async()=>{throw Error('must not logout');},classifiers:{codex:classify('codex'),claude:classify('claude')},now:()=>100000});
 const handler=createHandler({setup:manager.control});
 globalThis.document=f.document;
 globalThis.fetch=async(url,options)=>{
  let status,reply;const req={url,method:options.method,headers:{host:'127.0.0.1:4173',origin:'http://127.0.0.1:4173','content-type':'application/json'},async *[Symbol.asyncIterator](){yield Buffer.from(options.body);}};
  await handler(req,{writeHead:code=>{status=code;},end:body=>{reply=JSON.parse(body);}});
  return {ok:status===200,json:async()=>reply};
 };
 try {
  const ui=createSetupPanel({context:()=>({language:'en',storageReady:true}),finish(){},openYouTube(){},onError:error=>{throw error;},confirm:(_text,action)=>{confirmation=action;}});
  ui.open();await tick();
  f.nodes.get('setup-test-codex').listeners.click();assert.deepEqual(calls,[]);await confirmation();
  assert.deepEqual(calls,['codex']);assert.match(f.nodes.get('setup-state-codex').textContent,/completed/);
  f.nodes.get('setup-claude').listeners.click();await tick();
  f.nodes.get('setup-test-claude').listeners.click();await confirmation();
  assert.deepEqual(calls,['codex','claude']);assert.match(f.nodes.get('setup-state-claude').textContent,/completed/);
  const status=await manager.control({version:1,action:'status'});assert.equal(status.providers.codex.connected,true);assert.equal(status.providers.claude.connected,true);assert.equal(status.usage.codex.completed,1);assert.equal(status.usage.claude.completed,1);
 } finally {globalThis.document=before.document;globalThis.fetch=before.fetch;}
});
