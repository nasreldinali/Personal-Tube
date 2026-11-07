import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiConnections } from '../public/ui/api-connections.js';
import { setupDocumentFixture } from './fixtures.js';
test('API form sends explicit consent and clears secrets on submit, provider change and close',async()=>{
 const before=globalThis.document;const f=setupDocumentFixture();globalThis.document=f.document;const calls=[];
 try {
  const ui=createApiConnections({text:(key)=>key,request:async(...args)=>{calls.push(args);},confirm:(_,action)=>action()});
  const n=id=>f.document.getElementById(id);n('api-provider').value='openai';n('api-model').value='fixture';n('analysis-key').value='fixture-secret';n('api-cost-consent').checked=true;
  await n('api-connection-form').listeners.submit({preventDefault(){}});
  assert.equal(calls[0][0],'configure');assert.equal(calls[0][2].configuration.key,'fixture-secret');assert.equal(calls[0][2].configuration.acknowledgeCost,true);assert.equal(n('analysis-key').value,'');
  n('analysis-key').value='another-secret';n('api-provider').value='ollama';n('api-provider').listeners.change();assert.equal(n('analysis-key').value,'');assert.equal(n('api-cost-consent').checked,false);
  n('analysis-key').value='third-secret';ui.clearSecret();assert.equal(n('analysis-key').value,'');
 } finally {globalThis.document=before;}
});
test('changing method clears credentials and limits the provider list without a network request',()=>{
 const before=globalThis.document,f=setupDocumentFixture();globalThis.document=f.document;const calls=[];
 try {
  const n=id=>f.document.getElementById(id),ui=createApiConnections({text:key=>key,request:(...args)=>calls.push(args),confirm(){}});
  n('api-provider').value='openai';n('analysis-key').value='fixture';n('api-cost-consent').checked=true;
  ui.setMethod('local');assert.equal(n('api-provider').value,'ollama');assert.deepEqual(n('api-provider').children.map(x=>x.value),['ollama','lmstudio']);assert.equal(n('analysis-key').value,'');assert.equal(n('api-cost-consent').checked,false);assert.equal(n('api-key-field').hidden,true);
  ui.setMethod('api');assert.deepEqual(n('api-provider').children.map(x=>x.value),['openai','anthropic','openrouter']);assert.equal(calls.length,0);
 }finally{globalThis.document=before;}
});
