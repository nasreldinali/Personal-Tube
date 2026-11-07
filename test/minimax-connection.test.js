import test from 'node:test';
import assert from 'node:assert/strict';
import { createMiniMaxConnection } from '../public/ui/minimax-connection.js';
import { setupDocumentFixture } from './fixtures.js';
test('MiniMax UI separates save, consented test and selection, and clears typed keys',async()=>{
 const before=globalThis.document,f=setupDocumentFixture();globalThis.document=f.document;const calls=[];let confirmation;
 try {
  const ui=createMiniMaxConnection({text:key=>key,request:async(...args)=>calls.push(args),confirm:(_,action)=>{confirmation=action;}}),n=id=>f.document.getElementById(id);
  const state={selected:'codex',providers:{minimax:{connected:false}}};ui.render(state,false);
  n('minimax-key').value='sk-cp-fixture';n('minimax-consent').checked=true;await n('minimax-form').listeners.submit({preventDefault(){}});
  assert.equal(calls[0][0],'configure');assert.equal(calls[0][2].configuration.confirmSubscription,true);assert.equal(n('minimax-key').value,'');assert.equal(calls.length,1);
  state.providers.minimax.connected=true;ui.render(state,false);assert.equal(n('minimax-test').disabled,false);assert.equal(n('minimax-use').hidden,false);
  n('minimax-test').listeners.click();assert.equal(calls.length,1);await confirmation();assert.equal(calls[1][0],'test');assert.equal(calls[1][2].confirm,true);
  n('minimax-key').value='sk-cp-other';ui.clearSecret();assert.equal(n('minimax-key').value,'');
  n('minimax-use').listeners.click();assert.equal(calls[2][0],'connect');
 }finally{globalThis.document=before;}
});
