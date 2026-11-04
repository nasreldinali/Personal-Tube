import test from 'node:test';
import assert from 'node:assert/strict';
import { createSetupPanel } from '../public/ui/setup-panel.js';
import { setupDocumentFixture } from './fixtures.js';
test('provider change submits the new selection even while progress redraws the form',async()=>{
 const before={document:globalThis.document,fetch:globalThis.fetch};const fixture=setupDocumentFixture();const requests=[];
 globalThis.document=fixture.document;
 const state={version:1,selected:'codex',providers:{codex:{installed:true,supported:true,connected:true},claude:{installed:true,supported:true,connected:true}},usage:{codex:{attempted:0,completed:0,failed:0,inputs:0},claude:{attempted:0,completed:0,failed:0,inputs:0}}};
 globalThis.fetch=async(_,options)=>{const body=JSON.parse(options.body);requests.push(body);if(body.action==='select')state.selected=body.provider;return {ok:true,json:async()=>structuredClone(state)};};
 try{
  const panel=createSetupPanel({context:()=>({language:'en',storageReady:true}),finish:()=>{},openYouTube:()=>{},onError:error=>{throw error;}});
  panel.open();await new Promise(resolve=>setImmediate(resolve));
  fixture.nodes.get('setup-provider').value='claude';fixture.nodes.get('setup-provider').listeners.change();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests[1].provider,'claude');assert.equal(fixture.nodes.get('setup-provider').value,'claude');
 }finally{globalThis.document=before.document;globalThis.fetch=before.fetch;}
});
