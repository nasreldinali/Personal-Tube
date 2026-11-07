import test from 'node:test';
import assert from 'node:assert/strict';
import { createConnectionMethod } from '../public/ui/connection-method.js';
import { setupDocumentFixture } from './fixtures.js';
test('method navigation reveals only relevant setup without changing the active provider',()=>{
 const before=globalThis.document,f=setupDocumentFixture();globalThis.document=f.document;const methods=[];let cleared=0;
 try {
  const ui=createConnectionMethod({setMethod:method=>methods.push(method),clearSecret:()=>{cleared++;}}),n=id=>f.document.getElementById(id);
  ui.render('codex');assert.equal(cleared,1);assert.equal(n('subscription-connections').hidden,false);assert.equal(n('model-connections').hidden,true);
  n('setup-connection-body').scrollTop=450;n('method-local').listeners.click();assert.equal(n('setup-connection-body').scrollTop,0);assert.equal(n('subscription-connections').hidden,true);assert.equal(n('model-connections').hidden,false);assert.equal(methods.at(-1),'local');assert.equal(n('method-local').attributes['aria-pressed'],'true');
  ui.render('codex');assert.equal(methods.at(-1),'local');
  ui.reset();ui.render('openrouter');assert.equal(methods.at(-1),'api');assert.equal(n('method-api').attributes['aria-pressed'],'true');
 }finally{globalThis.document=before;}
});
test('YouTube and help have dedicated sections while navigation leaves provider choice alone',()=>{
 const before=globalThis.document,f=setupDocumentFixture();globalThis.document=f.document;const methods=[];
 try {
  const ui=createConnectionMethod({setMethod:p=>methods.push(p)}),n=id=>f.document.getElementById(id);ui.render('codex');
  n('method-youtube').listeners.click();assert.equal(n('connection-youtube').hidden,false);assert.equal(n('subscription-connections').hidden,true);assert.equal(n('model-connections').hidden,true);assert.deepEqual(methods,[]);
  n('method-help').listeners.click();assert.equal(n('connection-help').hidden,false);assert.equal(n('connection-youtube').hidden,true);
 }finally{globalThis.document=before;}
});
test('subscription browsing shows one service and preserves it through status refreshes',()=>{
 const before=globalThis.document,f=setupDocumentFixture();globalThis.document=f.document;const calls=[];let cleared=0;
 try {
  const n=id=>f.document.getElementById(id),ui=createConnectionMethod({setMethod:(...args)=>calls.push(args),clearSecret:()=>{cleared++;}});
  ui.render('claude');assert.equal(n('subscription-provider').value,'claude');
  assert.equal(n('setup-card-claude').hidden,false);assert.equal(n('setup-card-codex').hidden,true);assert.equal(n('setup-card-copilot').hidden,true);assert.equal(n('minimax-panel').hidden,true);
  n('subscription-provider').value='minimax';n('subscription-provider').listeners.change();
  assert.equal(n('minimax-panel').hidden,false);assert.equal(n('minimax-panel').open,true);assert.equal(n('setup-card-claude').hidden,true);assert.equal(cleared,2);
  ui.render('claude');assert.equal(n('subscription-provider').value,'minimax');
  ui.show('help');ui.show('subscription');assert.equal(n('minimax-panel').hidden,false);assert.deepEqual(calls,[]);
  ui.reset();ui.render('copilot');assert.equal(n('subscription-provider').value,'copilot');assert.equal(n('setup-card-copilot').hidden,false);assert.equal(n('minimax-panel').hidden,true);
 }finally{globalThis.document=before;}
});
test('invalid service selection falls back safely and help can reveal a supported account',()=>{
 const before=globalThis.document,f=setupDocumentFixture();globalThis.document=f.document;
 try {
  const n=id=>f.document.getElementById(id),ui=createConnectionMethod({setMethod:()=>{throw Error('No API navigation');}});
  ui.show('subscription','constructor');assert.equal(n('subscription-provider').value,'codex');
  ui.show('help');ui.show('subscription','claude');assert.equal(n('connection-help').hidden,true);assert.equal(n('setup-card-claude').hidden,false);assert.equal(n('setup-card-codex').hidden,true);
 }finally{globalThis.document=before;}
});
