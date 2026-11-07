import { spawn } from 'node:child_process';
import { AppError } from '../public/domain/errors.js';
import { copilotArguments, copilotProtocol, copilotSession, subscriptionAuth } from './copilot-policy.js';
import { classificationSchema } from './classifier-policy.js';

// The reviewed official CLI uses Content-Length framed JSON-RPC, protocol 3.
export async function openCopilot({executable,env,cwd,launch=spawn,timeout=120000,setTimer=setTimeout,clearTimer=clearTimeout}) {
  const child=launch(executable,copilotArguments,{env,cwd,shell:false,detached:process.platform!=='win32',stdio:['pipe','pipe','pipe']});
  const pending=new Map();
  let next=0,bytes=0,buffer=Buffer.alloc(0),closed=false,analysis=null;
  const failure=()=>new AppError('classificationUnavailable');
  const stop=(error=failure())=>{
    if(closed)return;closed=true;clearTimer(timer);
    for(const entry of pending.values()){clearTimer(entry.timer);entry.reject(error);}pending.clear();
    if(analysis){analysis.reject(error);analysis=null;}
    try{if(process.platform!=='win32'&&child.pid)process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch{child.kill();}
  };
  const timer=setTimer(stop,timeout);
  const send=value=>{if(!closed)child.stdin.write(`Content-Length: ${Buffer.byteLength(JSON.stringify(value))}\r\n\r\n${JSON.stringify(value)}`);};
  function request(method,params,wait=8000) {
    if(closed)return Promise.reject(failure());
    return new Promise((resolve,reject)=>{
      const id=++next;const deadline=setTimer(()=>stop(),wait);
      pending.set(id,{resolve,reject,timer:deadline});send({jsonrpc:'2.0',id,method,params});
    });
  }
  function receive(message) {
    if(message.jsonrpc!=='2.0')throw failure();
    if(message.method && message.id!==undefined){
      // No server-initiated tool, permission, user-input or extension calls are allowed.
      send({jsonrpc:'2.0',id:message.id,error:{code:-32601,message:'Client capability unavailable'}});return;
    }
    if(message.id!==undefined){
      const entry=pending.get(message.id);if(!entry)throw failure();pending.delete(message.id);clearTimer(entry.timer);
      if(message.error)entry.reject(failure());else entry.resolve(message.result);return;
    }
    if(message.method!=='session.event'||!analysis||message.params?.sessionId!==analysis.id)return;
    const event=message.params.event;
    if(event?.type==='session.error'||event?.type?.startsWith('tool.')||event?.type==='permission.requested')throw failure();
    if(event?.type==='assistant.message'){
      if(event.data?.toolRequests?.length || event.data?.serverTools?.length || typeof event.data?.content!=='string')throw failure();
      analysis.answer=event.data.content;
    }
    if(event?.type==='session.idle'){
      const active=analysis;analysis=null;
      try{active.resolve(JSON.parse(active.answer));}catch{active.reject(new AppError('invalidClassification'));}
    }
  }
  child.stdout.on('data',chunk=>{
    try{
      bytes+=chunk.length;if(bytes>4000000)throw failure();buffer=Buffer.concat([buffer,chunk]);
      while(buffer.length){
        const end=buffer.indexOf('\r\n\r\n');if(end<0){if(buffer.length>256)throw failure();break;}
        const match=/^Content-Length: ([0-9]+)$/i.exec(buffer.subarray(0,end).toString());
        if(!match)throw failure();const size=Number(match[1]);if(!Number.isSafeInteger(size)||size>1000000)throw failure();
        if(buffer.length<end+4+size)break;
        const message=JSON.parse(buffer.subarray(end+4,end+4+size));buffer=buffer.subarray(end+4+size);receive(message);
      }
    }catch{stop();}
  });
  child.stderr.on('data',chunk=>{bytes+=chunk.length;if(bytes>4000000)stop();});
  child.stdin.on('error',()=>stop());child.once('error',()=>stop());child.once('close',()=>stop());
  try{
    const connection=await request('connect',{supportedTaskKinds:[]});
    if(connection?.protocolVersion!==copilotProtocol)throw new AppError('classifierVersion');
    const auth=await request('auth.getStatus',{});
    return {auth,close:stop,async analyze(prompt){
      if(!subscriptionAuth(auth))throw new AppError('analysisConnectionRequired');
      if(analysis)throw new AppError('busy');
      const session=await request('session.create',copilotSession(cwd),20000);
      if(typeof session?.sessionId!=='string')throw failure();
      const answer=new Promise((resolve,reject)=>{analysis={id:session.sessionId,resolve,reject};});
      const sending=request('session.send',{sessionId:session.sessionId,prompt,responseFormat:{type:'json_schema',jsonSchema:{name:'classification',schema:classificationSchema,strict:true}}},20000);
      try{const [,result]=await Promise.all([sending,answer]);return result;}catch(error){stop(error);throw error;}
    }};
  }catch(error){stop(error);throw error;}
}
