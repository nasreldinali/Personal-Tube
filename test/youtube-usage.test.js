import test from 'node:test';
import assert from 'node:assert/strict';
import { YouTubeUsage, USAGE_KEY, USAGE_FAILURE_KEY } from '../public/data/youtube-usage.js';
import { YouTubeClient } from '../public/data/youtube.js';
import { BrowserStore } from '../public/data/browser-store.js';
import { memoryStorage, apiResponse, NOW } from './fixtures.js';

test('meter separates buckets, persists only aggregate counts and resets at Pacific midnight', async () => {
  const storage=memoryStorage(); let time=Date.parse('2026-11-04T07:59:59Z');
  const usage=new YouTubeUsage(storage,()=>time);
  await usage.record('channels'); await usage.record('videos'); await usage.record('search');
  assert.deepEqual(usage.snapshot(),{day:'2026-11-03',units:2,search:1});
  assert.deepEqual(new YouTubeUsage(storage,()=>time).snapshot(),usage.snapshot());
  assert.deepEqual(Object.keys(JSON.parse(storage.getItem(USAGE_KEY))).sort(),['day','search','units','version']);
  time=Date.parse('2026-11-04T08:00:00Z'); assert.equal(usage.snapshot().units,0);
  await usage.record('commentThreads'); assert.equal(usage.snapshot().units,1);
  time=Date.parse('2026-07-02T06:59:59Z'); await usage.record('channels'); assert.equal(usage.snapshot().day,'2026-07-01');
  time=Date.parse('2026-07-02T07:00:00Z'); assert.equal(usage.snapshot().units,0);
});
test('corrupt, unknown-version and unavailable counters do not claim zero remaining usage', async () => {
  for(const value of ['bad',JSON.stringify({version:2}),JSON.stringify({version:1,day:'2026-11-03',units:-1,search:0})]) {
    const usage=new YouTubeUsage(memoryStorage({[USAGE_KEY]:value}),()=>NOW);
    assert.equal(usage.snapshot(),null); await usage.record('channels'); assert.equal(usage.snapshot(),null);
  }
  const usage=new YouTubeUsage({getItem(){throw new Error('blocked');}},()=>NOW);
  await usage.record('channels'); assert.equal(usage.snapshot(),null);
});
test('request attempts are counted including API failures, while invalid input and resource are not', async () => {
  const usage=new YouTubeUsage(memoryStorage(),()=>NOW);
  const client=new YouTubeClient('fixture',async()=>apiResponse({error:{errors:[{reason:'quotaExceeded'}]}},403),{onRequest:resource=>usage.record(resource)});
  await assert.rejects(client.resolve('@fixture'),e=>e.code==='quota'); assert.equal(usage.snapshot().units,1);
  await assert.rejects(client.resolve('not a channel')); assert.equal(usage.snapshot().units,1);
  await assert.rejects(client.request('../bad',{})); assert.equal(usage.snapshot().units,1);
  client.key=''; await assert.rejects(client.resolve('@fixture')); assert.equal(usage.snapshot().units,1);
});
test('usage uses an exclusive cross-tab lock and never prevents requests on meter failure',async()=>{
  let locks=0;
  const usage=new YouTubeUsage(memoryStorage(),()=>NOW,{request:async(name,options,action)=>{locks++;assert.equal(options.ifAvailable,true);return action({name});}});
  await usage.record('channels');assert.equal(locks,1);assert.equal(usage.snapshot().units,1);
  const blocked=new YouTubeUsage(memoryStorage(),()=>NOW,{request:async(name,options,action)=>action(null)});
  await blocked.record('channels');assert.equal(blocked.snapshot(),null);
  const client=new YouTubeClient('fixture',async()=>apiResponse({items:[]}),{onRequest:()=>{throw new Error('storage');}});
  assert.deepEqual(await client.request('channels',{}),{items:[]});
});
test('daily meter is excluded from backups and removed with personal data',async()=>{
  const storage=memoryStorage();const usage=new YouTubeUsage(storage,()=>NOW);await usage.record('channels');
  const store=new BrowserStore(storage,memoryStorage());assert.equal(JSON.stringify(store.exportData(NOW)).includes('units'),false);
  storage.setItem(USAGE_FAILURE_KEY,'2026-11-03');
  store.clearPersonalData();assert.equal(storage.getItem(USAGE_KEY),null);assert.equal(storage.getItem(USAGE_FAILURE_KEY),null);
});
test('a missed increment is unavailable to other tabs and reloads until the next Pacific day',async()=>{
  const storage=memoryStorage();let time=Date.parse('2026-11-04T12:00:00Z');
  const first=new YouTubeUsage(storage,()=>time,{request:async(name,options,action)=>action({name})});
  const contended=new YouTubeUsage(storage,()=>time,{request:async(name,options,action)=>action(null)});
  let requests=0;
  for(const meter of [first,contended]) {
    const client=new YouTubeClient('fixture',async()=>{requests++;return apiResponse({items:[]});},{onRequest:resource=>meter.record(resource)});
    await client.request('channels',{});
  }
  assert.equal(requests,2);
  assert.equal(contended.snapshot(),null);
  assert.equal(first.snapshot(),null,'another tab must not present an incomplete count');
  assert.equal(new YouTubeUsage(storage,()=>time).snapshot(),null,'reloading must not restore apparent accuracy');
  time=Date.parse('2026-11-05T08:00:00Z');
  const tomorrow=new YouTubeUsage(storage,()=>time);
  assert.deepEqual(tomorrow.snapshot(),{day:'2026-11-05',units:0,search:0});
  await tomorrow.record('videos');assert.equal(tomorrow.snapshot().units,1);
});
test('a contended tab recovers next Pacific day without reloading the page',async()=>{
  const storage=memoryStorage();let time=Date.parse('2026-11-04T12:00:00Z');let available=false;
  const usage=new YouTubeUsage(storage,()=>time,{request:async(name,options,action)=>action(available?{name}:null)});
  await usage.record('channels');assert.equal(usage.snapshot(),null);
  time=Date.parse('2026-11-05T08:00:00Z');available=true;
  assert.deepEqual(usage.snapshot(),{day:'2026-11-05',units:0,search:0});
  await usage.record('channels');assert.equal(usage.snapshot().units,1);
});
