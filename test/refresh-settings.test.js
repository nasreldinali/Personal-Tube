import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshChannels } from '../public/services/refresh.js';
import { BrowserStore } from '../public/data/browser-store.js';
import { CHANNEL, VIDEO, NOW, memoryStorage } from './fixtures.js';
const state=()=>({version:1,days:7,channels:[CHANNEL],cache:{[CHANNEL.id]:{videos:[VIDEO],fetchedAt:NOW-3600000}}});
test('manual refresh preference makes no automatic requests but explicit refresh still works',async()=>{
 let calls=0;const client={recent:async()=>{calls++;return {videos:[VIDEO],limited:false};}};const data=state();
 await refreshChannels(data,client,{now:NOW,preferences:{refreshMode:'manual'}});assert.equal(calls,0);
 await refreshChannels(data,client,{now:NOW,preferences:{refreshMode:'manual'},force:true});assert.equal(calls,1);
});
test('selected interval governs channel cache freshness including the exact boundary',async()=>{
 let calls=0;const client={recent:async()=>{calls++;return {videos:[],limited:false};}};const data=state();const preferences={refreshMode:'auto',refreshMinutes:360};
 await refreshChannels(data,client,{now:NOW,preferences});assert.equal(calls,0);
 await refreshChannels(data,client,{now:NOW+5*3600000-1,preferences});assert.equal(calls,0);
 await refreshChannels(data,client,{now:NOW+5*3600000,preferences});assert.equal(calls,1);
 data.cache[CHANNEL.id].fetchedAt=NOW-15*60000;
 await refreshChannels(data,client,{now:NOW,preferences:{refreshMinutes:15}});assert.equal(calls,2);
});
test('changing automatic policy during refresh finishes the current channel then stops',async()=>{
 const data=state();data.channels.push({...CHANNEL,id:'UC'+'b'.repeat(22)});let calls=0;let keepGoing=true;
 await refreshChannels(data,{recent:async()=>{calls++;keepGoing=false;return {videos:[VIDEO],limited:false};}},{now:NOW,shouldContinue:()=>keepGoing});
 assert.equal(calls,1);assert.equal(data.cache[CHANNEL.id].fetchedAt,NOW);
});
test('refresh choices survive storage reload and backup import',()=>{
 const store=new BrowserStore(memoryStorage(),memoryStorage());
 store.writePreferences({version:1,language:'ar',theme:'dark',refreshMode:'manual',refreshMinutes:720});
 const other=new BrowserStore(memoryStorage(),memoryStorage());other.importData(JSON.stringify(store.exportData(NOW)),NOW);
 assert.equal(other.readPreferences().refreshMode,'manual');assert.equal(other.readPreferences().refreshMinutes,720);
});
