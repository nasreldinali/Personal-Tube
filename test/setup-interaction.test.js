import test from 'node:test';
import assert from 'node:assert/strict';
import { createSetupPanel } from '../public/ui/setup-panel.js';
import { setupDocumentFixture } from './fixtures.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(overrides={}) {
 const before={document:globalThis.document,fetch:globalThis.fetch};const fixture=setupDocumentFixture();const requests=[];let visits=0;let remembered=false;const timers=new Map();let next=0;let clock=0;
 globalThis.document=fixture.document;
 const state={version:1,selected:'codex',providers:{codex:{installed:true,supported:true,connected:true},claude:{installed:true,supported:true,connected:true}},usage:{codex:{attempted:0,completed:0,failed:0,inputs:0},claude:{attempted:0,completed:0,failed:0,inputs:0}},...overrides};
 globalThis.fetch=async(_,options)=>{const body=JSON.parse(options.body);requests.push(body);if(body.action==='connect')state.selected=body.provider;return {ok:true,json:async()=>structuredClone(state)};};
 const panel=createSetupPanel({context:()=>({language:'en',storageReady:true}),finish:()=>{if(!remembered){visits++;remembered=true;}},openYouTube:()=>{},onError:error=>{throw error;},now:()=>clock,schedule:callback=>{timers.set(++next,callback);return next;},cancel:id=>timers.delete(id)});
 return {fixture,requests,timers,state,panel,visits:()=>visits,clearVisit:()=>{remembered=false;},setTime:value=>{clock=value;},restore(){globalThis.document=before.document;globalThis.fetch=before.fetch;},click(id){fixture.nodes.get(id).listeners.click();}};
}
test('connected account buttons explicitly activate the chosen provider and remain usable',async()=>{
 const f=setup();try{
  f.panel.open();await tick();assert.equal(f.fixture.nodes.get('setup-codex').disabled,false);
  f.click('setup-claude');await tick();assert.equal(f.requests[1].provider,'claude');assert.equal(f.requests[1].action,'connect');
  assert.equal(f.fixture.nodes.get('setup-claude').attributes['aria-pressed'],'true');assert.match(f.fixture.nodes.get('setup-message').textContent,/Claude/);
 }finally{f.restore();}
});
test('pending login polls until authenticated and stops on close',async()=>{
 const f=setup();try{
  f.state.providers.claude={installed:true,supported:true,connected:false,connection:'pending'};
  f.panel.open();await tick();assert.equal(f.timers.size,1);
  const callback=[...f.timers.values()][0];f.timers.clear();f.state.providers.claude.connected=true;callback();await tick();assert.equal(f.timers.size,0);
  f.state.providers.claude.connected=false;f.click('setup-check');await tick();assert.equal(f.timers.size,1);
  f.fixture.nodes.get('setup-dialog').listeners.close();assert.equal(f.timers.size,0);
 }finally{f.restore();}
});
test('polling has a deadline and errors are shown inside the dialog',async()=>{
 const f=setup();try{
  f.state.providers.codex={installed:true,supported:true,connected:false,connection:'pending'};
  f.panel.open();await tick();const callback=[...f.timers.values()][0];f.timers.clear();f.setTime(190000);callback();await tick();assert.equal(f.requests.length,1);assert.equal(f.timers.size,0);assert.match(f.fixture.nodes.get('setup-message').textContent,/did not finish/);
  globalThis.fetch=async()=>({ok:false,json:async()=>({error:'busy'})});f.click('setup-check');await tick();assert.match(f.fixture.nodes.get('setup-message').textContent,/update/i);assert.equal(f.timers.size,0);
 }finally{f.restore();}
});
test('missing provider opens installation help instead of a disabled dead end',async()=>{
 const f=setup();try{f.state.providers.claude.installed=false;f.panel.open();await tick();f.click('setup-claude');assert.equal(f.fixture.nodes.get('setup-help').open,true);assert.equal(f.requests.length,1);}finally{f.restore();}
});

test('first setup visit is saved before a reload or any dismissal path',async()=>{
 const f=setup();try{f.panel.open();assert.equal(f.visits(),1);await tick();f.fixture.nodes.get('setup-dialog').listeners.close();f.panel.open();await tick();assert.equal(f.visits(),1);}finally{f.restore();}
});
test('YouTube settings has a return path while ordinary settings close does not open setup',async()=>{
 const f=setup();try{
  f.fixture.document.getElementById('settings-dialog').listeners.close();assert.notEqual(f.fixture.nodes.get('setup-dialog').open,true);
  f.panel.open();await tick();f.click('setup-youtube');assert.equal(f.fixture.nodes.get('settings-back').hidden,false);
  f.fixture.nodes.get('settings-dialog').listeners.close();await tick();assert.equal(f.fixture.nodes.get('setup-dialog').open,true);assert.equal(f.fixture.nodes.get('settings-back').hidden,true);
 }finally{f.restore();}
});

test('revisiting setup after preferences reset records the visit again',async()=>{
 const f=setup();try{f.panel.open();await tick();f.clearVisit();f.fixture.nodes.get('setup-dialog').listeners.close();f.panel.open();await tick();assert.equal(f.visits(),2);}finally{f.restore();}
});

test('signed-in status distinguishes an untested account from a completed analysis',async()=>{
 const f=setup();try {
  f.panel.open();await tick();assert.match(f.fixture.nodes.get('setup-state-codex').textContent,/not yet tested/i);
  f.state.usage.codex.completed=1;f.click('setup-check');await tick();assert.match(f.fixture.nodes.get('setup-state-codex').textContent,/completed.*session/i);
 }finally{f.restore();}
});

test('subscription logout controls require a deliberate confirmation before sending the request',async()=>{
 const f=setup();try{
  f.panel.open();await tick();assert.equal(f.fixture.nodes.get('setup-logout-codex').hidden,false);
  f.click('setup-logout-codex');await tick();assert.equal(f.requests.some(x=>x.action==='logout'),false);
 }finally{f.restore();}
});

test('a recognized login releases API controls even when the login process is finishing',async()=>{
 const f=setup();try{
  f.state.providers.claude.connection='pending';f.state.providers.claude.connected=true;
  f.panel.open();await tick();assert.equal(f.fixture.nodes.get('api-model').disabled,false);
 }finally{f.restore();}
});
