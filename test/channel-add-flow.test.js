import test from 'node:test';
import assert from 'node:assert/strict';
import { frontendSource, factorySource } from './frontend-source-fixture.js';
import { setupDocumentFixture } from './fixtures.js';
import { runInNewContext } from 'node:vm';
import { AppError } from '../public/domain/errors.js';
import { CHANNEL, VIDEO, NOW } from './fixtures.js';

const source=await frontendSource('ui/channel-manager.js');
const added=()=>({...CHANNEL,id:'UC'+'b'.repeat(22),title:'New fixture channel'});
function fixture() {
  let handler,resolve,reject,resolves=0,writes=0,resets=0;
  const refreshed=[];
  const nodes=new Map([
    ['channel-input',{value:'@fixture'}],['channel-category',{value:' Learning '}],
    ['channel-error',{}],['channel-status',{}],['channel-form',{reset(){resets++;}}],
  ]);
  const dom=setupDocumentFixture();
  const make=()=>dom.document.createElement('div');
  const context={
    AppError,addingChannel:false,busy:true,storageBlocked:false,staleTab:false,
    key:'fixture',stateRevision:0,state:{version:1,days:7,channels:[{...CHANNEL}],cache:{}},lastRefreshAttempt:NOW,
    bind:(id,event,callback)=>{if(id==='channel-form'){assert.equal(event,'submit');handler=callback;}},
    $:id=>nodes.get(id)||dom.document.getElementById(id),element:make,safeImage:()=>'',render(){},renderChannels(){},renderFilters(){},text:key=>key,
    youtubeClient:()=>({resolve:input=>{resolves++;assert.equal(input,'@fixture');return new Promise((yes,no)=>{resolve=yes;reject=no;});}}),
    commitState:next=>{context.state=next;context.stateRevision++;writes++;},
    refresh:(force,id)=>{refreshed.push({force,id});},
  };
  const ports={text:context.text,readState:()=>context.state,readKey:()=>context.key,isBusy:()=>context.busy,isStale:()=>context.staleTab,isStorageBlocked:()=>context.storageBlocked,commitState:context.commitState,renderFilters:context.renderFilters,render:context.render,showError:()=>{},notify:()=>{},askConfirmation:()=>{},bind:context.bind,youtubeClient:context.youtubeClient,refreshAdded:id=>{context.lastRefreshAttempt=null;context.refresh(false,id);}};
  context.ports=ports;
  const manager=runInNewContext(factorySource(source,'createChannelManager')+';createChannelManager(ports);',context);
  Object.defineProperty(context,'addingChannel',{get:manager.isAddingChannel});
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

test('channel addition refuses missing keys, stale storage, full lists and duplicate channels',async()=>{
  for(const [change,code] of [
    [c=>{c.key='';},'keyRequired'],[c=>{c.staleTab=true;},'storageConflict'],
    [c=>{c.storageBlocked=true;},'storageRead'],[c=>{c.state.channels=Array(200).fill(CHANNEL);},'channelLimit'],
  ]) {
    const f=fixture();change(f.context);await assert.rejects(f.submit(),error=>error.code===code);assert.equal(f.counts().resolves,0);assert.equal(f.counts().writes,0);
  }
  const f=fixture();const pending=f.submit();f.resolve({...CHANNEL});await assert.rejects(pending,error=>error.code==='duplicateChannel');assert.equal(f.context.addingChannel,false);assert.equal(f.counts().writes,0);
});
