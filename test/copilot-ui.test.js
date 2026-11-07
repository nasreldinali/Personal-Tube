import test from 'node:test';
import assert from 'node:assert/strict';
import { createCopilotConnection } from '../public/ui/copilot-connection.js';
import { setupDocumentFixture } from './fixtures.js';
test('Copilot has separate login, test and Use actions; missing CLI shows local installation help',()=>{
  const before=globalThis.document,f=setupDocumentFixture();globalThis.document=f.document;const calls=[];
  try{
    const ui=createCopilotConnection({text:key=>key,request:(...args)=>calls.push(args),confirm:(key,fn)=>fn()});
    const n=id=>f.document.getElementById(id);
    ui.render({selected:'claude',providers:{copilot:{installed:false}}},false);assert.equal(n('copilot-install').hidden,false);assert.equal(n('copilot-login').disabled,true);
    ui.render({selected:'claude',providers:{copilot:{installed:true,supported:true,connected:false}}},false);n('copilot-login').listeners.click();assert.deepEqual(calls.pop(),['login','copilot']);
    ui.render({selected:'claude',providers:{copilot:{installed:true,supported:true,connected:true}}},false);assert.equal(n('copilot-test').disabled,false);n('copilot-test').listeners.click();assert.deepEqual(calls.pop(),['test','copilot',{confirm:true}]);
    n('copilot-use').listeners.click();assert.deepEqual(calls.pop(),['connect','copilot']);
    ui.render({selected:'claude',providers:{copilot:{installed:true,supported:true,connected:true}}},true);assert.equal(n('copilot-test').disabled,true);assert.equal(n('copilot-use').disabled,true);
  }finally{globalThis.document=before;}
});
