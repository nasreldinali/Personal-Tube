import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { copilotEnvironment, supportedCopilotVersion, subscriptionAuth } from './copilot-policy.js';
import { openCopilot } from './copilot-rpc.js';
import { classificationPrompt } from './classification-prompt.js';
import { classificationInputs, applyClassifications } from '../public/domain/community-evidence.js';
import { AppError } from '../public/domain/errors.js';

async function temporaryDirectory(){const path=await mkdtemp(join(tmpdir(),'personaltube-copilot-'));return {path,dispose:()=>rm(path,{recursive:true,force:true})};}
export function createCopilotSubscription({executable='copilot',profile=resolve('.local/copilot'),environment=process.env,run=promisify(execFile),open=openCopilot,scratch=temporaryDirectory,ensureProfile=directory=>mkdir(directory,{recursive:true,mode:0o700})}={}) {
  const env=copilotEnvironment(environment,profile);
  async function version(){
    try{const result=await run(executable,['--no-auto-update','--version'],{env,cwd:tmpdir(),timeout:5000,maxBuffer:16000});return {installed:true,supported:result.stdout.trim().split('\n')[0]===supportedCopilotVersion};}
    catch{return {installed:false,supported:false};}
  }
  async function withClient(action){
    const state=await version();if(!state.supported)throw new AppError(state.installed?'classifierVersion':'providerMissing');
    const directory=await scratch();let client;
    try{client=await open({executable,env,cwd:directory.path});return await action(client);}
    finally{client?.close();await directory.dispose();}
  }
  return {
    async inspect(){
      const state=await version();let connected=false,method='none';
      if(state.supported)try{await withClient(async client=>{connected=subscriptionAuth(client.auth);method=connected?'subscription':client.auth?.isAuthenticated?'other':'none';});}catch{method='none';}
      return {...state,connected,method};
    },
    async login(){
      const state=await version();if(!state.supported)throw new AppError(state.installed?'classifierVersion':'providerMissing');
      await ensureProfile(profile);
      try{await run(executable,['--no-auto-update','--disable-client-telemetry','login','--web-flow','--host','https://github.com'],{env,cwd:tmpdir(),timeout:180000,maxBuffer:32000});}
      catch{throw new AppError('connectionFailed');}
    },
    async classify(rows,mode='community'){
      const inputs=classificationInputs(rows);
      if(!['community','youtube'].includes(mode)||!inputs.length||inputs.length>(mode==='youtube'?160:24)||JSON.stringify(inputs).length>(mode==='youtube'?250000:40000))throw new AppError('invalidCommunityEvidence');
      return withClient(async client=>{
        if(!subscriptionAuth(client.auth))throw new AppError('analysisConnectionRequired');
        const result=await client.analyze(classificationPrompt(inputs,mode));applyClassifications(rows,result);return result;
      });
    },
  };
}
