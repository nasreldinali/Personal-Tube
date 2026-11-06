import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsPanel } from '../public/ui/settings-panel.js';
import { setupDocumentFixture } from './fixtures.js';

test('settings reflect usage estimates, draft mode and current key without sharing key state', () => {
  const f=setupDocumentFixture(),previous=globalThis.document;globalThis.document=f.document;
  const $=id=>f.document.getElementById(id),handlers={};let usage=null,preferences={version:1,language:'en',theme:'dark',refreshMode:'manual',refreshMinutes:60},key='fixture',remember=true,busy=false;
  try {
    const panel=createSettingsPanel({text:(name,values)=>`${name}:${JSON.stringify(values)}`,readPreferences:()=>preferences,readUsage:()=>usage,hiddenCount:()=>0,readKey:()=>key,remembersKey:()=>remember,saveKey:(value,save)=>{key=value;remember=save;},forgetKey:()=>{key='';},savePreferences:value=>{preferences=value;},isBusy:()=>busy,bind:(id,_event,action)=>{handlers[id]=action;},render(){},notify(){},refresh(){}});
    panel.renderUsage();assert.equal($('usage-unavailable').hidden,false);
    usage={day:'2026-11-03',units:10001,search:3};panel.renderUsage();assert.equal($('usage-units-bar').value,10000);assert.match($('usage-units').textContent,/"remaining":"0"/);
    panel.openSettings();assert.equal($('api-key').value,'fixture');assert.equal($('remember-key').checked,true);assert.equal($('restore-hidden').disabled,true);assert.equal($('refresh-interval').disabled,true);
    $('refresh-mode').value='auto';panel.renderRefreshDraft();assert.equal($('refresh-interval').disabled,false);
    $('settings-dialog').listeners.close();assert.equal($('api-key').value,'');
    busy=true;assert.throws(()=>handlers['forget-key'](),error=>error.code==='busy');assert.equal(key,'fixture');
    busy=false;handlers['forget-key']();assert.equal(key,'');assert.equal($('remember-key').checked,false);
  } finally {globalThis.document=previous;}
});
