import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createProviderProcesses, providerEnvironment } from '../server/provider-process.js';
test('provider probes return only availability and subscription method, strip API secrets from child environment',async()=>{
 const env=providerEnvironment({PATH:'fixture',HOME:'/fixture',OPENAI_API_KEY:'secret',ANTHROPIC_API_KEY:'secret'});assert.deepEqual(env,{PATH:'fixture',HOME:'/fixture'});
 const processes=createProviderProcesses({environment:{},run:async(file,args)=>({stdout:args[0]==='--version'?(file==='codex'?'codex-cli 0.155.1':'2.1.281 (Claude Code)'):file==='codex'?'':JSON.stringify({loggedIn:true,authMethod:'claude.ai',email:'private@example.test'}),stderr:file==='codex'&&args.includes('login')?'Logged in using ChatGPT':''})});
 assert.deepEqual(await processes.inspect('claude'),{installed:true,supported:true,connected:true,method:'subscription'});assert.equal((await processes.inspect('codex')).connected,true);
 await assert.rejects(processes.inspect('../shell'));
});
test('login has fixed arguments, no shell, discarded output and explicit subscription selection',async()=>{
 const processes=createProviderProcesses({environment:{},launch:(file,args,options)=>{
  assert.equal(file,'claude');assert.deepEqual(args,['auth','login','--claudeai']);assert.equal(options.shell,false);assert.equal(options.stdio,'ignore');
  const child=new EventEmitter();queueMicrotask(()=>child.emit('close',0));return child;
 }});await processes.login('claude');await assert.rejects(processes.login('bash'));
});
test('missing binaries and API-only auth do not claim a subscription connection',async()=>{
 const missing=createProviderProcesses({run:async()=>{throw new Error('fixture');}});assert.equal((await missing.inspect('claude')).installed,false);
 const other=createProviderProcesses({run:async(_,args)=>({stdout:args[0]==='--version'?'2.1.281 (Claude Code)':'{"loggedIn":true,"authMethod":"api_key"}',stderr:''})});assert.equal((await other.inspect('claude')).connected,false);
});

test('Codex login/status explicitly share the classifier credential store',async()=>{
 const p=createProviderProcesses({environment:{},run:async(file,args)=>{if(args[0]==='--version')return {stdout:'codex-cli 0.155.1',stderr:''};assert.deepEqual(args,['-c','cli_auth_credentials_store="file"','login','status']);return {stdout:'',stderr:'Logged in using ChatGPT'};},launch:(file,args)=>{assert.deepEqual(args,['-c','cli_auth_credentials_store="file"','login']);const child=new EventEmitter();queueMicrotask(()=>child.emit('close',0));return child;}});
 assert.equal((await p.inspect('codex')).connected,true);await p.login('codex');
});

test('fresh, incompatible and failed-login installations never look connected',async()=>{
 for(const provider of ['codex','claude']) {
  let probes=0;
  const incompatible=createProviderProcesses({run:async()=>{probes++;return {stdout:'unreviewed version',stderr:''};}});
  assert.deepEqual(await incompatible.inspect(provider),{installed:true,supported:false,connected:false,method:'none'});assert.equal(probes,1);
  const signedOut=createProviderProcesses({run:async(file,args)=>{
   if(args[0]==='--version')return {stdout:file==='codex'?'codex-cli 0.155.1':'2.1.281 (Claude Code)',stderr:''};
   if(file==='codex')throw new Error('Not logged in');
   return {stdout:'{"loggedIn":false}',stderr:''};
  }});
  assert.deepEqual(await signedOut.inspect(provider),{installed:true,supported:true,connected:false,method:'none'});
  for(const event of ['error','close']) {
   const failed=createProviderProcesses({launch:()=>{const child=new EventEmitter();queueMicrotask(()=>child.emit(event,event==='error'?new Error('fixture'):1));return child;}});
   await assert.rejects(failed.login(provider),{code:'connectionFailed'});
  }
 }
});

test('logout uses the same credential store and fixed official commands without a shell',async()=>{
 const calls=[];const p=createProviderProcesses({environment:{},run:async(file,args,options)=>{calls.push({file,args,options});return {stdout:'',stderr:''};}});
 await p.logout('codex');await p.logout('claude');
 assert.deepEqual(calls.map(c=>c.args),[['-c','cli_auth_credentials_store="file"','logout'],['auth','logout']]);
 assert.ok(calls.every(c=>c.options.timeout===10000&&c.options.maxBuffer===16000));
 await assert.rejects(p.logout('other'),{code:'invalidSetup'});
 const failing=createProviderProcesses({run:async()=>{throw Error('private details');}});await assert.rejects(failing.logout('claude'),{code:'connectionFailed'});
});
