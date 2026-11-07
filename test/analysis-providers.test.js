import test from 'node:test';
import assert from 'node:assert/strict';
import { validateApiConfiguration, apiProviderIds } from '../public/domain/analysis-providers.js';
test('API configuration requires an explicit provider, model, secret and cloud cost acknowledgement',()=>{
 const base={provider:'openai',model:'fixture-model',key:'fixture-key',acknowledgeCost:true};
 assert.equal(validateApiConfiguration(base).model,'fixture-model');
 for(const change of [{acknowledgeCost:false},{key:''},{key:'bad\nheader'},{model:''},{provider:'http://evil.test'},{endpoint:'https://evil.test'}])assert.throws(()=>validateApiConfiguration({...base,...change}));
 for(const provider of ['ollama','lmstudio'])assert.equal(validateApiConfiguration({...base,provider,key:'',acknowledgeCost:false}).key,'');
 assert.throws(()=>validateApiConfiguration({...base,provider:'ollama',key:''}));
 assert.throws(()=>validateApiConfiguration({...base,provider:'ollama',model:'fixture:cloud',key:'',acknowledgeCost:false}));
 assert.deepEqual(apiProviderIds,['openai','anthropic','openrouter','ollama','lmstudio']);
});
