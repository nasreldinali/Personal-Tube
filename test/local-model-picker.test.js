import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalModelPicker } from '../public/ui/local-models.js';
import { setupDocumentFixture } from './fixtures.js';
test('local model picker requires an explicit request and ignores results after service changes',async()=>{
 const before=globalThis.document,f=setupDocumentFixture();globalThis.document=f.document;let finish;const calls=[];
 try {
  const n=id=>f.document.getElementById(id);n('api-provider').value='ollama';
  const ui=createLocalModelPicker({text:k=>k,request:async(...args)=>{calls.push(args);return new Promise(resolve=>{finish=resolve;});}});ui.reset();assert.equal(calls.length,0);
  const pending=n('local-model-load').listeners.click();n('api-provider').value='lmstudio';ui.reset();finish({models:['old-model']});await pending;assert.equal(n('local-model-list').children.length,0);
  const next=n('local-model-load').listeners.click();finish({models:['small-model','big-model']});await next;assert.equal(n('local-model-list').children.length,3);
  n('local-model-list').value='small-model';n('local-model-list').listeners.change();assert.equal(n('api-model').value,'small-model');assert.equal(calls.length,2);
 }finally{globalThis.document=before;}
});
