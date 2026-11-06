import test from 'node:test';
import assert from 'node:assert/strict';
import { createNavigationPanel } from '../public/ui/navigation-panel.js';
import { setupDocumentFixture } from './fixtures.js';

test('navigation preserves hash behavior, updates preferences and protects typing from shortcuts',()=>{
  const f=setupDocumentFixture(),previous={document:globalThis.document,window:globalThis.window,location:globalThis.location,history:globalThis.history};
  const handlers={},events={};let preferences={version:1,language:'ar',theme:'dark'},discovery={collapsed:false},mode,focused=0;
  const $=id=>f.document.getElementById(id);$('sidebar-toggle').lastElementChild={};$('search').focus=()=>{focused++;};
  globalThis.document={...f.document,documentElement:{dataset:{}},activeElement:{tagName:'INPUT'},querySelectorAll:()=>[],querySelector:()=>null,addEventListener:(name,action)=>{events[name]=action;}};
  globalThis.window={addEventListener:(name,action)=>{events[name]=action;}};globalThis.location={hash:'#later'};globalThis.history={replaceState:(_a,_b,hash)=>{globalThis.location.hash=hash;}};
  try {
    const panel=createNavigationPanel({text:key=>key,readPreferences:()=>preferences,readDiscovery:()=>discovery,savePreferences:next=>{preferences=next;},saveDiscovery:next=>{discovery=next;},setMode:value=>{mode=value;},resetPageSize(){},resetSelection(){},renderFilters(){},render(){},renderChannels(){},renderPlayerButtons(){},renderConfirmation(){},bind:(id,_event,action)=>{handlers[id]=action;}});
    panel.applyPreferences();assert.equal(document.documentElement.dir,'rtl');assert.equal(document.documentElement.dataset.theme,'dark');
    handlers['sidebar-toggle']();assert.equal(discovery.collapsed,true);assert.equal($('sidebar-toggle').attributes['aria-expanded'],'false');
    panel.changeMode('watched');assert.equal(mode,'watched');assert.equal(location.hash,'#watched');assert.equal($('search').value,'');
    location.hash='#feed';events.hashchange();assert.equal(mode,'watched');location.hash='#later';events.hashchange();assert.equal(mode,'later');
    events.keydown({key:'/',preventDefault(){}});assert.equal(focused,0);document.activeElement=null;events.keydown({key:'/',preventDefault(){}});assert.equal(focused,1);
  } finally {Object.assign(globalThis,previous);}
});
