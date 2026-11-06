import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCommunityVideos, communityQualitySettings } from '../public/services/community-quality.js';
import { CHANNEL } from './fixtures.js';
const evidence=(id='abcdefghijk',extra={})=>({id,score:1,recommenders:2,independentRecommenders:2,positiveComments:2,criticalComments:0,evidence:[],...extra});
const detail=(id='abcdefghijk',extra={})=>({id,snippet:{channelId:CHANNEL.id,title:'A useful lecture',channelTitle:'Fixture',defaultAudioLanguage:'en-US'},statistics:{viewCount:'200000',likeCount:'2000'},status:{privacyStatus:'public'},...extra});
test('live recommendations require multiple endorsers and matching verified popularity and language',async()=>{
 let calls=0;const client={request:async(resource,params)=>{calls++;assert.equal(resource,'videos');assert.match(params.part,/statistics/);return {items:[detail()]};}};
 assert.equal((await verifyCommunityVideos(client,[evidence()],{language:'en'})).videos.length,1);
 const weak=[evidence('abcdefghijk',{independentRecommenders:1}),evidence('lmnopqrstuv',{positiveComments:2,criticalComments:2})];
 assert.deepEqual((await verifyCommunityVideos(client,weak,{})).videos,[]);assert.equal(calls,1);
 for(const row of [detail('abcdefghijk',{statistics:{viewCount:'49',likeCount:'0'}}),detail('abcdefghijk',{statistics:{viewCount:'200000'}}),detail('abcdefghijk',{status:{privacyStatus:'private'}})]) {
   assert.deepEqual((await verifyCommunityVideos({request:async()=>({items:[row]})},[evidence()],{})).videos,[]);
 }
 assert.deepEqual((await verifyCommunityVideos(client,[evidence()],{language:'ar'})).videos,[]);
});
test('community ranking survives metadata ordering and cancellation never displays unverified candidates',async()=>{
 const rows=[evidence('abcdefghijk',{score:4}),evidence('lmnopqrstuv',{score:1})];
 const client={request:async()=>({items:[detail('lmnopqrstuv'),detail()]})};
 const result=await verifyCommunityVideos(client,rows,{});assert.deepEqual(result.videos.map(v=>v.id),rows.map(v=>v.id));assert.equal(result.videos[0].views,200000);
 let stop=false;const interrupted={request:async()=>{stop=true;return {items:[detail()]};}};
 assert.deepEqual((await verifyCommunityVideos(interrupted,rows,{},()=>stop)).videos,[]);
 await assert.rejects(verifyCommunityVideos({request:async()=>{throw new Error('offline');}},rows,{}));
});
test('quality settings refuse malformed limits and input is bounded before spending quota',async()=>{
 assert.equal(communityQualitySettings({}).minRecommenders,2);
 for(const value of [{minRecommenders:1},{minViews:-1},{minLikes:Infinity},{language:'invalid'}])assert.throws(()=>communityQualitySettings(value));
 let calls=0;const client={request:async()=>{calls++;return {items:[]};}};
 await assert.rejects(verifyCommunityVideos(client,Array.from({length:73},()=>evidence()),{}));assert.equal(calls,0);
});
