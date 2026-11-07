import test from 'node:test';
import assert from 'node:assert/strict';
import { createSetupPanel } from '../public/ui/setup-panel.js';
import { createProviderManager } from '../server/provider-manager.js';
import { createHandler } from '../server/http-app.js';
import { setupDocumentFixture, setupFetchFixture } from './fixtures.js';

test('service browsing and Help navigation preserve accounts through the real setup route',async()=>{
  const previous={document:globalThis.document,fetch:globalThis.fetch},f=setupDocumentFixture(),requests=[];
  const forbidden=()=>assert.fail('Browsing must not log in, log out, analyze or call an API');
  const manager=createProviderManager({inspect:async()=>({installed:true,supported:true,connected:true,method:'subscription'}),login:forbidden,logout:forbidden,classifiers:{codex:forbidden,claude:forbidden},now:()=>100000});
  const fetcher=setupFetchFixture(createHandler({setup:manager.control}));
  globalThis.document=f.document;globalThis.fetch=(url,options)=>{requests.push(JSON.parse(options.body));return fetcher(url,options);};
  const tick=()=>new Promise(resolve=>setImmediate(resolve)),n=id=>f.document.getElementById(id);
  try {
    const panel=createSetupPanel({context:()=>({language:'en',storageReady:true}),finish(){},openYouTube(){},onError:error=>{throw error;}});
    panel.open();await tick();assert.equal(n('subscription-provider').value,'codex');
    n('subscription-provider').value='claude';n('subscription-provider').listeners.change();
    assert.equal(n('setup-card-claude').hidden,false);assert.equal(n('setup-card-codex').hidden,true);
    n('setup-check').listeners.click();await tick();assert.equal(n('subscription-provider').value,'claude');
    n('method-api').listeners.click();n('analysis-key').value='test-only-unsent';n('api-cost-consent').checked=true;
    n('method-local').listeners.click();assert.equal(n('analysis-key').value,'');assert.equal(n('api-cost-consent').checked,false);
    assert.ok(n('api-provider').children.every(option=>['ollama','lmstudio','local-openai'].includes(option.value)));
    n('method-help').listeners.click();n('subscription-account').value='copilot';n('subscription-account').listeners.change();n('subscription-guide-action').listeners.click();
    assert.equal(n('subscription-provider').value,'copilot');assert.equal(n('setup-card-copilot').hidden,false);assert.equal(n('connection-help').hidden,true);
    n('subscription-provider').value='minimax';n('subscription-provider').listeners.change();n('minimax-key').value='test-only-unsent';n('minimax-consent').checked=true;
    n('subscription-provider').value='codex';n('subscription-provider').listeners.change();assert.equal(n('minimax-key').value,'');assert.equal(n('minimax-consent').checked,false);
    assert.ok(requests.every(request=>request.action==='status'));
    const state=await manager.control({version:1,action:'status'});assert.equal(state.selected,'codex');assert.equal(state.providers.codex.connected,true);assert.equal(state.providers.claude.connected,true);assert.equal(state.usage.codex.attempted,0);
    panel.open();await tick();assert.equal(n('subscription-provider').value,'codex');
  }finally{globalThis.document=previous.document;globalThis.fetch=previous.fetch;}
});
