import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { AppError } from '../public/domain/errors.js';
import { CHANNEL, VIDEO, NOW } from './fixtures.js';

const source=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
const start=source.indexOf("bind('channel-form', 'submit',");
const end=source.indexOf("bind('fetch-durations',",start);
assert.ok(start>=0&&end>start,'exercise the actual channel-add event handler');
const added=()=>({...CHANNEL,id:'UC'+'b'.repeat(22),title:'New fixture channel'});
function fixture() {
  let handler,resolve,reject,resolves=0,writes=0,resets=0;
  const refreshed=[];
  const nodes=new Map([
    ['channel-input',{value:'@fixture'}],['channel-category',{value:' Learning '}],
    ['channel-error',{}],['channel-status',{}],['channel-form',{reset(){resets++;}}],
  ]);
  const context={
    AppError,addingChannel:false,busy:true,storageBlocked:false,staleTab:false,
    key:'fixture',stateRevision:0,state:{version:1,days:7,channels:[{...CHANNEL}],cache:{}},lastRefreshAttempt:NOW,
    bind:(id,event,callback)=>{assert.equal(id,'channel-form');assert.equal(event,'submit');handler=callback;},
    $:id=>nodes.get(id),render(){},renderChannels(){},renderFilters(){},text:key=>key,
    youtubeClient:()=>({resolve:input=>{resolves++;assert.equal(input,'@fixture');return new Promise((yes,no)=>{resolve=yes;reject=no;});}}),
    commitState:next=>{context.state=next;context.stateRevision++;writes++;},
    refresh:(force,id)=>{refreshed.push({force,id});},
  };
  runInNewContext(source.slice(start,end),context);
  return {context,nodes,refreshed,submit:()=>handler({preventDefault(){}}),resolve:value=>resolve(value),reject:error=>reject(error),counts:()=>({resolves,writes,resets})};
}
test('adding during background work survives cache-only refresh commits and scopes its own refresh',async()=>{
  const f=fixture();const pending=f.submit();
  assert.equal(f.context.addingChannel,true);assert.equal(f.counts().resolves,1);
  await f.submit();assert.equal(f.counts().resolves,1,'duplicate submissions do not start another request');
  const cache={[CHANNEL.id]:{videos:[VIDEO],fetchedAt:NOW}};
  f.context.state={...f.context.state,cache};f.context.stateRevision++;
  f.resolve(added());await pending;
  assert.equal(f.context.addingChannel,false);assert.equal(f.context.busy,true);
  assert.equal(f.context.state.channels.length,2);assert.equal(f.context.state.cache,cache);
  assert.equal(f.context.state.channels[1].category,'Learning');
  assert.equal(f.counts().writes,1);assert.equal(f.counts().resets,1);
  assert.deepEqual(f.refreshed,[{force:false,id:added().id}]);
});
test('channel deletion or key replacement during addition refuses the late result',async()=>{
  for(const change of [context=>{context.state={...context.state,channels:[]};context.stateRevision++;},context=>{context.key='replacement-fixture';}]) {
    const f=fixture();const pending=f.submit();change(f.context);f.resolve(added());
    await assert.rejects(pending,error=>error.code==='channelChanged');
    assert.equal(f.context.addingChannel,false);assert.equal(f.context.busy,true);
    assert.equal(f.counts().writes,0);assert.equal(f.counts().resets,0);assert.equal(f.refreshed.length,0);
  }
});
test('channel request rejection releases its spinner without releasing unrelated background work',async()=>{
  const f=fixture();const pending=f.submit();f.reject(new AppError('network'));
  await assert.rejects(pending,error=>error.code==='network');
  assert.equal(f.context.addingChannel,false);assert.equal(f.context.busy,true);
  assert.equal(f.counts().writes,0);assert.equal(f.refreshed.length,0);
});
