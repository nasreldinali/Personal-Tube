import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommunityFeed } from '../public/ui/community-feed.js';
import { setupDocumentFixture, apiResponse, CHANNEL } from './fixtures.js';

const candidate={id:'abcdefghijk',score:1,recommenders:2,independentRecommenders:2,positiveComments:2,criticalComments:0,evidence:[],shares:2};
const progress=(pending=0,videos=[])=>({version:1,session:'fixture',source:'hn',retryAfterSeconds:60,analysisLimit:3,totalComments:2,foundComments:2,scanned:2,pending,analyzed:2-pending,videos});
async function fixture(options={}) {
 const original=globalThis.document;const {document,nodes}=setupDocumentFixture();globalThis.document=document;
 const get=id=>document.getElementById(id);
 for(const [id,value] of Object.entries({'collect-source':'hn','collect-query':'math','collect-scope':'','collect-days':'30','collect-language':'any','collect-min-views':'100000','collect-min-likes':'1000','collect-min-recommenders':'2'}))get(id).value=value;
 let clock=100000,busy=false,opens=0,tick;
 const calls=[],errors=[];let metadataCalls=0;
 const context=()=>({mode:'community',language:'en',hasKey:options.hasKey!==false,busy,stale:false,library:{hidden:[],later:[],watched:[]},metadata:{},areas:[],selectedVideos:new Set()});
 const panel=createCommunityFeed({context,onPlay(){},onToggle(){},onError:error=>errors.push(error.code),setBusy:value=>{busy=value;},clock:()=>clock,schedule:callback=>{tick=callback;},openSettings:()=>{opens++;},
   fetcher:async(url,init)=>{const body=JSON.parse(init.body);calls.push(body);return options.fetcher?options.fetcher(body):apiResponse(body.action==='archive'?{version:1,source:'archive',videos:[],total:0,originalComments:0}:body.action==='discover'?progress(2):progress(0,[candidate]));},
   client:()=>({request:async()=>{metadataCalls++;if(options.failMetadata)throw new Error('offline');return {items:[{id:candidate.id,snippet:{channelId:CHANNEL.id,title:'Useful mathematics lecture',channelTitle:'Fixture'},status:{privacyStatus:'public'},statistics:{viewCount:options.low?'49':'100000',likeCount:options.low?'0':'1000'},contentDetails:{duration:'PT5M'}}]};}}),
 });
 const settle=async()=>{for(let i=0;i<60;i++)await Promise.resolve();assert.equal(busy,false);};
 return {panel,get,calls,errors,counts:()=>({opens,metadataCalls}),submit:async()=>{get('community-collect-form').listeners.submit({preventDefault(){}});await settle();},click:async id=>{get(id).listeners.click();await settle();},advance:seconds=>{clock+=seconds*1000;tick();},restore:()=>{globalThis.document=original;}};
}
test('live search needs a key before collection, but original library does not',async()=>{
 const f=await fixture({hasKey:false});try {
  await f.submit();assert.equal(f.counts().opens,1);assert.equal(f.calls.length,0);
  await f.click('community-browse-library');assert.equal(f.calls[0].action,'archive');assert.equal(f.counts().metadataCalls,0);
 }finally{f.restore();}
});
test('low-popularity results are withheld and cooldown disables retry until due',async()=>{
 const f=await fixture({low:true});try {
  await f.submit();assert.deepEqual(f.panel.videos(),[]);assert.match(f.get('collect-status').textContent,/No videos.*met all requirements/);
  assert.equal(f.get('collect-submit').disabled,true);assert.match(f.get('collect-cooldown').textContent,/60s/);
  await f.submit();assert.equal(f.calls.length,2);assert.equal(f.errors.length,0);
  f.advance(60);assert.equal(f.get('collect-submit').disabled,false);assert.equal(f.get('collect-cooldown').hidden,true);
 }finally{f.restore();}
});
test('verified results show statistics and remain available during the wait',async()=>{
 const f=await fixture();try {
  await f.submit();assert.equal(f.panel.videos()[0].views,100000);assert.equal(f.counts().metadataCalls,1);
  await f.submit();assert.equal(f.panel.videos().length,1);assert.equal(f.calls.length,2);
  await f.click('community-browse-library');assert.equal(f.calls.at(-1).action,'archive');assert.equal(f.get('collect-cooldown').hidden,true);
 }finally{f.restore();}
});
test('analysis and metadata failures never expose unverified raw progress',async()=>{
 for(const options of [{failMetadata:true},{fetcher:async body=>body.action==='discover'?apiResponse(progress(1,[candidate])):apiResponse({error:'classificationUnavailable'},400)}]) {
  const f=await fixture(options);try{await f.submit();assert.deepEqual(f.panel.videos(),[]);assert.equal(f.errors.length,1);}finally{f.restore();}
 }
});
test('a server cooldown after reload is shown locally without a global red error',async()=>{
 const f=await fixture({fetcher:async()=>apiResponse({version:1,error:'communityRateLimit',retryAfterSeconds:17},429)});try {
  await f.submit();assert.equal(f.errors.length,0);assert.equal(f.get('collect-submit').disabled,true);assert.match(f.get('collect-cooldown').textContent,/17s/);
  f.advance(17);assert.equal(f.get('collect-submit').disabled,false);
 }finally{f.restore();}
});
