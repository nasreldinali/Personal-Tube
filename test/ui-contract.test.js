import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { frontendSource } from './frontend-source-fixture.js';
import { messages } from '../public/locale.js';

test('UI exposes language, theme, library, data and channel controls with complete translations', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  for (const id of ['language', 'theme', 'view-discover', 'view-channels', 'view-later', 'view-watched', 'export-data', 'import-data', 'clear-data', 'channel-form']) assert.ok(html.includes(`id="${id}"`), id);
  for (const match of html.matchAll(/data-i18n(?:-placeholder|-label)?="([^"]+)"/g)) assert.ok(messages.en[match[1]] && messages.ar[match[1]], match[1]);
  assert.ok(html.includes('assets/tokens/deeda.css'));
  assert.ok(html.includes('assets/logo/deeda-mark-96.png'));
  assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>/);
});
test('rendering uses text nodes and safe DOM construction rather than HTML interpolation', async () => {
  for (const file of ['app.js', 'ui/dom.js', 'ui/feed-view.js']) {
    const source = await readFile(new URL(`../public/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(/);
  }
});

test('compact layout exposes an accessible sidebar toggle, sticky filters and discovery source controls', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8');
  for (const id of ['sidebar-toggle', 'view-recommendations', 'view-community', 'recommendation-form', 'community-file', 'rec-language', 'rec-min-views', 'rec-min-likes', 'player-similar']) assert.ok(html.includes(`id="${id}"`), id);
  assert.doesNotMatch(html, /<a[^>]*class="d-brand"/);
  assert.match(css, /\.filters\s*\{[^}]*position:\s*sticky/);
  assert.match(css, /data-collapsed/);
  assert.match(css, /repeat\(4,minmax\(0,1fr\)\)/);
});
test('community discovery exposes one automatic search with progress and optional settings', async () => {
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  for(const id of ['collect-submit','collect-stop','collect-progress','community-options','community-inputs'])assert.ok(html.includes(`id="${id}"`),id);
  for(const id of ['collect-analyze','collect-analyze-next','community-original','collect-sort'])assert.equal(html.includes(`id="${id}"`),false,id);
  assert.match(html,/<progress[^>]*id="collect-progress"/);
  assert.match(html,/<details[^>]*id="community-options"/);
});
test('main header owns preferences and selection is an explicit accessible mode',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const sidebar=html.slice(html.indexOf('<aside'),html.indexOf('</aside>'));
 const header=html.slice(html.indexOf('<header'),html.indexOf('</header>'));
 for(const id of ['language','theme']){assert.ok(header.includes(`id="${id}"`));assert.ok(!sidebar.includes(`id="${id}"`));}
 assert.match(html,/<button id="select-toggle"[^>]*aria-controls="selection-actions"/);
 assert.match(html,/<div id="selection-actions"[^>]*hidden/);
 assert.match(html,/<button class="close" data-close="setup-dialog"/);
 assert.match(html,/<button id="settings-back"[^>]*hidden/);
});

test('refresh settings are independent of key entry and only explicit refresh bypasses policy',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 for(const id of ['refresh-settings-form','refresh-mode','refresh-interval','refresh-settings-status'])assert.ok(html.includes(`id="${id}"`));
 const source=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
 assert.equal([...source.matchAll(/\brefresh\(true\)/g)].length,1);
 assert.match(source,/bind\('refresh', 'click', \(\) => refresh\(true\)\)/);
 assert.match(source,/automaticRefreshDue\(preferences, lastRefreshAttempt, now\(\), !document.hidden\)/);
 assert.match(source,/preferences: refreshPreferences, shouldContinue:/);
});

test('channel loading is independent from background operations on every view',async()=>{
 const source=await frontendSource('ui/channel-manager.js');
 const app=await frontendSource('ui/library-feed.js');
 assert.match(source,/text\(addingChannel \? 'adding' : 'addChannel'\)/);
 assert.ok(app.indexOf('renderPanels();')<app.indexOf('if (discoveryMode)'));
 const entry=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
 assert.match(entry,/renderPanels:.*renderAddState\(\); renderUsage\(\)/);
 const action=source.slice(source.indexOf("bind('channel-form'"),source.indexOf("}, 'channel-error');")+20);
 assert.doesNotMatch(action,/if \(isBusy\(\)\)|busy = true|await refresh\(\)/);
 assert.match(action,/channels !== readState\(\).channels/);
 assert.match(action,/refreshAdded\(added.id\)/);
});

test('community quality gates and ready-library entry are visible without manual batch controls',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 for(const id of ['collect-min-views','collect-min-likes','collect-language','collect-min-recommenders','collect-cooldown','community-browse-library','community-guide'])assert.ok(html.includes(`id="${id}"`),id);
 const css=await readFile(new URL('../public/styles.css',import.meta.url),'utf8');
 assert.match(css,/\.search:focus-within/);assert.match(css,/\.header-control:has\(select:focus-visible\)/);
 const feed=await readFile(new URL('../public/ui/community-feed.js',import.meta.url),'utf8');
 assert.match(feed,/verifyCommunityVideos/);assert.doesNotMatch(feed,/response=progress/);
 assert.match(messages.en.apiUsageHelp,/Google/);assert.match(messages.en.usageHelp,/server/);
});


test('channel category changes narrow names and clear incompatible selections before filtering',async()=>{
 const { runInNewContext }=await import('node:vm');
 const { selectOptions, element }=await import('../public/ui/dom.js');
 const { setupDocumentFixture }=await import('./fixtures.js');
 const fixture=setupDocumentFixture(); const previous=globalThis.document;globalThis.document=fixture.document;
 try {
  const source=await frontendSource('ui/library-feed.js');
  const channels=[{id:'sport-a',title:'Sport A',category:'Sport'},{id:'sport-b',title:'Sport B',category:'Sport'},{id:'tech',title:'Tech',category:'Technology'},{id:'other',title:'Other',category:''}];
  const $=id=>fixture.document.getElementById(id);
  for(const id of ['area','category','channel-filter','channel-name-filter'])$(id).value='';
  const scope={preferences:{language:'en'},catalog:{areas:[]},state:{channels},$,text:key=>key,selectOptions,element};
  scope.readPreferences=()=>scope.preferences;scope.readState=()=>scope.state;scope.readCatalog=()=>scope.catalog;
  runInNewContext(source.slice(source.indexOf('function renderFilters()'),source.indexOf('function latestVideos()'))+';this.refresh=renderFilters;',scope);
  const ids=()=>$('channel-name-filter').children.map(option=>option.value);
  scope.refresh();assert.deepEqual(ids(),['','sport-a','sport-b','tech','other']);
  $('channel-name-filter').value='tech';$('channel-filter').value='Sport';
  let rendered=false;
  const eventSource=source.split('\n').map(line=>line.trimStart()).find(line=>line.startsWith("for (const id of ['area', 'category'"));
  runInNewContext(eventSource,{...scope,pageSize:36,renderFilters:scope.refresh,bind:(id,event,handler)=>{if(id==='channel-filter')handler();},render:()=>{rendered=true;assert.deepEqual(ids(),['','sport-a','sport-b']);assert.equal($('channel-name-filter').value,'');}});
  assert.equal(rendered,true);
  $('channel-name-filter').value='sport-a';scope.refresh();assert.equal($('channel-name-filter').value,'sport-a');
  $('channel-filter').value='';scope.refresh();assert.deepEqual(ids(),['','sport-a','sport-b','tech','other']);assert.equal($('channel-name-filter').value,'sport-a');
  $('channel-filter').value='Technology';scope.refresh();assert.deepEqual(ids(),['','tech']);assert.equal($('channel-name-filter').value,'');
  $('channel-name-filter').value='tech';scope.state.channels=channels.filter(c=>c.id!=='tech');scope.refresh();assert.equal($('channel-filter').value,'');assert.equal($('channel-name-filter').value,'');assert.deepEqual(ids(),['','sport-a','sport-b','other']);
 } finally {globalThis.document=previous;}
});

test('channel content defaults to long videos then offers estimated Shorts and both',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const select=html.match(/<select id="channel-kind"[^>]*>(.*?)<\/select>/s)[1];
 assert.deepEqual([...select.matchAll(/<option value="([^"]+)"/g)].map(match=>match[1]),['videos','shorts','all']);
 assert.match(select,/<option value="videos" selected/);
});
