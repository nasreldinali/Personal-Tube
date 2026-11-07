import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiAnalysis } from '../server/api-analysis.js';
const rows=[{id:'one',videoIds:['abcdefghijk'],text:'This tutorial explains recursion clearly. I recommend watching it.',title:'Fixture'}];
const result={version:1,items:[{key:'0:abcdefghijk',stance:'rec',quote:'This tutorial explains recursion clearly.'}]};
test('API adapter uses session-only configurations and validates evidence for every protocol',async()=>{
 const calls=[];
 const api=createApiAnalysis({request:async(provider,input)=>{calls.push({provider,...input});const text=JSON.stringify(result);return provider==='anthropic'?{stop_reason:'end_turn',content:[{type:'text',text}]}:provider==='ollama'?{done:true,done_reason:'stop',message:{content:text}}:{choices:[{finish_reason:'stop',message:{content:text}}]};}});
 for(const provider of ['openai','anthropic','openrouter','ollama','lmstudio']){
  const local=['ollama','lmstudio'].includes(provider);
  api.configure({provider,model:'fixture-model',key:local?'':'fixture-secret',acknowledgeCost:!local});
  assert.equal(api.inspect(provider).connected,true);assert.ok(!JSON.stringify(api.inspect(provider)).includes('fixture-secret'));
  assert.deepEqual(await api.classify(provider,rows,'youtube'),result);
  assert.equal(calls.at(-1).body.stream,false);
  api.forget(provider);assert.equal(api.inspect(provider).connected,false);
  await assert.rejects(api.classify(provider,rows),{code:'analysisConnectionRequired'});
 }
 assert.equal(calls.length,5);assert.equal(calls[0].body.max_completion_tokens,8192);
});
test('API adapter rejects fabricated quotes, truncated output and tool calls without retries',async()=>{
 let output={choices:[{finish_reason:'stop',message:{content:JSON.stringify({...result,items:[{...result.items[0],quote:'fabricated'}]})}}]};let calls=0;
 const api=createApiAnalysis({request:async()=>{calls++;return output;}});api.configure({provider:'openai',model:'fixture',key:'fixture',acknowledgeCost:true});
 await assert.rejects(api.classify('openai',rows),{code:'invalidClassification'});
 output={choices:[{finish_reason:'length',message:{content:JSON.stringify(result)}}]};await assert.rejects(api.classify('openai',rows));
 output={choices:[{finish_reason:'stop',message:{tool_calls:[{}],content:JSON.stringify(result)}}]};await assert.rejects(api.classify('openai',rows));assert.equal(calls,3);
});
