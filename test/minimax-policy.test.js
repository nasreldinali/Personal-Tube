import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMiniMaxSubscription, minimaxModel } from '../public/domain/minimax-subscription.js';
test('MiniMax accepts only explicit subscription credentials and a fixed included model',()=>{
 const good={provider:'minimax',key:'sk-cp-fixture-subscription',confirmSubscription:true};
 assert.equal(validateMiniMaxSubscription(good).key,good.key);assert.equal(minimaxModel,'MiniMax-M3.1-Flash');
 for(const change of [{key:'sk-ordinary-payg'},{key:''},{key:'sk-cp-\nunsafe'},{key:'sk-cp-'},{key:'sk-cp-'+ 'x'.repeat(2048)},{confirmSubscription:false},{provider:'openai'},{model:'another-model'},{url:'https://foreign.test'}])assert.throws(()=>validateMiniMaxSubscription({...good,...change}));
});
