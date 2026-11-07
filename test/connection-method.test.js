import test from 'node:test';
import assert from 'node:assert/strict';
import { createConnectionMethod } from '../public/ui/connection-method.js';
import { setupDocumentFixture } from './fixtures.js';
test('method navigation reveals only relevant setup without changing the active provider',()=>{
 const before=globalThis.document,f=setupDocumentFixture();globalThis.document=f.document;const methods=[];let cleared=0;
 try {
  const ui=createConnectionMethod({setMethod:method=>methods.push(method),clearSecret:()=>{cleared++;}}),n=id=>f.document.getElementById(id);
  ui.render('codex');assert.equal(cleared,1);assert.equal(n('subscription-connections').hidden,false);assert.equal(n('model-connections').hidden,true);
  n('method-local').listeners.click();assert.equal(n('subscription-connections').hidden,true);assert.equal(n('model-connections').hidden,false);assert.equal(methods.at(-1),'local');assert.equal(n('method-local').attributes['aria-pressed'],'true');
  ui.render('codex');assert.equal(methods.at(-1),'local');
  ui.reset();ui.render('openrouter');assert.equal(methods.at(-1),'api');assert.equal(n('method-api').attributes['aria-pressed'],'true');
 }finally{globalThis.document=before;}
});
