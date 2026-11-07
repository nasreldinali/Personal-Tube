import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsSections } from '../public/ui/settings-sections.js';
import { setupDocumentFixture } from './fixtures.js';
test('settings navigation displays one panel, preserves unsaved values and resets to YouTube on open',()=>{
  const before=globalThis.document,f=setupDocumentFixture();globalThis.document=f.document;
  try{
    const n=id=>f.document.getElementById(id),sections=createSettingsSections();sections.reset();
    assert.equal(n('settings-panel-youtube').hidden,false);assert.equal(n('settings-panel-data').hidden,true);
    n('api-key').value='unsaved key';n('refresh-mode').value='manual';n('settings-nav-refresh').listeners.click();
    assert.equal(n('settings-panel-youtube').hidden,true);assert.equal(n('settings-panel-refresh').hidden,false);
    assert.equal(n('settings-nav-refresh').attributes['aria-pressed'],'true');
    n('settings-nav-data').listeners.click();n('settings-nav-usage').listeners.click();sections.reset();
    assert.equal(n('api-key').value,'unsaved key');assert.equal(n('refresh-mode').value,'manual');assert.equal(n('settings-panel-youtube').hidden,false);
  }finally{globalThis.document=before;}
});
