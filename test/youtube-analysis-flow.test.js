import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createHandler } from '../server/http-app.js';
import { createYouTubeAnalysis } from '../server/youtube-analysis.js';
import { recommendVideos } from '../public/services/recommendations.js';
import { parseRecommendationSettings } from '../public/domain/recommendations.js';
import { VIDEO, CHANNEL } from './fixtures.js';

test('search automatically classifies comments and only displays evidence-backed positives', async () => {
  const client={request:async resource=> resource==='search'?{items:[{id:{videoId:VIDEO.id}}]}:resource==='videos'?{items:[{id:VIDEO.id,snippet:{title:'Fixture',description:'Introduction to token prediction',channelId:CHANNEL.id},status:{privacyStatus:'public'},statistics:{viewCount:'200000',likeCount:'2000'}}]}:{items:['Useful explanation, I recommend it','This taught me a lot, watch it','Buy my unrelated course'].map((text,i)=>({snippet:{topLevelComment:{id:`c${i}`,snippet:{textOriginal:text,likeCount:1}}}}))}};
  let calls=0;
  const analyze=createYouTubeAnalysis({classify:async rows=>{calls++; assert.equal(rows[0].topic,'Fixture'); assert.match(rows[0].title,/token prediction/); return {version:1,items:rows.map((r,i)=>({key:`${i}:${VIDEO.id}`,stance:i===2?'reference':'rec',quote:i===2?'':r.text}))};},now:()=>1000});
  const result=await recommendVideos(client,{...parseRecommendationSettings(null),query:'Fixture',includeComments:false},analyze);
  assert.equal(calls,1); assert.equal(result.videos.length,1);
  assert.equal(result.videos[0].evidence.positive,2);
  assert.equal(result.analyzedComments,3);
  await assert.rejects(recommendVideos(client,{...parseRecommendationSettings(null),query:'Fixture'},async()=>{throw new Error('offline');}));
});

test('YouTube analysis route requires exact same-origin JSON and refuses oversized or foreign requests', async () => {
  let calls=0;
  const handler=createHandler({youtubeAnalysis:async()=>{calls++;return {version:1,items:[]};}});
  const good={host:'127.0.0.1:4173',origin:'http://127.0.0.1:4173','content-type':'application/json'};
  async function request(headers,body='{}',method='POST') {
    const req=Object.assign(Readable.from([body]),{url:'/api/youtube-analysis',headers,method});
    let status; await handler(req,{writeHead:s=>{status=s;},end:()=>{}});return status;
  }
  for(const headers of [{...good,origin:'https://evil.test'},{...good,origin:undefined},{...good,host:'evil.test'},{...good,'sec-fetch-site':'cross-site'},{...good,'content-type':'text/plain'}]) assert.equal(await request(headers),403);
  assert.equal(await request(good,'x'.repeat(600001)),413);
  assert.equal(await request(good,'{}','GET'),405);
  assert.equal(calls,0);
  assert.equal(await request(good),200); assert.equal(calls,1);
});

test('search relevance selects the bounded shortlist before popularity sorts qualified results', async () => {
  const ids=Array.from({length:10},(_,i)=>`sportskill${i}`);
  const rows=ids.map((id,i)=>({id,snippet:{title:`Shooting lesson ${i}`,channelId:CHANNEL.id,defaultAudioLanguage:'ar'},status:{privacyStatus:'public'},statistics:{viewCount:String(i===0?1:100000+i*10000),likeCount:String(3000-i*100)}}));
  for(const sort of ['views','likes']) {
    const requested=[];
    const client={request:async(resource,params)=>{
      if(resource==='search')return {items:ids.map(videoId=>({id:{videoId}}))};
      if(resource==='videos')return {items:[...rows].reverse()};
      requested.push(params.videoId);
      assert.equal(params.maxResults,'100');
      return {items:[0,1].map(i=>({snippet:{topLevelComment:{id:`c${i}`,snippet:{textOriginal:`Practicing the foot placement made my shots more accurate ${i}`,likeCount:1}}}}))};
    }};
    let calls=0;
    const analyze=createYouTubeAnalysis({classify:async inputs=>{
      calls++;
      return {version:1,items:inputs.map((row,i)=>({key:`${i}:${row.videoIds[0]}`,stance:'rec',quote:row.text}))};
    },now:()=>1000});
    const result=await recommendVideos(client,{...parseRecommendationSettings(null),query:'تعلم تسديد كرة القدم للمبتدئين',language:'ar',sort},analyze);
    assert.deepEqual(requested,ids.slice(1,9));
    assert.equal(calls,1);
    assert.equal(result.reviewed,8);
    assert.equal(result.analyzedComments,16);
    assert.deepEqual(result.videos.map(v=>v.id),sort==='views'?ids.slice(1,9).reverse():ids.slice(1,9));
  }
});

test('supported recommendations precede more popular limited candidates without another analysis call', async () => {
  const ids=['supported01','limited0001'];
  let calls=0;
  const client={request:async(resource)=>({items:resource==='search'?ids.map(videoId=>({id:{videoId}})):resource==='videos'?ids.map((id,i)=>({id,snippet:{title:'Shooting tutorial',channelId:CHANNEL.id},status:{privacyStatus:'public'},statistics:{viewCount:String(200000+i*1000000),likeCount:'2000'}})):[0,1].map(i=>({snippet:{topLevelComment:{id:`c${i}`,snippet:{textOriginal:`The foot placement lesson improved my shot accuracy ${i}`,likeCount:1}}}}))})};
  const result=await recommendVideos(client,{...parseRecommendationSettings(null),query:'shooting'},async input=>{
    calls++;
    return {version:1,items:input.videos.flatMap((v,i)=>v.comments.map((c,j)=>({key:`${i*2+j}:${v.id}`,stance:i===1&&j===1?'reference':'rec',quote:i===1&&j===1?'':c.text})))};
  });
  assert.equal(calls,1);
  assert.deepEqual(result.videos.map(v=>[v.id,v.evidence.support]),[['supported01','supported'],['limited0001','limited']]);
});
