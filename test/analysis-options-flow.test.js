import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../server/http-app.js';
import { createProviderManager } from '../server/provider-manager.js';
import { createApiAnalysis } from '../server/api-analysis.js';
import { createYouTubeAnalysis } from '../server/youtube-analysis.js';
test('same-origin API setup to YouTube comment analysis preserves consent, credentials and confirmed removal',async()=>{
 const requests=[];
 const api=createApiAnalysis({request:async(provider,request)=>{requests.push({provider,...request});return {choices:[{finish_reason:'stop',message:{content:JSON.stringify({version:1,items:[{key:'0:abcdefghijk',stance:'rec',quote:'Recommended explanation'}]})}}]};}});
 const manager=createProviderManager({inspect:async()=>({installed:false,supported:false,connected:false}),login:async()=>{},classifiers:{},api,now:()=>100000});
 const handler=createHandler({setup:manager.control,youtubeAnalysis:createYouTubeAnalysis({classify:manager.classify,now:()=>100000})});
 async function post(path,body,origin='http://127.0.0.1:4173') {
  let status,reply;const request={url:path,method:'POST',headers:{host:'127.0.0.1:4173',origin,'content-type':'application/json'},async *[Symbol.asyncIterator](){yield Buffer.from(JSON.stringify(body));}};
  await handler(request,{writeHead:s=>{status=s;},end:body=>{reply=JSON.parse(body);}});return {status,reply};
 }
 const config={version:1,action:'configure',provider:'openai',configuration:{provider:'openai',model:'fixture',key:'test-only-not-a-real-secret',acknowledgeCost:false}};
 assert.equal((await post('/api/setup',config)).reply.error,'analysisCostRequired');assert.equal(requests.length,0);
 config.configuration.acknowledgeCost=true;
 assert.equal((await post('/api/setup',config,'https://foreign.test')).status,403);assert.equal(requests.length,0);
 const connected=await post('/api/setup',config);assert.equal(connected.status,200);assert.ok(!JSON.stringify(connected).includes(config.configuration.key));assert.equal(requests.length,0);
 const answer=await post('/api/youtube-analysis',{version:1,videos:[{id:'abcdefghijk',title:'Fixture',comments:[{id:'one',text:'Recommended explanation',likes:1}]}]});
 assert.equal(answer.status,200);assert.equal(requests.length,1);assert.equal(requests[0].headers.Authorization,`Bearer ${config.configuration.key}`);assert.ok(!JSON.stringify(requests[0].body).includes(config.configuration.key));
 const refused=await post('/api/setup',{version:1,action:'forget',provider:'openai'});assert.equal(refused.status,400);
 const forgotten=await post('/api/setup',{version:1,action:'forget',provider:'openai',confirm:true});assert.equal(forgotten.reply.providers.openai.connected,false);assert.equal(forgotten.reply.selected,'openai');
});
