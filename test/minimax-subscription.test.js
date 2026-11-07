import test from 'node:test';
import assert from 'node:assert/strict';
import { createMiniMaxSubscription } from '../server/minimax-subscription.js';
const row={id:'one',videoIds:['abcdefghijk'],text:'Recommended explanation',title:'Fixture'};
const classification={version:1,items:[{key:'0:abcdefghijk',stance:'rec',quote:'Recommended explanation'}]};
const answer=()=>({type:'message',stop_reason:'end_turn',content:[{type:'thinking',thinking:'discard this'},{type:'text',text:JSON.stringify(classification)}]});
test('MiniMax configuration stays in memory and requests only its fixed subscription model',async()=>{
 const calls=[],key='sk-cp-fixture-subscription';const adapter=createMiniMaxSubscription({request:async(...args)=>{calls.push(args);return answer();}});
 await assert.rejects(adapter.classify([row]),{code:'analysisConnectionRequired'});
 adapter.configure({provider:'minimax',key,confirmSubscription:true});assert.equal(calls.length,0);assert.equal(adapter.inspect().method,'subscription');assert.ok(!JSON.stringify(adapter.inspect()).includes(key));
 assert.deepEqual(await adapter.classify([row]),classification);assert.equal(calls.length,1);assert.equal(calls[0][0],'minimax');assert.equal(calls[0][1].headers.Authorization,`Bearer ${key}`);assert.equal(calls[0][1].body.model,'MiniMax-M3.1-Flash');assert.equal(calls[0][1].body.tools,undefined);assert.equal(calls[0][1].body.max_tokens,8192);assert.deepEqual(calls[0][1].body.output_config,{effort:'low'});assert.ok(!JSON.stringify(calls[0][1].body).includes(key));
 adapter.forget();assert.equal(adapter.inspect().connected,false);await assert.rejects(adapter.classify([row]),{code:'analysisConnectionRequired'});
});
test('MiniMax rejects unsafe output, oversized input and upstream failures without retries or fallback',async()=>{
 for(const output of [ {...answer(),stop_reason:'max_tokens'}, {...answer(),content:[{type:'tool_use',name:'fetch'}]}, {...answer(),content:[{type:'text',text:JSON.stringify({...classification,items:[{key:'0:abcdefghijk',stance:'rec',quote:'fabricated quote'}]})}]}, {type:'error',error:{message:'secret'}}]){
  let calls=0;const adapter=createMiniMaxSubscription({request:async()=>{calls++;return output;}});adapter.configure({provider:'minimax',key:'sk-cp-fixture',confirmSubscription:true});await assert.rejects(adapter.classify([row]),{code:'invalidClassification'});assert.equal(calls,1);
 }
 let calls=0;const adapter=createMiniMaxSubscription({request:async()=>{calls++;throw {code:'analysisRateLimit'};}});adapter.configure({provider:'minimax',key:'sk-cp-fixture',confirmSubscription:true});
 await assert.rejects(adapter.classify(Array(25).fill(row)),{code:'invalidCommunityEvidence'});assert.equal(calls,0);await assert.rejects(adapter.classify([row]),{code:'analysisRateLimit'});assert.equal(calls,1);
});
