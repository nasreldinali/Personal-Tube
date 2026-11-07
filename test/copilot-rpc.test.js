import test from 'node:test';
import assert from 'node:assert/strict';
import { copilotTransportFixture as fixture } from './copilot-transport-fixture.js';
import { openCopilot } from '../server/copilot-rpc.js';
test('Copilot protocol handshake, fragmented frames, model schema and final answer work together',async()=>{
  const f=fixture();const client=await openCopilot({executable:'copilot',env:{},cwd:'/scratch',launch:f.launch});
  try{assert.deepEqual(await client.analyze('untrusted comments'),{version:1,items:[]});assert.equal(f.messages.find(x=>x.method==='session.send').params.responseFormat.jsonSchema.strict,true);assert.deepEqual(f.messages.find(x=>x.method==='session.create').params.availableTools,[]);}
  finally{client.close();}assert.equal(f.child.stopped,true);
});
test('Copilot refuses protocol mismatch and unsigned users before any model request',async()=>{
  const mismatch=fixture({protocol:2});await assert.rejects(openCopilot({launch:mismatch.launch}),{code:'classifierVersion'});assert.equal(mismatch.child.stopped,true);
  const unsigned=fixture({authenticated:false});const client=await openCopilot({launch:unsigned.launch});try{await assert.rejects(client.analyze('secret'),{code:'analysisConnectionRequired'});assert.equal(unsigned.messages.length,2);}finally{client.close();}
});
test('Copilot denies server capabilities and refuses malformed, tool, oversized, timed out and failed responses',async()=>{
  for(const reply of ['request','tool','error','large','malformed','json','hang']){
    const f=fixture({reply}),timers=new Map();let timerId=0;
    const client=await openCopilot({launch:f.launch,cwd:'/scratch',setTimer:callback=>{timers.set(++timerId,callback);return timerId;},clearTimer:id=>timers.delete(id)});
    try{
      if(reply==='request'){await client.analyze('comments');assert.equal(f.answers[0].error.code,-32601);}
      else {
        const rejected=assert.rejects(client.analyze('comments'),{code:reply==='json'?'invalidClassification':'classificationUnavailable'});
        await new Promise(resolve=>setImmediate(resolve));
        if(reply==='hang')timers.get(1)();
        try{assert.equal(f.child.stopped,true,reply);}finally{if(!f.child.stopped)client.close();await rejected;}
      }
    }finally{client.close();}assert.equal(f.child.stopped,true);
  }
});
