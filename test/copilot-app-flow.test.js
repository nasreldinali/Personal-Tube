import test from 'node:test';
import assert from 'node:assert/strict';
import { createSetupPanel } from '../public/ui/setup-panel.js';
import { createProviderManager } from '../server/provider-manager.js';
import { createCopilotSubscription } from '../server/copilot-subscription.js';
import { openCopilot } from '../server/copilot-rpc.js';
import { createHandler } from '../server/http-app.js';
import { setupDocumentFixture, setupFetchFixture } from './fixtures.js';
import { copilotTransportFixture } from './copilot-transport-fixture.js';

test('Copilot app login, inactive confirmed test and explicit selection traverse the real HTTP and protocol adapters',async()=>{
  const previous={document:globalThis.document,fetch:globalThis.fetch},f=setupDocumentFixture(),sent=[];let connected=false,confirm,scheduled;
  const adapter=createCopilotSubscription({profile:'/fixture/copilot',run:async(_file,args)=>{
    assert.ok(!args.includes('login'),'login is separately injected below');return {stdout:'GitHub Copilot CLI 1.0.107.'};
  },scratch:async()=>({path:'/fixture/scratch',dispose:async()=>{}}),open:options=>{
    const transport=copilotTransportFixture({authenticated:connected,result:{version:1,items:[{key:'0:abcdefghijk',stance:'rec',quote:'Recommended explanation'}]}});
    sent.push(transport.messages);return openCopilot({...options,launch:transport.launch});
  }});
  const manager=createProviderManager({inspect:async()=>({installed:true,supported:true,connected:true,method:'subscription'}),login:()=>assert.fail('existing account changed'),logout:()=>assert.fail('existing account changed'),classifiers:{},now:()=>100000,copilot:{...adapter,login:async()=>{connected=true;}}});
  await manager.control({version:1,action:'select',provider:'claude'});
  const handler=createHandler({setup:manager.control});globalThis.document=f.document;globalThis.fetch=setupFetchFixture(handler);
  const tick=()=>new Promise(resolve=>setImmediate(resolve));
  try{
    const panel=createSetupPanel({context:()=>({language:'en',storageReady:true}),finish(){},openYouTube(){},onError:error=>{throw error;},confirm:(_key,action)=>{confirm=action;},schedule:action=>{scheduled=action;return 1;},cancel(){}});
    panel.open();await tick();const n=id=>f.document.getElementById(id);
    assert.equal(n('copilot-login').disabled,false);n('copilot-login').listeners.click();await tick();
    if(scheduled){scheduled();await tick();}else{n('setup-check').listeners.click();await tick();}
    assert.equal(n('copilot-test').disabled,false);n('copilot-test').listeners.click();
    assert.equal(sent.flat().filter(x=>x.method==='session.send').length,0);
    await confirm();assert.match(n('copilot-state').textContent,/completed/);
    let state=await manager.control({version:1,action:'status'});assert.equal(state.selected,'claude');assert.equal(state.usage.copilot.completed,1);
    assert.equal(state.providers.codex.connected,true);assert.equal(state.providers.claude.connected,true);
    n('copilot-use').listeners.click();await tick();state=await manager.control({version:1,action:'status'});assert.equal(state.selected,'copilot');
    assert.equal(sent.flat().filter(x=>x.method==='session.send').length,1);
    const denied=await globalThis.fetch('/api/setup',{method:'POST',body:JSON.stringify({version:1,action:'login',provider:'copilot'})},'https://foreign.example');assert.equal(denied.status,403);
  }finally{globalThis.document=previous.document;globalThis.fetch=previous.fetch;}
});
