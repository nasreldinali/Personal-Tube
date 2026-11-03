import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createHandler } from '../server/http-app.js';
import { createYouTubeAnalysis } from '../server/youtube-analysis.js';
import { recommendVideos } from '../public/services/recommendations.js';
import { parseRecommendationSettings } from '../public/domain/recommendations.js';
import { VIDEO, CHANNEL } from './fixtures.js';

test('search automatically classifies comments and only displays evidence-backed positives', async () => {
  const client={request:async resource=> resource==='search'?{items:[{id:{videoId:VIDEO.id}}]}:resource==='videos'?{items:[{id:VIDEO.id,snippet:{title:'Fixture',channelId:CHANNEL.id},status:{privacyStatus:'public'},statistics:{viewCount:'200000',likeCount:'2000'}}]}:{items:['Useful explanation, I recommend it','This taught me a lot, watch it','Buy my unrelated course'].map((text,i)=>({snippet:{topLevelComment:{id:`c${i}`,snippet:{textOriginal:text,likeCount:1}}}}))}};
  let calls=0;
  const analyze=createYouTubeAnalysis({classify:async rows=>{calls++; return {version:1,items:rows.map((r,i)=>({key:`${i}:${VIDEO.id}`,stance:i===2?'reference':'rec',quote:i===2?'':r.text}))};},now:()=>1000});
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
