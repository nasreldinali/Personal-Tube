import { CACHE_TTL, videoPattern } from './config.js';
import { emptyState, visibleVideos, safeImage, channelVideos } from './domain/feed.js';
import { emptyLibrary, toggleLibrary, parseBackup, validateBackupFile } from './domain/library.js';
import { parsePreferences, preferenceAttributes } from './domain/preferences.js';
import { selectCatalog } from './domain/catalog.js';
import { AppError } from './domain/errors.js';
import { BrowserStore } from './data/browser-store.js';
import { YouTubeClient } from './data/youtube.js';
import { refreshChannels } from './services/refresh.js';
import { applyRefreshResult } from './services/refresh-result.js';
import { categoryLabels } from './category-labels.js';
import { t, number, areaName, dateLabel, messages } from './locale.js';
import { byId as $, element, translatePage, selectOptions } from './ui/dom.js';
import { parseDiscovery } from './domain/discovery.js';
import { createDiscoveryPanel } from './ui/discovery-panel.js';
import { hideVideos, removeCategory, viewFromHash } from './domain/panel-actions.js';
import { createSetupPanel } from './ui/setup-panel.js';
import { createVideoCard } from './ui/feed-view.js';

let store;
let discovery = parseDiscovery(null);
let discoveryPanel = null;
let setupPanel = null;
let state = emptyState();
let stateRevision = 0;
let preferences = parsePreferences(null);
let library = emptyLibrary();
let metadata = {};
let key = '';
let catalog = { version: 1, videos: [], areas: [] };
let loading = true;
let busy = false;
let storageBlocked = false;
let staleTab = false;
let lastRefreshAttempt = 0;
let mode = viewFromHash(location.hash);
const selectedVideos = new Set();
let pageSize = 18;
let activeVideo = null;
let confirmation = null;
let noticeKey = '';
let noticeValues = {};
let noticeError = false;
const text = (name, values) => t(preferences.language, name, values);
const now = () => Date.now();

try {
  store = new BrowserStore(localStorage, sessionStorage);
  state = store.readState(now());
  preferences = store.readPreferences();
  library = store.readLibrary();
  discovery = store.readDiscovery();
  metadata = store.readMetadata(now());
  key = store.readKey();
} catch { storageBlocked = true; noticeKey = 'storageRead'; noticeError = true; }

