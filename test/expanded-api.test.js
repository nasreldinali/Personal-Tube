import test from 'node:test';
import assert from 'node:assert/strict';
import { validateApiConfiguration } from '../public/domain/analysis-providers.js';
import { createApiAnalysis } from '../server/api-analysis.js';
import { requestAnalysis } from '../server/analysis-request.js';
const rows=[{id:'one',videoIds:['abcdefghijk'],text:'Recommended explanation'}];
const result={version:1,items:[{key:'0:abcdefghijk',stance:'rec',quote:'Recommended explanation'}]};
test('expanded API services enforce consent, pinned destinations and grounded JSON without fallback',async()=>{
 const endpoints={gemini:'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',deepseek:'https://api.deepseek.com/chat/completions',mistral:'https://api.mistral.ai/v1/chat/completions',groq:'https://api.groq.com/openai/v1/chat/completions'};
 for(const [provider,endpoint] of Object.entries(endpoints)){
  const config={provider,model:'fixture-model',key:'fixture-key',acknowledgeCost:true};
  assert.throws(()=>validateApiConfiguration({...config,acknowledgeCost:false}),{code:'analysisCostRequired'});
  const requests=[];const api=createApiAnalysis({request:(id,input)=>requestAnalysis(id,input,async(url,options)=>{requests.push({url,options});return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));})});
  api.configure(config);assert.deepEqual(await api.classify(provider,rows),result);assert.equal(requests.length,1);assert.equal(requests[0].url,endpoint);assert.equal(requests[0].options.redirect,'error');assert.equal(requests[0].options.headers.Authorization,'Bearer fixture-key');
  const body=JSON.parse(requests[0].options.body);assert.equal(body.max_tokens,8192);assert.equal(body.tools,undefined);assert.equal(body.response_format.type,provider==='deepseek'?'json_object':'json_schema');assert.ok(!JSON.stringify(api.inspect(provider)).includes('fixture-key'));
 }
});
