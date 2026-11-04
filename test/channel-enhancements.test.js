import test from 'node:test';
import assert from 'node:assert/strict';
import { YouTubeClient } from '../public/data/youtube.js';
import { withinWindow, visibleVideos } from '../public/domain/feed.js';
import { BrowserStore } from '../public/data/browser-store.js';
import { parsePreferences } from '../public/domain/preferences.js';
import { CHANNEL, VIDEO, NOW, memoryStorage, apiResponse } from './fixtures.js';

test('every daily window includes its boundary and refuses outside ages', () => {
  for(let days=1;days<=7;days++) {
    assert.equal(withinWindow(new Date(NOW-days*86400000).toISOString(),days,NOW),true);
    assert.equal(withinWindow(new Date(NOW-days*86400000-1).toISOString(),days,NOW),false);
  }
  assert.equal(withinWindow(VIDEO.publishedAt,8,NOW),false);
});
test('channel feed includes multiple videos and intersects name, category and content filters', () => {
  const videos=[VIDEO,{...VIDEO,id:'lmnopqrstuv',duration:'PT45S',publishedAt:new Date(NOW-4*86400000).toISOString()}];
  const state={version:1,days:7,channels:[CHANNEL],cache:{[CHANNEL.id]:{videos,fetchedAt:NOW}}};
  assert.equal(visibleVideos(state,{now:NOW}).length,2);
  assert.equal(visibleVideos({...state,days:3},{now:NOW}).length,1);
  assert.equal(visibleVideos(state,{now:NOW,channelId:'missing'}).length,0);
  assert.equal(visibleVideos(state,{now:NOW,kind:'shorts'}).length,1);
  assert.equal(visibleVideos(state,{now:NOW,kind:'videos'}).length,1);
  assert.equal(visibleVideos(state,{now:NOW,category:'missing'}).length,0);
});
test('recent uploads paginate, deduplicate and exclude old, upcoming and private videos', async () => {
  let pages=0;
  const client=new YouTubeClient('fixture',async url=>{
    if(url.pathname.endsWith('playlistItems'))return apiResponse({items:[{contentDetails:{videoId:pages++?'lmnopqrstuv':VIDEO.id}}],...(pages===1?{nextPageToken:'next'}:{})});
    const id=url.searchParams.get('id');
    return apiResponse({items:[{id,snippet:{title:'Fixture',channelId:CHANNEL.id,publishedAt:VIDEO.publishedAt},status:{privacyStatus:'public'},contentDetails:{duration:id===VIDEO.id?'PT5M':'PT45S'}}]});
  });
  const result=await client.recent(CHANNEL,NOW);
  assert.equal(result.videos.length,2);assert.equal(result.limited,false);assert.equal(pages,2);
});
test('new caches and all seven day values survive storage and backup roundtrip', () => {
  const store=new BrowserStore(memoryStorage(),memoryStorage());
  store.writeState({version:1,days:2,channels:[CHANNEL],cache:{[CHANNEL.id]:{videos:[VIDEO],fetchedAt:NOW,limited:false}}});
  assert.equal(store.readState(NOW).cache[CHANNEL.id].videos.length,1);
  assert.equal(store.exportData(NOW).days,2);
  const clone=new BrowserStore(memoryStorage(),memoryStorage());clone.importData(JSON.stringify(store.exportData(NOW)),NOW);
  assert.equal(clone.readState(NOW).days,2);
});
test('display preferences retain thumbnail choice and completed setup while refusing unknown values', () => {
  const value={version:1,language:'en',theme:'dark',thumbnail:'original',setupDone:true};
  assert.deepEqual(parsePreferences(value),value);
  assert.throws(()=>parsePreferences({...value,thumbnail:'https://bad.example'}));
});
test('recent upload sample is bounded and excludes invalid publication, foreign, private and upcoming items',async()=>{
 let count=0;
 const client=new YouTubeClient('fixture',async url=>{
  if(url.pathname.endsWith('playlistItems')){count++;return apiResponse({items:[{contentDetails:{videoId:VIDEO.id}},{contentDetails:{videoId:'lmnopqrstuv'}}],nextPageToken:'page'+count});}
  return apiResponse({items:[{id:VIDEO.id,snippet:{title:'Valid',channelId:CHANNEL.id,publishedAt:VIDEO.publishedAt},status:{privacyStatus:'public'}},{id:'lmnopqrstuv',snippet:{title:'Unavailable',channelId:CHANNEL.id,publishedAt:VIDEO.publishedAt,liveBroadcastContent:'upcoming'},status:{privacyStatus:'public'}},{id:'12345678901',snippet:{title:'Unrequested',channelId:CHANNEL.id,publishedAt:VIDEO.publishedAt},status:{privacyStatus:'public'}}]});
 });const result=await client.recent(CHANNEL,NOW);assert.equal(count,5);assert.equal(result.limited,true);assert.deepEqual(result.videos.map(v=>v.id),[VIDEO.id]);
});
