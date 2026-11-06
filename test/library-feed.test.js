import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibraryFeed } from '../public/ui/library-feed.js';
import { setupDocumentFixture, CHANNEL, VIDEO, NOW } from './fixtures.js';

test('feed selectors use fresh channel, library and fallback metadata without fetching data',()=>{
  const f=setupDocumentFixture(),previous=globalThis.document;globalThis.document=f.document;
  const $=id=>f.document.getElementById(id);let mode='channels',library={version:1,later:[],watched:[]};
  const state={version:1,days:7,channels:[CHANNEL],cache:{[CHANNEL.id]:{videos:[VIDEO],fetchedAt:NOW}}};
  for(const id of ['channel-filter','channel-name-filter','search','area','category'])$(id).value='';$('channel-kind').value='videos';$('duration').value='all';$('sort').value='top';
  try {
    const feed=createLibraryFeed({text:key=>key,now:()=>NOW,readPreferences:()=>({language:'en'}),readState:()=>state,readLibrary:()=>library,readMetadata:()=>({}),readCatalog:()=>({areas:[],videos:[]}),readMode:()=>mode,discoveryVideos:()=>[],bind(){}});
    assert.deepEqual(feed.filteredVideos().map(v=>v.id),[VIDEO.id]);
    $('channel-kind').value='shorts';assert.deepEqual(feed.filteredVideos(),[]);$('channel-kind').value='videos';
    library={...library,watched:[VIDEO.id]};$('hide-watched').checked=true;assert.deepEqual(feed.filteredVideos(),[]);
    mode='later';library={...library,later:['12345678901']};$('hide-watched').checked=false;
    assert.equal(feed.filteredVideos()[0].title,'YouTube · 12345678901');
    assert.equal(feed.getPageSize(),18);feed.resetPageSize();assert.equal(feed.getPageSize(),18);
  } finally {globalThis.document=previous;}
});
