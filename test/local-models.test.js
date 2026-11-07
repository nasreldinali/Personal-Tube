import test from 'node:test';
import assert from 'node:assert/strict';
import { localModelEndpoint, normalizeLocalModels } from '../public/domain/local-models.js';
import { createLocalModels } from '../server/local-models.js';
import { validateApiConfiguration } from '../public/domain/analysis-providers.js';
test('local compatible endpoints accept only bounded loopback ports and safe model identifiers',()=>{
 assert.equal(localModelEndpoint('local-openai',8080),'http://127.0.0.1:8080/v1/models');
 for(const port of [0,22,1023,65536,8080.5,'8080','https://remote.test'])assert.throws(()=>localModelEndpoint('local-openai',port),{code:'invalidSetup'});
 assert.throws(()=>localModelEndpoint('openai',8080),{code:'invalidSetup'});
 const config={provider:'local-openai',model:'small-model',key:'',acknowledgeCost:false,port:8080};assert.equal(validateApiConfiguration(config).port,8080);
 assert.throws(()=>validateApiConfiguration({...config,endpoint:'https://remote.test'}),{code:'invalidSetup'});
 assert.deepEqual(normalizeLocalModels('ollama',{models:[{name:'gemma4:e4b'},{name:'gemma4:e4b'},{name:'bad<script>'},{name:'qwen:cloud'}]}),['gemma4:e4b']);
 assert.deepEqual(normalizeLocalModels('lmstudio',{data:[{id:'small-model'}]}),['small-model']);
 assert.throws(()=>normalizeLocalModels('lmstudio',{data:Array(501).fill({id:'x'})}),{code:'invalidSetup'});
});
test('model discovery lists only an explicit local service and makes no generation request',async()=>{
 const calls=[];const list=createLocalModels({request:async(...args)=>{calls.push(args);return {data:[{id:'fixture-model'}]};}});
 assert.deepEqual(await list('local-openai',8080),['fixture-model']);assert.equal(calls.length,1);assert.equal(calls[0][1].method,'GET');assert.equal(calls[0][1].port,8080);
 await assert.rejects(list('openai'),{code:'invalidSetup'});assert.equal(calls.length,1);
});
