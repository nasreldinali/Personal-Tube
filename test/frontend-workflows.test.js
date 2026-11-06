import test from 'node:test';
import assert from 'node:assert/strict';
import { appBrowserFixture } from './app-browser-fixture.js';
import { CHANNEL, VIDEO } from './fixtures.js';

async function withApp(options, action) { const app = await appBrowserFixture(options); try { await action(app); } finally { app.restore(); } }

test('manual startup and navigation preserve the view without fetching YouTube', () => withApp({}, async f => {
  assert.equal(f.$('current-view').textContent, 'My channels');
  assert.equal(f.$('videos').children.length, 1);
  await f.$('view-later').click(); assert.equal(f.location.hash, '#later'); assert.equal(f.$('videos').children.length, 0);
  await f.$('view-channels').click(); assert.equal(f.$('videos').children.length, 1);
  await f.document.emit('visibilitychange'); for (const tick of f.intervals) tick();
  assert.equal(f.requests.some(r => r.url.includes('googleapis')), false);
}));

test('player validates ids, preserves saved actions and unloads the iframe on close', () => withApp({}, async f => {
  await f.$('videos').children[0].querySelector('.thumbnail').click();
  assert.equal(f.$('player-dialog').open, true);
  assert.match(f.$('player-container').children[0].src, /^https:\/\/www.youtube.com\/embed\/abcdefghijk\?/);
  await f.$('player-later').click(); assert.deepEqual(f.library().later, [VIDEO.id]);
  await f.$('player-watched').click(); assert.deepEqual(f.library().watched, [VIDEO.id]);
  await f.$('player-later').click(); assert.deepEqual(f.library().later, []);
  f.$('player-dialog').close(); assert.equal(f.$('player-container').children.length, 0);
}));

test('selection hides only confirmed videos and restoration keeps the library', () => withApp({}, async f => {
  await f.$('select-toggle').click(); assert.equal(f.document.documentElement.dataset.selecting, 'true');
  await f.$('select-visible').click(); await f.$('delete-selected').click();
  assert.equal(f.$('confirm-dialog').open, true); assert.equal(f.library().hidden, undefined);
  f.$('confirm-dialog').close(); assert.equal(f.$('videos').children.length, 1);
  await f.$('delete-selected').click(); await f.$('confirm-yes').click();
  assert.deepEqual(f.library().hidden, [VIDEO.id]); assert.equal(f.$('videos').children.length, 0);
  await f.$('restore-hidden').click(); assert.deepEqual(f.library().hidden, []); assert.equal(f.$('videos').children.length, 1);
  await f.$('selection-cancel').click(); assert.equal(f.document.documentElement.dataset.selecting, 'false'); assert.equal(f.document.activeElement, f.$('select-toggle'));
}));

test('channel editing and confirmed removals update filters and associated cached data', () => withApp({}, async f => {
  await f.$('channels-open').click();
  const row = f.$('channel-list').children[0]; const category = row.querySelector('input');
  category.value = 'Science'; await category.emit('change'); assert.equal(f.state().channels[0].category, 'Science');
  await row.querySelector('button').click(); assert.equal(f.state().channels.length, 1);
  await f.$('confirm-yes').click(); assert.equal(f.state().channels.length, 0); assert.equal(f.state().cache[CHANNEL.id], undefined);
  assert.equal(f.$('channel-name-filter').children.length, 1);
}));

test('settings store refresh policy independently and empty key fields on close', () => withApp({}, async f => {
  await f.$('settings-open').click();
  f.$('refresh-mode').value = 'auto'; f.$('refresh-interval').value = '60';
  await f.$('refresh-settings-form').emit('submit');
  const preferences = JSON.parse(f.local.getItem('personaltube.preferences.v1'));
  assert.equal(preferences.refreshMode, 'auto'); assert.equal(preferences.refreshMinutes, 60);
  f.$('api-key').value = 'unsaved fixture'; f.$('settings-dialog').close(); assert.equal(f.$('api-key').value, '');
  await f.$('settings-open').click(); assert.equal(f.$('api-key').value, '');
}));

test('stale-tab mutations fail closed and known errors never expose exception text', () => withApp({}, async f => {
  await f.window.emit('storage', { key: 'personaltube.state.v1' });
  f.$('expiry').value = '1'; await f.$('expiry').emit('change');
  assert.equal(f.state().days, 7); assert.match(f.$('notice').textContent, /another tab/i);
  await f.$('channels-open').click(); f.$('channel-input').value = '@fixture'; await f.$('channel-form').emit('submit');
  assert.match(f.$('channel-error').textContent, /another tab/i);
}));

