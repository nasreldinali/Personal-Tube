import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { handleCommunityRequest } from '../server/community-route.js';

test('community actions require same-origin JSON POST and bounded bodies', async () => {
  let calls=0;
  const controller=async () => { calls++; return {version:1,videos:[]}; };
  const request = (headers,body='{}',method='POST') => Object.assign(Readable.from([body]), {headers,method});
  const good = {host:'127.0.0.1:4173',origin:'http://127.0.0.1:4173','content-type':'application/json'};
  for(const req of [request({...good,origin:'https://evil.test'}),request({...good,origin:undefined}),request({...good,'content-type':'text/plain'}),request(good,'x'.repeat(6001)),request(good,'{}','GET')]) {
    const response=await handleCommunityRequest(req,controller);
    assert.notEqual(response.status,200);
  }
  assert.equal(calls,0);
  assert.equal((await handleCommunityRequest(request(good),controller)).status,200);
  assert.equal(calls,1);
});

test('rate-limit response exposes only bounded retry seconds, never internal errors',async()=>{
 const {AppError}=await import('../public/domain/errors.js');
 const request=()=>Object.assign(Readable.from(['{}']),{method:'POST',headers:{host:'127.0.0.1:4173',origin:'http://127.0.0.1:4173','content-type':'application/json'}});
 const result=await handleCommunityRequest(request(),async()=>{const error=new AppError('communityRateLimit');error.retryAfterSeconds=17;error.secret='fixture-secret';throw error;});
 assert.deepEqual(result,{status:429,body:{version:1,error:'communityRateLimit',retryAfterSeconds:17}});
 for(const seconds of [-1,Infinity,'secret',100000]) {
   const result=await handleCommunityRequest(request(),async()=>{const error=new AppError('communityRateLimit');error.retryAfterSeconds=seconds;throw error;});
   assert.equal(result.body.retryAfterSeconds,undefined);
 }
});
