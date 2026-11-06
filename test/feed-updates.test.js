import test from 'node:test';
import assert from 'node:assert/strict';
import { createFeedUpdates } from '../public/data/feed-updates.js';
import { CHANNEL, VIDEO, NOW } from './fixtures.js';

test('refresh adapter preserves manual, visibility, interval, partial-failure and metadata behavior',async()=>{
  const previous={document:globalThis.document,window:globalThis.window,setInterval:globalThis.setInterval};
  globalThis.document={hidden:false,addEventListener(){}};globalThis.window={addEventListener(){}};globalThis.setInterval=()=>0;
  let state={version:1,days:7,channels:[CHANNEL,{...CHANNEL,id:'UC'+'b'.repeat(22)}],cache:{}},revision=0,preferences={refreshMode:'manual',refreshMinutes:60},busy=false,clock=NOW,metadata={},key='fixture',fail=false,stop=false,opened=0;
  const calls=[],notices=[],meter=[],errors=[];
  try {
    const updates=createFeedUpdates({readKey:()=>key,readState:()=>state,readRevision:()=>revision,readPreferences:()=>preferences,readMetadata:()=>metadata,reloadMetadata(){},saveMetadata:next=>{metadata=next;},recordUsage:value=>{meter.push(value);},isBusy:()=>busy,setBusy:value=>{busy=value;},isStale:()=>false,isStorageBlocked:()=>false,now:()=>clock,render(){},renderChannels(){},renderUsage(){},notify:(...args)=>{notices.push(args);},showError:error=>{errors.push(error);},commitState:next=>{state=next;revision++;},filteredVideos:()=>[VIDEO],getPageSize:()=>18,openSettings:()=>{opened++;},bind(){},createClient:(_key,onRequest)=>({recent:async channel=>{calls.push(channel.id);await onRequest('playlistItems');if(stop)document.hidden=true;if(fail&&channel.id===CHANNEL.id)throw {code:'network'};return {videos:[VIDEO],limited:false};},metadata:async ids=>{assert.deepEqual(ids,[VIDEO.id]);await onRequest('videos');return {[VIDEO.id]:{duration:'PT12M',fetchedAt:clock}};}})});
    await updates.refresh();assert.equal(calls.length,0);await updates.refresh(true);assert.equal(calls.length,2);assert.equal(meter.length,2);assert.equal(busy,false);
    preferences={refreshMode:'auto',refreshMinutes:60};await updates.refresh();assert.equal(calls.length,2);
    clock+=3600000;document.hidden=true;await updates.refresh();assert.equal(calls.length,2);
    document.hidden=false;await updates.refresh();assert.equal(calls.length,4);
    fail=true;await updates.refresh(true);assert.equal(calls.length,6);assert.equal(notices.at(-1)[0],'network');assert.equal(notices.at(-1)[2],true);assert.equal(state.cache[state.channels[1].id].videos.length,1);
    fail=false;stop=true;clock+=3600000;updates.resetRefreshAttempt();await updates.refresh();assert.equal(calls.length,7);assert.equal(busy,false);
    await updates.fetchDurations();assert.equal(metadata[VIDEO.id].duration,'PT12M');assert.equal(meter.at(-1),'videos');
    const used=meter.length;await updates.fetchDurations();assert.equal(meter.length,used);
    key='';await updates.fetchDurations();assert.equal(opened,1);assert.deepEqual(errors,[]);
  } finally {Object.assign(globalThis,previous);}
});