test('all four languages and theme controls retain current navigation', () => withApp({}, async f => {
  for (const language of ['ar', 'de', 'es', 'en']) {
    f.$('language').value = language; await f.$('language').emit('change');
    assert.equal(f.document.documentElement.lang, language); assert.equal(f.document.documentElement.dir, language === 'ar' ? 'rtl' : 'ltr');
    assert.equal(f.location.hash, '#channels');
  }
  for (const theme of ['light', 'dark', 'auto']) { f.$('theme').value = theme; await f.$('theme').emit('change'); assert.equal(f.document.documentElement.dataset.theme, theme === 'auto' ? undefined : theme); }
}));

test('import validates before confirmation, reloads state after approval and clears the file control', () => withApp({}, async f => {
  const backup={version:1,format:'personaltube-backup',days:2,channels:[],preferences:{version:1,language:'de',theme:'light',setupDone:true},library:{version:1,later:[VIDEO.id],watched:[]}};
  const content=JSON.stringify(backup);
  f.$('import-data').files=[{name:'fixture.json',size:content.length,text:async()=>content}]; f.$('import-data').value='fixture.json';
  await f.$('import-data').emit('change'); assert.equal(f.$('import-data').value,''); assert.equal(f.state().days,7);
  assert.equal(f.$('confirm-dialog').open,true); await f.$('confirm-yes').click();
  assert.equal(f.state().days,2); assert.equal(f.state().channels.length,0); assert.deepEqual(f.library().later,[VIDEO.id]); assert.equal(f.document.documentElement.lang,'de');
  f.$('import-data').files=[{name:'fixture.json',size:1,text:async()=>'{'}];await f.$('import-data').emit('change');assert.equal(f.$('confirm-dialog').open,false);assert.equal(f.state().days,2);
}));

test('clearing requires confirmation and waits for temporary community deletion before local reset', async () => {
  let release;
  await withApp({fetcher:async(url,options)=>{
    if(String(url)==='/api/community'&&JSON.parse(options.body).action==='clearAll')return new Promise(resolve=>{release=resolve;});
  }}, async f => {
    await f.$('clear-data').click(); assert.equal(f.state().channels.length,1);
    const pending=f.$('confirm-yes').click(); assert.equal(f.state().channels.length,1);
    release({ok:true,json:async()=>({version:1,videos:[]})}); await pending;
    assert.equal(f.local.getItem('personaltube.state.v1'),null); assert.equal(f.$('videos').children.length,0);
    assert.equal(f.$('api-key').value,''); assert.equal(f.$('remember-key').checked,false);
  });
});

test('failed community deletion preserves personal data and reports a safe error', () => withApp({fetcher:async(url)=>{
  if(String(url)==='/api/community')return {ok:false,json:async()=>({error:'communitySourceUnavailable'})};
}},async f=>{
  await f.$('clear-data').click();await f.$('confirm-yes').click();assert.equal(f.state().channels.length,1);assert.ok(f.$('settings-error').textContent);
}));

test('manual refresh uses the saved key only on request and meters attempted YouTube calls',()=>withApp({key:'AIza'+'x'.repeat(35),fetcher:async url=>{
  if(String(url).includes('googleapis.com'))return {ok:true,json:async()=>({items:[]})};
}},async f=>{
  assert.equal(f.requests.filter(r=>r.url.includes('googleapis.com')).length,0);
  await f.$('refresh').click();assert.equal(f.requests.filter(r=>r.url.includes('googleapis.com')).length,1);
  assert.deepEqual(f.state().cache[CHANNEL.id].videos,[]);
  assert.equal(JSON.parse(f.local.getItem('personaltube.youtube-usage.v1')).units,1);
  await f.window.emit('online');assert.equal(f.requests.filter(r=>r.url.includes('googleapis.com')).length,1);
}));

test('a pending refresh never replaces a newer user state revision',async()=>{
  let release,started;
  const requested=new Promise(resolve=>{started=resolve;});
  await withApp({key:'AIza'+'x'.repeat(35),fetcher:async url=>{
    if(String(url).includes('googleapis.com')){started();return new Promise(resolve=>{release=resolve;});}
  }},async f=>{
    const pending=f.$('refresh').click();await requested;
    f.$('expiry').value='2';await f.$('expiry').emit('change');
    release({ok:true,json:async()=>({items:[]})});await pending;
    assert.equal(f.state().days,2);assert.deepEqual(f.state().cache[CHANNEL.id].videos.map(v=>v.id),[VIDEO.id]);assert.equal(f.$('refresh').disabled,false);
  });
});
