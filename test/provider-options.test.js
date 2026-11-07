import test from 'node:test';
import assert from 'node:assert/strict';
import { createProviderManager } from '../server/provider-manager.js';
import { createApiAnalysis } from '../server/api-analysis.js';
const rows=[{id:'one',videoIds:['abcdefghijk'],text:'Recommended explanation',title:'Fixture'}];
const result={version:1,items:[{key:'0:abcdefghijk',stance:'rec',quote:'Recommended explanation'}]};
test('logout requires confirmation and selection never silently falls back to another account',async()=>{
 let connected=true,logouts=0;
 const manager=createProviderManager({inspect:async()=>({installed:true,supported:true,connected,method:'subscription'}),login:async()=>{},logout:async()=>{logouts++;connected=false;},classifiers:{codex:async()=>result},now:()=>100000});
 await assert.rejects(manager.control({version:1,action:'logout',provider:'codex'}),{code:'invalidSetup'});
 const state=await manager.control({version:1,action:'logout',provider:'codex',confirm:true});assert.equal(logouts,1);assert.equal(state.providers.codex.connected,false);assert.equal(state.selected,'codex');
 await assert.rejects(manager.classify(rows),{code:'analysisConnectionRequired'});
});
test('API configuration, explicit test, usage and removal use the selected provider',async()=>{
 let calls=0;const api=createApiAnalysis({request:async()=>{calls++;return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]};}});
 const manager=createProviderManager({inspect:async()=>({installed:false,supported:false,connected:false}),login:async()=>{},logout:async()=>{},classifiers:{},api,now:()=>100000});
 const configuration={provider:'openai',model:'fixture',key:'fixture-secret',acknowledgeCost:true};
 const configured=await manager.control({version:1,action:'configure',provider:'openai',configuration});assert.equal(configured.selected,'openai');assert.equal(calls,0);assert.ok(!JSON.stringify(configured).includes('fixture-secret'));
 await manager.classify(rows);assert.equal(calls,1);
 const state=await manager.control({version:1,action:'forget',provider:'openai',confirm:true});assert.equal(state.selected,'openai');assert.equal(state.providers.openai.connected,false);
 await assert.rejects(manager.classify(rows),{code:'analysisConnectionRequired'});
});

test('test calls require consent, count usage, enforce cooldown and reconfiguration clears tested status',async()=>{
 const api=createApiAnalysis({request:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]})});
 const manager=createProviderManager({inspect:async()=>({installed:false,supported:false,connected:false}),login:async()=>{},classifiers:{},api,now:()=>100000});
 const config={version:1,action:'configure',provider:'openai',configuration:{provider:'openai',model:'fixture',key:'fixture',acknowledgeCost:true}};
 await manager.control(config);
 await assert.rejects(manager.control({version:1,action:'test',provider:'openai'}),{code:'invalidSetup'});
 const tested=await manager.control({version:1,action:'test',provider:'openai',confirm:true});assert.equal(tested.providers.openai.tested,true);assert.equal(tested.usage.openai.completed,1);
 await assert.rejects(manager.control({version:1,action:'test',provider:'openai',confirm:true}),{code:'connectionCooldown'});
 const changed=await manager.control({...config,configuration:{...config.configuration,model:'another'}});assert.equal(changed.providers.openai.tested,false);assert.equal(changed.usage.openai.completed,1);
});
test('analysis and pending login prevent credential mutation and switching from any tab',async()=>{
 let resolveRequest;
 const api=createApiAnalysis({request:()=>new Promise(resolve=>{resolveRequest=resolve;})});
 const manager=createProviderManager({inspect:async()=>({installed:true,supported:true,connected:false}),login:()=>new Promise(()=>{}),logout:async()=>{throw Error('must not log out');},classifiers:{},api,now:()=>100000});
 const config={version:1,action:'configure',provider:'openai',configuration:{provider:'openai',model:'fixture',key:'fixture',acknowledgeCost:true}};
 await manager.control(config);const running=manager.classify(rows);await new Promise(resolve=>setImmediate(resolve));
 for(const input of [config,{version:1,action:'logout',provider:'codex',confirm:true},{version:1,action:'forget',provider:'openai',confirm:true},{version:1,action:'select',provider:'claude'}])await assert.rejects(manager.control(input),{code:'busy'});
 resolveRequest({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]});await running;
 await manager.control({version:1,action:'connect',provider:'codex'});
 await assert.rejects(manager.control(config),{code:'busy'});
});

test('subscription sample tests require confirmation and selection, stay subscription-only and enforce cooldown',async()=>{
 const calls=[];const manager=createProviderManager({inspect:async()=>({installed:true,supported:true,connected:true,method:'subscription'}),login:async()=>{},logout:async()=>{throw Error('must not logout');},classifiers:{codex:async()=>{calls.push('codex');return result;},claude:async()=>{calls.push('claude');return result;}},now:()=>100000});
 await assert.rejects(manager.control({version:1,action:'test',provider:'codex'}),{code:'invalidSetup'});
 await assert.rejects(manager.control({version:1,action:'test',provider:'claude',confirm:true}),{code:'invalidSetup'});
 const first=await manager.control({version:1,action:'test',provider:'codex',confirm:true});assert.equal(first.providers.codex.tested,true);assert.equal(first.usage.codex.completed,1);
 await assert.rejects(manager.control({version:1,action:'test',provider:'codex',confirm:true}),{code:'connectionCooldown'});
 await manager.control({version:1,action:'select',provider:'claude'});
 const second=await manager.control({version:1,action:'test',provider:'claude',confirm:true});assert.equal(second.providers.claude.tested,true);assert.deepEqual(calls,['codex','claude']);
 const wrongAuth=createProviderManager({inspect:async()=>({installed:true,supported:true,connected:true,method:'other'}),classifiers:{codex:async()=>{throw Error('must not run');}},now:()=>100000});
 await assert.rejects(wrongAuth.control({version:1,action:'test',provider:'codex',confirm:true}),{code:'analysisConnectionRequired'});
});
