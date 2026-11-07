import test from 'node:test';
import assert from 'node:assert/strict';
import { createCopilotSubscription } from '../server/copilot-subscription.js';
import { classificationInputs } from '../public/domain/community-evidence.js';
const row={id:'fixture',videoIds:['abcdefghijk'],text:'A useful explanation',title:''};
const version={stdout:'GitHub Copilot CLI 1.0.107.\nRun copilot update to check for updates.'};
const auth={isAuthenticated:true,authType:'user',host:'https://github.com'};
test('Copilot checks version and subscription before sending any comments; validates output evidence',async()=>{
  let authentication=auth;let sent=0;
  const result={version:1,items:classificationInputs([row]).map(x=>({key:x.key,stance:'rec',quote:'A useful explanation'}))};
  const adapter=createCopilotSubscription({profile:'/tmp/fixture-copilot',run:async()=>version,open:async()=>({auth:authentication,analyze:async()=>{sent++;return result;},close(){}}),scratch:async()=>({path:'/tmp/fixture',dispose:async()=>{}})});
  assert.equal((await adapter.inspect()).connected,true);assert.deepEqual(await adapter.classify([row]),result);
  authentication={...auth,authType:'api-key'};await assert.rejects(adapter.classify([row]),{code:'analysisConnectionRequired'});assert.equal(sent,1);
  authentication=auth;result.items[0].quote='invented quote';await assert.rejects(adapter.classify([row]),{code:'invalidClassification'});
});
test('Copilot unsupported versions and absent CLI never start protocol or login',async()=>{
  let opens=0;
  const adapter=createCopilotSubscription({profile:'/tmp/fixture-copilot',run:async()=>({stdout:'GitHub Copilot CLI 9.0.0.'}),open:async()=>{opens++;}});
  assert.deepEqual(await adapter.inspect(),{installed:true,supported:false,connected:false,method:'none'});
  await assert.rejects(adapter.login(),{code:'classifierVersion'});assert.equal(opens,0);
  const missing=createCopilotSubscription({run:async()=>{throw Error('missing');}});assert.equal((await missing.inspect()).installed,false);
});
test('Copilot login uses a fixed official browser flow, dedicated profile and bounded secret-free process',async()=>{
  const calls=[],directories=[];
  const adapter=createCopilotSubscription({profile:'/fixture/profile',environment:{PATH:'/bin',OPENAI_API_KEY:'private',GH_TOKEN:'private'},ensureProfile:async path=>directories.push(path),run:async(file,args,options)=>{calls.push({file,args,options});return version;}});
  await adapter.login();assert.deepEqual(directories,['/fixture/profile']);
  assert.deepEqual(calls[1].args,['--no-auto-update','--disable-client-telemetry','login','--web-flow','--host','https://github.com']);
  assert.equal(calls[1].file,'copilot');assert.equal(calls[1].options.timeout,180000);assert.equal(calls[1].options.maxBuffer,32000);
  assert.deepEqual(calls[1].options.env,{PATH:'/bin',COPILOT_HOME:'/fixture/profile'});
});
