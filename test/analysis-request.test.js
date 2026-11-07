import test from 'node:test';
import assert from 'node:assert/strict';
import { requestAnalysis } from '../server/analysis-request.js';
test('analysis transport pins destinations, refuses redirects and never echoes upstream secrets',async()=>{
 let url,options;
 const fetcher=async(u,o)=>{url=u;options=o;return new Response('{"ok":true}');};
 assert.deepEqual(await requestAnalysis('openai',{headers:{Authorization:'Bearer fixture'},body:{model:'fixture'}},fetcher),{ok:true});
 assert.equal(url,'https://api.openai.com/v1/chat/completions');assert.equal(options.redirect,'error');assert.equal(options.method,'POST');
 await assert.rejects(requestAnalysis('https://evil.test',{body:{}},fetcher),{code:'invalidSetup'});
 for(const status of [301,401,403,429,500])await assert.rejects(requestAnalysis('openai',{body:{}},async()=>new Response('secret fixture',{status})),error=>!error.message.includes('secret fixture'));
 await requestAnalysis('minimax',{body:{}},fetcher);assert.equal(url,'https://api.minimax.io/anthropic/v1/messages');assert.equal(options.redirect,'error');
 await requestAnalysis('ollama',{body:{}},fetcher);assert.equal(url,'http://127.0.0.1:11434/api/chat');
});
test('analysis transport caps response bytes and stops a stalled response body',async()=>{
 await assert.rejects(requestAnalysis('openai',{body:{}},async()=>new Response(JSON.stringify({payload:'x'.repeat(1000001)}))),{code:'analysisUnavailable'});
 const controller=new AbortController();
 const stalled=new ReadableStream({start(){},cancel(){}});
 const pending=requestAnalysis('openai',{body:{},signal:controller.signal},async()=>new Response(stalled));
 controller.abort();await assert.rejects(pending,{code:'analysisUnavailable'});
});
test('local discovery is GET-only on pinned loopback URLs and refuses arbitrary methods and destinations',async()=>{
 const calls=[];const fetcher=async(url,options)=>{calls.push({url,options});return new Response('{"data":[]}');};
 await requestAnalysis('local-openai',{method:'GET',port:8090},fetcher);assert.equal(calls[0].url,'http://127.0.0.1:8090/v1/models');assert.equal(calls[0].options.method,'GET');assert.equal(calls[0].options.redirect,'error');
 for(const [provider,input] of [['openai',{method:'GET'}],['local-openai',{port:80}],['local-openai',{port:8080,method:'DELETE'}],['ollama',{method:'GET',port:8080}]])await assert.rejects(requestAnalysis(provider,input,fetcher),{code:'invalidSetup'});
 assert.equal(calls.length,1);
});
