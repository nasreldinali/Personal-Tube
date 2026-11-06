import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibraryActions } from '../public/ui/library-actions.js';
import { setupDocumentFixture, VIDEO, NOW } from './fixtures.js';

test('library actions read current state and persist metadata before saved flags', () => {
  const f=setupDocumentFixture(),previous=globalThis.document;globalThis.document={...f.document,documentElement:{dataset:{}},querySelectorAll:()=>[],querySelector:()=>null};
  let library={version:1,later:[],watched:[]},metadata={},pending,busy=false,error;const writes=[];
  try {
    const panel=createLibraryActions({text:key=>key,readPreferences:()=>({language:'en',refreshMode:'manual'}),readLibrary:()=>library,readMetadata:()=>metadata,readState:()=>({cache:{}}),readMode:()=>'channels',isBusy:()=>busy,isStale:()=>false,discoveryVideos:()=>[],filteredVideos:()=>[VIDEO],saveLibrary:next=>{writes.push('library');library=next;},saveMetadata:next=>{writes.push('metadata');metadata=next;},savePreferences(){},now:()=>NOW,render(){},renderPlayerButtons(){},askConfirmation:(_message,action)=>{pending=action;},showError:value=>{error=value;},notify(){},bind(){}});
    panel.toggleSaved('later',VIDEO.id,VIDEO);assert.deepEqual(writes,['metadata','library']);assert.deepEqual(library.later,[VIDEO.id]);assert.equal(metadata[VIDEO.id].title,VIDEO.title);
    panel.toggleSaved('later',VIDEO.id,VIDEO);assert.deepEqual(library.later,[]);assert.equal(writes.at(-1),'library');
    panel.selectVideo(VIDEO.id,true);assert.equal(panel.selectedVideos.has(VIDEO.id),true);
    panel.confirmHide([VIDEO.id]);busy=true;assert.throws(pending,e=>e.code==='busy');assert.equal(library.hidden,undefined);
    busy=false;pending();assert.deepEqual(library.hidden,[VIDEO.id]);assert.equal(panel.selectedVideos.size,0);
    panel.selectVideo(VIDEO.id,true);panel.resetSelection();assert.equal(panel.selectedVideos.size,0);panel.renderPanelTools();assert.equal(globalThis.document.documentElement.dataset.selecting,'false');
    assert.equal(error,undefined);
  } finally {globalThis.document=previous;}
});