function notify(name = '', values = {}, error = false) {
  noticeKey = name; noticeValues = values; noticeError = error;
  renderNotice();
}
function renderNotice() {
  const name = staleTab ? 'storageConflict' : storageBlocked ? 'storageRead' : noticeKey;
  $('notice').hidden = !name;
  $('notice').textContent = name ? text(name, noticeValues) : '';
  $('notice').dataset.kind = storageBlocked || noticeError ? 'error' : 'info';
}
function errorCode(error) { return messages.en[error?.code] ? error.code : 'unexpected'; }
function showError(error, target) {
  const code = errorCode(error);
  notify(code, {}, true);
  if (target) $(target).textContent = text(code);
}
function persist(action) {
  if (staleTab) throw new AppError('storageConflict');
  if (storageBlocked || !store) throw new AppError('storageRead');
  try { action(); } catch (error) { throw error instanceof AppError ? error : new AppError('storageWrite'); }
}
function commitState(next) {
  persist(() => store.writeState(next));
  state = next; stateRevision++;
}
function bind(id, event, action, errorTarget) {
  $(id).addEventListener(event, async eventObject => {
    try { await action(eventObject); } catch (error) { showError(error, errorTarget); }
  });
}
function applyLayout() {
  document.documentElement.dataset.collapsed = String(discovery.collapsed);
  const label = text(discovery.collapsed ? 'expandSidebar' : 'collapseSidebar');
  $('sidebar-toggle').setAttribute('aria-expanded', String(!discovery.collapsed));
  $('sidebar-toggle').setAttribute('aria-label', label); $('sidebar-toggle').title = label;
  $('sidebar-toggle').lastElementChild.textContent = label;
  document.querySelectorAll('.d-nav button').forEach(button => {
    const key = button.querySelector('[data-i18n]')?.dataset.i18n;
    if (key) { button.setAttribute('aria-label', text(key)); button.title = text(key); }
  });
}
function saveDiscovery(next) {
  persist(() => store.writeDiscovery(next)); discovery = next;
}
function applyPreferences() {
  const attrs = preferenceAttributes(preferences);
  document.documentElement.lang = attrs.lang;
  document.documentElement.dir = attrs.dir;
  if (attrs.theme) document.documentElement.dataset.theme = attrs.theme;
  else delete document.documentElement.dataset.theme;
  translatePage(preferences.language);
  $('language').value = preferences.language;
  $('theme').value = preferences.theme;
  applyLayout(); renderFilters(); render(); renderChannels(); renderPlayerButtons();
  if (confirmation) $('confirm-text').textContent = text(confirmation.message);
}
function renderFilters() {
  const lang = preferences.language;
  selectOptions($('area'), [['', text('allTopics')], ...catalog.areas.map(a => [a.id, areaName(lang, a.id, a.name)])], $('area').value);
  const areas = catalog.areas.filter(a => !$('area').value || a.id === $('area').value);
  selectOptions($('category'), [['', text('allCategories')], ...areas.flatMap(a => a.categories.map(c => [c.id, lang === 'ar' ? categoryLabels[c.id] || c.name : c.name]))], $('category').value);
  const categories = [...new Set(state.channels.map(c => c.category).filter(Boolean))];
  selectOptions($('channel-name-filter'), [['',text('allChannels')],...state.channels.map(c=>[c.id,c.title])], $('channel-name-filter').value);
  selectOptions($('channel-filter'), [['', text('allCategories')], ...categories.map(c => [c, c])], $('channel-filter').value);
  $('categories-list').replaceChildren(...categories.map(c => { const option = element('option'); option.value = c; return option; }));
}
function latestVideos() {
  return visibleVideos(state, { now: now(), category: $('channel-filter').value, channelId: $('channel-name-filter').value, kind: $('channel-kind').value, query: $('search').value.trim() }).map(v => ({ ...v, channelTitle: v.channel.title, channelCategory: v.channel.category, categories: [], tags: [] }));
}
function allLibraryVideos() {
  const byId = new Map(catalog.videos.map(video => [video.id, video]));
  for (const channel of state.channels) {
    for (const video of channelVideos(state.cache[channel.id])) if (!byId.has(video.id)) byId.set(video.id, { ...video, channelTitle: channel.title, channelCategory: channel.category, categories: [], tags: [] });
  }
  for (const video of discoveryPanel?.videos() || []) if (!byId.has(video.id)) byId.set(video.id, video);
  for (const id of [...library.later, ...library.watched]) {
    if (!byId.has(id)) byId.set(id, { id, title: typeof metadata[id]?.title === 'string' ? metadata[id].title : `YouTube · ${id}`, channelTitle: typeof metadata[id]?.channelTitle === 'string' ? metadata[id].channelTitle : 'YouTube', categories: [], tags: [], summary: '' });
  }
  return [...byId.values()];
}
function filteredVideos(ignoreLength = false) {
  if (mode === 'channels') return latestVideos().filter(v => !$('hide-watched').checked || !library.watched.includes(v.id));
  return selectCatalog(mode === 'discover' ? catalog.videos : allLibraryVideos(), {
    mode, query: $('search').value, area: $('area').value, category: $('category').value,
    duration: ignoreLength ? 'all' : $('duration').value, sort: $('sort').value,
    day: new Intl.DateTimeFormat('en-CA').format(new Date()),
    library, metadata, hideWatched: $('hide-watched').checked,
  });
}
function render() {
  const lang = preferences.language;
  const channelMode = mode === 'channels';
  const titles = { discover: ['discoverTitle', 'discoverDescription'], channels: ['channelsTitle', 'channelsDescription'], later: ['laterTitle', 'laterDescription'], watched: ['watchedTitle', 'watchedDescription'] };
  document.querySelectorAll('[data-view]').forEach(button => {
    if (button.dataset.view === mode) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  $('current-view').textContent = text(mode);
  $('current-view').dir = lang === 'ar' ? 'rtl' : 'ltr';
  $('hero').hidden = mode !== 'discover'; $('stats').hidden = mode !== 'discover';
  $('catalog-count').textContent = loading ? '—' : number(lang, catalog.videos.length);
  $('topic-count').textContent = loading ? '—' : number(lang, catalog.areas.reduce((sum, area) => sum + area.categories.length, 0));
  for (const id of ['channel-count', 'nav-channels-count']) $(id).textContent = number(lang, state.channels.length);
  $('nav-later-count').textContent = number(lang, library.later.length);
  const discoveryMode = ['recommendations', 'community'].includes(mode);
  $('feed').hidden = discoveryMode;
  discoveryPanel?.render();
  renderPanelTools();
  setupPanel?.render();
  if (discoveryMode) { renderNotice(); return; }
  $('feed-title').textContent = text(titles[mode][0]);
  $('feed-description').textContent = text(titles[mode][1]);
  $('catalog-filters').hidden = channelMode; $('channel-filters').hidden = !channelMode;
  $('expiry').value = String(state.days);
  $('refresh').hidden = !channelMode;
  $('refresh').disabled = busy || storageBlocked || !key || !state.channels.length;
  $('refresh').textContent = text(busy ? 'refreshing' : 'refresh');
  $('add-channel').disabled = busy || storageBlocked;
  $('add-channel').textContent = text(busy ? 'adding' : 'addChannel');
  const times = Object.values(state.cache).map(item => item.fetchedAt);
  $('update-time').textContent = times.length ? text('lastRefresh', { date: dateLabel(lang, Math.min(...times)) }) : text('neverRefreshed');
  const videos = filteredVideos().filter(v => !(library.hidden || []).includes(v.id));
  const shown = videos.slice(0, pageSize);
  $('feed-count').textContent = text('results', { shown: number(lang, shown.length), total: number(lang, videos.length) });
  const portrait = channelMode && $('channel-kind').value === 'shorts';
  $('videos').classList.toggle('shorts-grid', portrait);
  $('videos').replaceChildren(...shown.map(video => createVideoCard(video, { portrait, language: lang, library, metadata, areas: catalog.areas, onPlay: play, onToggle: toggleSaved, thumbnailStyle: preferences.thumbnail, onHide: confirmHide, onSelect: selectVideo, selected: selectedVideos.has(video.id) })));
  $('empty').hidden = shown.length > 0;
  $('empty-title').textContent = text(loading && !channelMode ? 'loading' : 'empty');
  $('empty-copy').textContent = text(channelMode ? 'emptyChannels' : mode === 'discover' ? 'emptyDiscover' : 'emptyLibrary');
  $('empty-add').hidden = !channelMode;
  $('reset-filters').hidden = channelMode || loading;
  $('show-more').hidden = videos.length <= pageSize;
  $('fetch-durations').hidden = channelMode || !catalog.videos.length;
  $('fetch-durations').disabled = busy || storageBlocked;
  $('fetch-durations').textContent = text(busy ? 'loadingDurations' : 'fetchDurations');
  $('metadata-help').hidden = channelMode || $('duration').value === 'all';
  renderPanelTools();
  renderNotice();
}
function panelVideos() {
  return (['recommendations','community'].includes(mode) ? discoveryPanel.visibleVideos() : filteredVideos()).filter(v=>!(library.hidden||[]).includes(v.id));
}
function displayedVideoIds() { return [...new Set([...document.querySelectorAll('.video-card[data-video-id]')].filter(node=>node.getClientRects().length).map(node=>node.dataset.videoId))]; }
function renderPanelTools() {
  const lang=preferences.language;
  const channelMode=mode==='channels';
  const videos=panelVideos();
  const available = new Set(videos.map(v=>v.id));
  for(const id of selectedVideos) if(!available.has(id)) selectedVideos.delete(id);
  $('delete-selected').disabled = !selectedVideos.size || busy || staleTab;
  $('delete-selected').textContent = text('deleteSelected',{count:number(lang,selectedVideos.size)});
  const displayed=displayedVideoIds();
  $('select-visible').checked = displayed.length > 0 && displayed.every(id=>selectedVideos.has(id));
  $('thumbnail-style').value = preferences.thumbnail || 'frame';
  $('channel-sample-help').hidden = !channelMode || !Object.values(state.cache).some(entry=>entry.limited);
  $('shorts-help').hidden = !channelMode || $('channel-kind').value === 'all';
  }
function changeMode(value) {
  mode = value; history.replaceState(null,'',`#${value}`); pageSize = 18; selectedVideos.clear();
  $('search').value = ''; $('area').value = ''; $('category').value = ''; $('duration').value = 'all'; $('hide-watched').checked = false;
  renderFilters(); render();
}
function renderChannels() {
  $('channel-list').replaceChildren();
  renderCategoryManager();
  if (!state.channels.length) $('channel-list').append(element('p', 'muted', text('noChannels')));
  for (const channel of state.channels) {
    const row = element('div', 'channel-row');
    const image = safeImage(channel.image);
    const avatar = element(image ? 'img' : 'span', 'avatar');
    if (image) { avatar.src = image; avatar.alt = ''; } else avatar.setAttribute('aria-hidden', 'true');
    const details = element('div', 'channel-details');
    const title = element('strong', '', channel.title); title.dir = 'auto';
    const input = element('input', 'd-input'); input.value = channel.category; input.maxLength = 60; input.disabled = busy || storageBlocked;
    input.setAttribute('aria-label', text('channelCategory', { title: channel.title })); input.setAttribute('list', 'categories-list');
    input.addEventListener('change', () => {
      try {
        const next = { ...state, channels: state.channels.map(c => c.id === channel.id ? { ...c, category: input.value.trim() } : c) };
        commitState(next); renderFilters(); render();
      } catch (error) { input.value = channel.category; showError(error, 'channel-error'); }
    });
    const remove = element('button', 'text-button', text('delete')); remove.disabled = busy || storageBlocked;
    remove.setAttribute('aria-label', text('removeChannel', { title: channel.title }));
    remove.addEventListener('click', () => askConfirmation('confirmRemoveChannel', () => {
      try {
        if (busy) throw new AppError('busy');
        const cache = { ...state.cache }; delete cache[channel.id];
        const next = { ...state, channels: state.channels.filter(c => c.id !== channel.id), cache };
        commitState(next); renderFilters(); renderChannels(); render(); notify('channelRemoved');
      } catch (error) { showError(error, 'channel-error'); }
    }));
    details.append(title, input); row.append(avatar, details, remove); $('channel-list').append(row);
  }
}
function selectVideo(id, selected) {
  if (selected) selectedVideos.add(id); else selectedVideos.delete(id);
  render();
}
function confirmHide(ids) {
  askConfirmation('confirmHideVideos', () => {
    if (busy) throw new AppError('busy');
    const next = hideVideos(library, ids); persist(()=>store.writeLibrary(next));library=next;selectedVideos.clear();render();notify('videosHidden');
  });
}
function renderCategoryManager() {
  const categories = [...new Set(state.channels.map(c=>c.category).filter(Boolean))];
  $('category-manager').replaceChildren(...categories.map(category=>{
    const row=element('div','category-row'); const title=element('span','',category);title.dir='auto';
    const remove=element('button','text-button',text('delete'));remove.disabled=busy||storageBlocked;remove.setAttribute('aria-label',text('removeCategory',{category}));
    remove.addEventListener('click',()=>askConfirmation('confirmRemoveCategory',()=>{
      if(busy)throw new AppError('busy');commitState(removeCategory(state,category));renderFilters();renderChannels();render();
    }));row.append(title,remove);return row;
  }));
}
function openSettings() {
  $('restore-hidden').disabled = !(library.hidden || []).length;
  $('api-key').value = key; $('settings-error').textContent = '';
  try { $('remember-key').checked = store?.remembersKey() || false; } catch { $('remember-key').checked = false; }
  $('settings-dialog').showModal();
}
function openChannels() { $('channel-error').textContent = ''; renderChannels(); $('channels-dialog').showModal(); }
function renderPlayerButtons() {
  if (!activeVideo) return;
  $('player-later').textContent = text(library.later.includes(activeVideo.id) ? 'removeLater' : 'saveLater');
  $('player-watched').textContent = text(library.watched.includes(activeVideo.id) ? 'removeWatched' : 'markWatched');
}
function toggleSaved(field, id, video) {
  try {
    const next = toggleLibrary(library, field, id);
    if (video && !library[field].includes(id)) {
      const nextMetadata = { ...metadata, [id]: { ...metadata[id], title: video.title, channelTitle: video.channelTitle, duration: video.duration || '', embeddable: video.embeddable !== false, fetchedAt: now() } };
      persist(() => store.writeMetadata(nextMetadata)); metadata = nextMetadata;
    }
    persist(() => store.writeLibrary(next)); library = next;
    render(); renderPlayerButtons();
    document.querySelector(`[data-video-id="${id}"][data-action="${field}"]`)?.focus();
  } catch (error) { showError(error); }
}
function play(video) {
  if (!videoPattern.test(video.id)) { showError(new AppError('invalidVideo')); return; }
  activeVideo = video;
  $('player-title').textContent = video.title;
  $('youtube-link').href = `https://www.youtube.com/watch?v=${video.id}`;
  $('player-container').replaceChildren();
  if (video.embeddable === false || metadata[video.id]?.embeddable === false || metadata[video.id]?.unavailable) $('player-container').append(element('p', 'd-note', text('embedBlocked')));
  else {
    const iframe = element('iframe'); iframe.title = video.title;
    iframe.src = `https://www.youtube.com/embed/${video.id}?autoplay=1&playsinline=1`;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    $('player-container').append(iframe);
  }
  $('recommendation').hidden = !video.summary && !video.why;
  $('video-summary').textContent = video.summary || ''; $('video-why').textContent = video.why || '';
  $('video-quote').textContent = video.quote?.text || ''; $('video-quote').hidden = !video.quote;
  $('hn-comment').hidden = !video.quote;
  if (video.quote) $('hn-comment').href = `https://news.ycombinator.com/item?id=${video.quote.commentId}`;
  renderPlayerButtons(); $('player-dialog').showModal();
}
async function refresh(force = false) {
  if (busy || staleTab || storageBlocked || !key || !state.channels.length) return;
  if (!force && now() - lastRefreshAttempt < CACHE_TTL) return;
  lastRefreshAttempt = now(); busy = true; render(); renderChannels();
  try {
    const revision = stateRevision;
    const next = structuredClone(state);
    const errors = await refreshChannels(next, new YouTubeClient(key), { force, now: now() });
    const result = applyRefreshResult(state, next, revision, stateRevision);
    if (!result.applied) return;
    commitState(result.state);
    if (errors.length) notify(messages.en[errors[0].code] ? errors[0].code : 'unexpected', {}, true);
    else notify(force ? 'refreshed' : '');
  } catch (error) { showError(error); }
  finally { busy = false; render(); renderChannels(); }
}
function askConfirmation(message, action) {
  confirmation = { message, action }; $('confirm-text').textContent = text(message); $('confirm-dialog').showModal();
}
function resetFilters() {
  $('search').value = ''; $('area').value = ''; $('category').value = ''; $('duration').value = 'all'; $('hide-watched').checked = false;
  pageSize = 18; renderFilters(); render();
}

for (const view of ['discover', 'channels', 'later', 'watched', 'recommendations', 'community']) bind(`view-${view}`, 'click', () => changeMode(view));
for (const id of ['channels-open', 'hero-add', 'empty-add']) bind(id, 'click', openChannels);
bind('settings-open', 'click', openSettings);
bind('sidebar-toggle', 'click', () => { saveDiscovery({ ...discovery, collapsed: !discovery.collapsed }); applyLayout(); });
bind('player-similar', 'click', () => { const video = activeVideo; $('player-dialog').close(); if (video) discoveryPanel.similar(video); });
bind('hero-explore', 'click', () => { changeMode('discover'); $('feed').scrollIntoView(); });
bind('language', 'change', () => { const next = { ...preferences, language: $('language').value }; persist(() => store.writePreferences(next)); preferences = next; applyPreferences(); });
bind('theme', 'change', () => { const next = { ...preferences, theme: $('theme').value }; persist(() => store.writePreferences(next)); preferences = next; applyPreferences(); });
for (const id of ['area', 'category', 'duration', 'sort', 'hide-watched', 'channel-filter', 'channel-name-filter', 'channel-kind']) bind(id, 'change', () => { pageSize = 18; if (id === 'area') { $('category').value = ''; renderFilters(); } render(); });
bind('search', 'input', () => { pageSize = 18; render(); });
bind('reset-filters', 'click', resetFilters);
bind('show-more', 'click', () => { pageSize += 18; render(); });
bind('thumbnail-style','change',()=>{
  const next={...preferences,thumbnail:$('thumbnail-style').value};persist(()=>store.writePreferences(next));preferences=next;render();
});
bind('delete-selected','click',()=>confirmHide([...selectedVideos]));
bind('select-visible','change',()=>{for(const id of displayedVideoIds()) {if($('select-visible').checked)selectedVideos.add(id);else selectedVideos.delete(id);}render();});
bind('restore-hidden','click',()=>{const next={...library,hidden:[]};persist(()=>store.writeLibrary(next));library=next;render();notify('videosRestored');$('restore-hidden').disabled=true;});
window.addEventListener('hashchange',()=>{if(location.hash!=='#feed')changeMode(viewFromHash(location.hash));});
bind('expiry', 'change', () => { const next = { ...state, days: Number($('expiry').value) }; commitState(next); render(); });
bind('refresh', 'click', () => refresh(true));
bind('settings-form', 'submit', event => {
  event.preventDefault(); if (busy) throw new AppError('busy');
  const nextKey = $('api-key').value.trim();
  persist(() => store.saveKey(nextKey, $('remember-key').checked)); key = nextKey;
  $('settings-dialog').close(); notify('connectionReady'); render(); void refresh(true);
}, 'settings-error');
bind('forget-key', 'click', () => {
  if (busy) throw new AppError('busy'); persist(() => store.forgetKey()); key = ''; $('api-key').value = ''; $('remember-key').checked = false; notify('keyRemoved'); render();
}, 'settings-error');
bind('channel-form', 'submit', async event => {
  event.preventDefault(); if (busy) return;
  if (storageBlocked) throw new AppError('storageRead');
  if (!key) throw new AppError('keyRequired');
  if (state.channels.length >= 200) throw new AppError('channelLimit');
  busy = true; $('channel-error').textContent = ''; render(); renderChannels();
  let added = false;
  try {
    const channel = await new YouTubeClient(key).resolve($('channel-input').value);
    if (state.channels.some(c => c.id === channel.id)) throw new AppError('duplicateChannel');
    channel.category = $('channel-category').value.trim();
    const next = { ...state, channels: [...state.channels, channel] };
    commitState(next); added = true; $('channel-form').reset(); renderFilters();
  } finally { busy = false; render(); renderChannels(); }
  if (added) { lastRefreshAttempt = 0; await refresh(); }
}, 'channel-error');
bind('fetch-durations', 'click', async () => {
  if (!key) { openSettings(); return; }
  if (busy) return;
  metadata = store.readMetadata(now());
  const ids = filteredVideos(true).slice(0, Math.min(pageSize, 200)).filter(v => !metadata[v.id]).map(v => v.id);
  if (!ids.length) { notify('metadataLoaded'); return; }
  busy = true; render();
  try {
    const fetched = await new YouTubeClient(key).metadata(ids, now());
    const next = { ...metadata, ...fetched }; persist(() => store.writeMetadata(next)); metadata = next; notify('metadataLoaded');
  } finally { busy = false; render(); }
});
bind('export-data', 'click', () => {
  if (!store || storageBlocked) throw new AppError('storageRead');
  const blob = new Blob([JSON.stringify(store.exportData(now()), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = element('a'); link.href = url; link.download = 'personaltube-backup.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}, 'settings-error');
bind('import-data', 'change', async () => {
  const file = $('import-data').files[0]; $('import-data').value = '';
  if (!file) return;
  if (busy) throw new AppError('busy');
  validateBackupFile(file);
  const content = await file.text();
  try { parseBackup(JSON.parse(content)); } catch { throw new AppError('invalidBackup'); }
  askConfirmation('confirmImport', () => {
    if (busy) throw new AppError('busy');
    persist(() => store.importData(content, now()));
    stateRevision++;
    state = store.readState(now()); preferences = store.readPreferences(); library = store.readLibrary(); discovery = store.readDiscovery(); discoveryPanel.reset();
    applyPreferences(); notify('imported');
  });
}, 'settings-error');
bind('clear-data', 'click', () => {
  if (busy) throw new AppError('busy');
  askConfirmation('confirmClear', async () => {
    if (busy) throw new AppError('busy');
    if (!store) throw new AppError('storageWrite');
    await discoveryPanel.clearCommunity();
    stateRevision++;
    try { store.clearPersonalData(); } catch { throw new AppError('storageWrite'); }
    state = emptyState(); library = emptyLibrary(); metadata = {}; key = ''; preferences = parsePreferences(null); discovery = parseDiscovery(null); storageBlocked = false; staleTab = false; discoveryPanel.reset();
    $('api-key').value = ''; $('remember-key').checked = false; applyPreferences(); notify('cleared');
  });
}, 'settings-error');
bind('confirm-yes', 'click', async () => { const action = confirmation?.action; $('confirm-dialog').close(); await action?.(); }, 'settings-error');
bind('player-later', 'click', () => toggleSaved('later', activeVideo.id, activeVideo));
bind('player-watched', 'click', () => toggleSaved('watched', activeVideo.id, activeVideo));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
$('player-dialog').addEventListener('close', () => { $('player-container').replaceChildren(); activeVideo = null; });
$('settings-dialog').addEventListener('close', () => { $('api-key').value = ''; });
$('confirm-dialog').addEventListener('close', () => { confirmation = null; });
document.addEventListener('keydown', event => {
  if (event.key === '/' && !document.querySelector('dialog[open]') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) { event.preventDefault(); $('search').focus(); }
});
window.addEventListener('offline', () => notify('offline'));
window.addEventListener('storage', event => {
  if (event.key === null || event.key.startsWith('personaltube.')) {
    staleTab = true; stateRevision++; notify('storageConflict', {}, true);
  }
});
window.addEventListener('online', () => { notify(); void refresh(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); void refresh(); } });
setInterval(() => { if (!document.hidden) { render(); void refresh(); } }, 60000);

discoveryPanel = createDiscoveryPanel({
  context: () => ({ language: preferences.language, mode, discovery, library, metadata, areas: catalog.areas, thumbnailStyle: preferences.thumbnail, onHide: confirmHide, onSelect: selectVideo, selectedVideos, query: $('search').value, busy, hasKey: Boolean(key), stale: staleTab || storageBlocked }),
  saveDiscovery, setBusy: value => { busy = value; render(); renderChannels(); },
  client: () => new YouTubeClient(key), openSettings, onPlay: play, onToggle: toggleSaved,
  onFollow: video => { openChannels(); $('channel-input').value = video.channelId; $('channel-category').value = discovery.recommendations.query.slice(0,60); },
  onError: showError, confirm: askConfirmation, changeMode,
});
setupPanel = createSetupPanel({context:()=>({language:preferences.language,hasKey:Boolean(key),storageReady:!storageBlocked&&!staleTab,busy}),openYouTube:openSettings,onError:showError,finish:()=>{const next={...preferences,setupDone:true};persist(()=>store.writePreferences(next));preferences=next;}});
discoveryPanel.hydrate();
applyPreferences();
try {
  const response = await fetch('/catalog.json');
  if (!response.ok) throw new AppError('invalidCatalog');
  const data = await response.json();
  if (data.version !== 1 || !Array.isArray(data.videos) || !Array.isArray(data.areas) || data.videos.some(v => !videoPattern.test(v.id))) throw new AppError('invalidCatalog');
  catalog = data;
} catch { notify('invalidCatalog', {}, true); }
loading = false; renderFilters(); render(); void refresh();
if(!preferences.setupDone)setupPanel.open();
