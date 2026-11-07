import { PassThrough } from 'node:stream';
import { EventEmitter } from 'node:events';
export function copilotTransportFixture({protocol=3,authenticated=true,reply='answer',result={version:1,items:[]}}={}){
  const child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>{child.stopped=true;};
  const messages=[];const answers=[];
  const send=message=>{const body=JSON.stringify({jsonrpc:'2.0',...message});const frame=`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;child.stdout.write(frame.slice(0,9));child.stdout.write(frame.slice(9));};
  child.stdin.on('data',chunk=>{
    const message=JSON.parse(chunk.toString().split('\r\n\r\n')[1]);messages.push(message);
    if(!message.method){answers.push(message);return;}
    const results={connect:{protocolVersion:protocol},'auth.getStatus':{isAuthenticated:authenticated,authType:'user',host:'https://github.com'},'session.create':{sessionId:'fixture'},'session.send':{messageId:'fixture-message'}};
    queueMicrotask(()=>{
      send({id:message.id,result:results[message.method]});
      if(message.method!=='session.send')return;
      if(reply==='hang')return;
      if(reply==='request'){send({id:'tool-request',method:'permission.request',params:{command:'unsafe'}});}
      if(reply==='large'){child.stdout.write('Content-Length: 1000001\r\n\r\n');return;}
      if(reply==='malformed'){child.stdout.write('invalid header\r\n\r\n');return;}
      const event=(type,data)=>send({method:'session.event',params:{sessionId:'fixture',event:{type,data}}});
      if(reply==='tool'){event('tool.execution_start',{});return;}
      if(reply==='error'){event('session.error',{message:'private details'});return;}
      event('assistant.message',{content:reply==='json'?'not JSON':JSON.stringify(result)});event('session.idle',{});
    });
  });
  return {child,messages,answers,launch:()=>child};
}
