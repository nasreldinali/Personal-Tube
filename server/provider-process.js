import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { supportedCodexVersion } from './classifier-policy.js';
import { supportedClaudeVersion } from './claude-policy.js';
import { AppError } from '../public/domain/errors.js';
const exec=promisify(execFile);
export function providerEnvironment(environment=process.env) {
  return Object.fromEntries(['PATH','HOME','USER','TMPDIR','CODEX_HOME'].filter(key=>environment[key]).map(key=>[key,environment[key]]));
}
export function createProviderProcesses({environment=process.env,run=exec,launch=spawn}={}) {
  const env=providerEnvironment(environment);
  const executable=provider=>{if(!['codex','claude'].includes(provider))throw new AppError('invalidSetup');return provider;};
  return {
    async inspect(provider) {
      const file=executable(provider);
      let version;
      try{version=(await run(file,['--version'],{env,cwd:tmpdir(),timeout:5000,maxBuffer:16000})).stdout.trim();}
      catch{return {installed:false,supported:false,connected:false,method:'none'};}
      const supported=version===(provider==='codex'?supportedCodexVersion:supportedClaudeVersion);
      let connected=false;
      let method='none';
      if(supported)try{
        const output=await run(file,provider==='codex'?['-c','cli_auth_credentials_store="file"','login','status']:['auth','status'],{env,cwd:tmpdir(),timeout:5000,maxBuffer:16000});
        if(provider==='codex') {connected=/Logged in using ChatGPT/.test(output.stdout+'\n'+output.stderr);method=connected?'subscription':'other';}
        else {const auth=JSON.parse(output.stdout);connected=auth.loggedIn===true&&auth.authMethod==='claude.ai';method=connected?'subscription':auth.loggedIn?'other':'none';}
      }catch{connected=false;}
      return {installed:true,supported,connected,method};
    },
    async login(provider) {
      const file=executable(provider);
      return new Promise((resolve,reject)=>{
        const child=launch(file,provider==='codex'?['-c','cli_auth_credentials_store="file"','login']:['auth','login','--claudeai'],{env,cwd:tmpdir(),shell:false,detached:process.platform!=='win32',stdio:'ignore'});
        let expired=false;
        const timer=setTimeout(()=>{expired=true;try{if(process.platform!=='win32'&&child.pid)process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch{child.kill();}},180000);
        child.once('error',()=>{clearTimeout(timer);reject(new AppError('connectionFailed'));});
        child.once('close',code=>{clearTimeout(timer);if(code===0&&!expired)resolve();else reject(new AppError('connectionFailed'));});
      });
    },
  };
}
