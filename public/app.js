import { createLibraryFeed } from './ui/library-feed.js';
import { createLibraryActions } from './ui/library-actions.js';
import { createDataTransfer } from './ui/data-transfer.js';
import { createSettingsPanel } from './ui/settings-panel.js';
import { createChannelManager } from './ui/channel-manager.js';
import { createVideoPlayer } from './ui/video-player.js';
import { createFeedbackPanel } from './ui/feedback-panel.js';
import { videoPattern } from './config.js';
import { emptyState } from './domain/feed.js';
import { emptyLibrary } from './domain/library.js';
import { parsePreferences, preferenceAttributes, refreshSettings, automaticRefreshDue } from './domain/preferences.js';
import { AppError } from './domain/errors.js';
import { BrowserStore } from './data/browser-store.js';
import { YouTubeUsage, USAGE_KEY, USAGE_FAILURE_KEY } from './data/youtube-usage.js';
import { YouTubeClient } from './data/youtube.js';
import { refreshChannels } from './services/refresh.js';
import { applyRefreshResult } from './services/refresh-result.js';
import { t, messages } from './locale.js';
import { byId as $, translatePage } from './ui/dom.js';
import { parseDiscovery } from './domain/discovery.js';
import { createDiscoveryPanel } from './ui/discovery-panel.js';
import { viewFromHash } from './domain/panel-actions.js';
import { createSetupPanel } from './ui/setup-panel.js';

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
let usage;
let storageBlocked = false;
let staleTab = false;
let lastRefreshAttempt = null;
let mode = viewFromHash(location.hash);
const text = (name, values) => t(preferences.language, name, values);
const now = () => Date.now();

try {
  store = new BrowserStore(localStorage, sessionStorage);
  usage = new YouTubeUsage(localStorage, now, navigator.locks);
  state = store.readState(now());
  preferences = store.readPreferences();
  library = store.readLibrary();
  discovery = store.readDiscovery();
  metadata = store.readMetadata(now());
  key = store.readKey();
} catch { storageBlocked = true; }

function youtubeClient() {
  return new YouTubeClient(key, undefined, { onRequest: async resource => { await usage?.record(resource); renderUsage(); } });
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
function saveDiscovery(next) {
  persist(() => store.writeDiscovery(next)); discovery = next;
}
async function refresh(force = false, channelId = null) {
  if (busy || staleTab || storageBlocked || !key || !state.channels.length) return;
  if (!force && !automaticRefreshDue(preferences, lastRefreshAttempt, now(), !document.hidden)) return;
  const policy = refreshSettings(preferences);
  const refreshPreferences = preferences;
  lastRefreshAttempt = now(); busy = true; render(); renderChannels();
  try {
    const revision = stateRevision;
    const next = structuredClone(state);
    const errors = await refreshChannels(next, youtubeClient(), { force, channelId, now: now(), preferences: refreshPreferences, shouldContinue: () => revision === stateRevision && !staleTab && !storageBlocked && (force || (!document.hidden && refreshSettings(preferences).mode === 'auto' && refreshSettings(preferences).minutes === policy.minutes)) });
    const result = applyRefreshResult(state, next, revision, stateRevision);
    if (!result.applied) return;
    commitState(result.state);
    if (errors.length) notify(messages.en[errors[0].code] ? errors[0].code : 'unexpected', {}, true);
    else notify(force ? 'refreshed' : '');
  } catch (error) { showError(error); }
  finally { busy = false; render(); renderChannels(); }
}

const { notify, renderNotice, showError, askConfirmation, renderConfirmation } = createFeedbackPanel({ text, isStale: () => staleTab, isStorageBlocked: () => storageBlocked, bind });
const { renderPlayerButtons, play } = createVideoPlayer({ text, readLibrary: () => library, readMetadata: () => metadata, showError, bind, toggleSaved: (...args) => toggleSaved(...args), onSimilar: video => discoveryPanel.similar(video) });
const { renderChannels, openChannels, renderAddState } = createChannelManager({ text, readState: () => state, readKey: () => key, isBusy: () => busy, isStale: () => staleTab, isStorageBlocked: () => storageBlocked, commitState, renderFilters: () => renderFilters(), render: () => render(), showError, notify, askConfirmation, bind, youtubeClient: () => youtubeClient(), refreshAdded: id => { lastRefreshAttempt = null; void refresh(false, id); } });
const { renderUsage, openSettings } = createSettingsPanel({
  text, readPreferences: () => preferences, readUsage: () => usage?.snapshot(), hiddenCount: () => (library.hidden || []).length,
  readKey: () => key, remembersKey: () => store?.remembersKey() || false,
  saveKey: (value, remember) => { persist(() => store.saveKey(value, remember)); key = value; },
  forgetKey: () => { persist(() => store.forgetKey()); key = ''; },
  savePreferences: next => { persist(() => store.writePreferences(next)); preferences = next; },
  isBusy: () => busy, bind, render: () => render(), notify, refresh: () => refresh(),
});
createDataTransfer({
  hasStore: () => Boolean(store), isStorageBlocked: () => storageBlocked, isBusy: () => busy,
  exportData: timestamp => store.exportData(timestamp), importData: (content, timestamp) => persist(() => store.importData(content, timestamp)),
  reloadImportedData: () => {
    stateRevision++;
    state = store.readState(now()); preferences = store.readPreferences(); library = store.readLibrary(); discovery = store.readDiscovery(); discoveryPanel.reset();
  },
  clearPersonalData: () => {
    stateRevision++;
    try { store.clearPersonalData(); usage = new YouTubeUsage(localStorage, now, navigator.locks); } catch { throw new AppError('storageWrite'); }
    state = emptyState(); library = emptyLibrary(); metadata = {}; key = ''; preferences = parsePreferences(null); discovery = parseDiscovery(null); storageBlocked = false; staleTab = false; discoveryPanel.reset();
  },
  clearCommunity: () => discoveryPanel.clearCommunity(), now, bind, askConfirmation, applyPreferences: () => applyPreferences(), notify,
});
const { selectedVideos, renderPanelTools, selectVideo, confirmHide, toggleSaved, resetSelection } = createLibraryActions({
  text, readPreferences: () => preferences, readLibrary: () => library, readMetadata: () => metadata, readState: () => state, readMode: () => mode,
  isBusy: () => busy, isStale: () => staleTab, discoveryVideos: () => discoveryPanel.visibleVideos(), filteredVideos: (...args) => filteredVideos(...args),
  saveLibrary: next => { persist(() => store.writeLibrary(next)); library = next; },
  saveMetadata: next => { persist(() => store.writeMetadata(next)); metadata = next; },
  savePreferences: next => { persist(() => store.writePreferences(next)); preferences = next; },
  now, render: () => render(), renderPlayerButtons, askConfirmation, showError, notify, bind,
});
const { render, renderFilters, filteredVideos, getPageSize, resetPageSize } = createLibraryFeed({
  text, now, readPreferences: () => preferences, readState: () => state, readLibrary: () => library, readMetadata: () => metadata,
  readCatalog: () => catalog, readMode: () => mode, isLoading: () => loading, isBusy: () => busy, isStorageBlocked: () => storageBlocked, hasKey: () => Boolean(key),
  discoveryVideos: () => discoveryPanel?.videos() || [],
  renderPanels: () => { discoveryPanel?.render(); renderPanelTools(); setupPanel?.render(); renderAddState(); renderUsage(); },
  renderPanelTools, renderNotice, play, toggleSaved, confirmHide, selectVideo, isSelected: id => selectedVideos.has(id), bind, commitState,
});
bind('refresh', 'click', () => refresh(true));
bind('fetch-durations', 'click', async () => {
  if (!key) { openSettings(); return; }
  if (busy) return;
  metadata = store.readMetadata(now());
  const ids = filteredVideos(true).slice(0, Math.min(getPageSize(), 200)).filter(v => !metadata[v.id]).map(v => v.id);
  if (!ids.length) { notify('metadataLoaded'); return; }
  busy = true; render();
  try {
    const fetched = await youtubeClient().metadata(ids, now());
    const next = { ...metadata, ...fetched }; persist(() => store.writeMetadata(next)); metadata = next; notify('metadataLoaded');
  } finally { busy = false; render(); }
});
window.addEventListener('offline', () => notify('offline'));
window.addEventListener('storage', event => {
  if (event.key === USAGE_KEY || event.key === USAGE_FAILURE_KEY) { renderUsage(); return; }
  if (event.key === null || event.key.startsWith('personaltube.')) {
    staleTab = true; stateRevision++; notify('storageConflict', {}, true);
  }
});
window.addEventListener('online', () => { notify(); void refresh(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); void refresh(); } });
setInterval(() => { if (!document.hidden) { render(); void refresh(); } }, 60000);

function createNavigationPanel({
  text, readPreferences, readDiscovery, savePreferences, saveDiscovery, setMode, resetPageSize, resetSelection,
  renderFilters, render, renderChannels, renderPlayerButtons, renderConfirmation, bind,
}) {
  function applyLayout() {
    document.documentElement.dataset.collapsed = String(readDiscovery().collapsed);
    const label = text(readDiscovery().collapsed ? 'expandSidebar' : 'collapseSidebar');
    $('sidebar-toggle').setAttribute('aria-expanded', String(!readDiscovery().collapsed));
    $('sidebar-toggle').setAttribute('aria-label', label); $('sidebar-toggle').title = label;
    $('sidebar-toggle').lastElementChild.textContent = label;
    document.querySelectorAll('.d-nav button').forEach(button => {
      const key = button.querySelector('[data-i18n]')?.dataset.i18n;
      if (key) { button.setAttribute('aria-label', text(key)); button.title = text(key); }
    });
  }
  function applyPreferences() {
    const attrs = preferenceAttributes(readPreferences());
    document.documentElement.lang = attrs.lang;
    document.documentElement.dir = attrs.dir;
    if (attrs.theme) document.documentElement.dataset.theme = attrs.theme;
    else delete document.documentElement.dataset.theme;
    translatePage(readPreferences().language);
    $('language').value = readPreferences().language;
    $('theme').value = readPreferences().theme;
    applyLayout(); renderFilters(); render(); renderChannels(); renderPlayerButtons();
    renderConfirmation();
  }
  function changeMode(value) {
    setMode(value); history.replaceState(null,'',`#${value}`); resetPageSize(); resetSelection();
    $('search').value = ''; $('area').value = ''; $('category').value = ''; $('duration').value = 'all'; $('hide-watched').checked = false;
    renderFilters(); render();
  }
  for (const view of ['discover', 'channels', 'later', 'watched', 'recommendations', 'community']) bind(`view-${view}`, 'click', () => changeMode(view));
  bind('sidebar-toggle', 'click', () => { saveDiscovery({ ...readDiscovery(), collapsed: !readDiscovery().collapsed }); applyLayout(); });
  bind('hero-explore', 'click', () => { changeMode('discover'); $('feed').scrollIntoView(); });
  bind('language', 'change', () => { const next = { ...readPreferences(), language: $('language').value }; savePreferences(next); applyPreferences(); });
  bind('theme', 'change', () => { const next = { ...readPreferences(), theme: $('theme').value }; savePreferences(next); applyPreferences(); });
  window.addEventListener('hashchange',()=>{if(location.hash!=='#feed')changeMode(viewFromHash(location.hash));});
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !document.querySelector('dialog[open]') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) { event.preventDefault(); $('search').focus(); }
  });
  return { applyPreferences, applyLayout, changeMode };
}

const { applyPreferences, changeMode } = createNavigationPanel({
  text, readPreferences: () => preferences, readDiscovery: () => discovery,
  savePreferences: next => { persist(() => store.writePreferences(next)); preferences = next; }, saveDiscovery,
  setMode: value => { mode = value; }, resetPageSize, resetSelection, renderFilters, render, renderChannels, renderPlayerButtons, renderConfirmation, bind,
});
discoveryPanel = createDiscoveryPanel({
  context: () => ({ language: preferences.language, mode, discovery, library, metadata, areas: catalog.areas, thumbnailStyle: preferences.thumbnail, onHide: confirmHide, onSelect: selectVideo, selectedVideos, query: $('search').value, busy, hasKey: Boolean(key), stale: staleTab || storageBlocked }),
  saveDiscovery, setBusy: value => { busy = value; render(); renderChannels(); },
  client: () => youtubeClient(), openSettings, onPlay: play, onToggle: toggleSaved,
  onFollow: video => { openChannels(); $('channel-input').value = video.channelId; $('channel-category').value = discovery.recommendations.query.slice(0,60); },
  onError: showError, confirm: askConfirmation, changeMode,
});
setupPanel = createSetupPanel({context:()=>({language:preferences.language,hasKey:Boolean(key),storageReady:!storageBlocked&&!staleTab,busy}),openYouTube:openSettings,onError:showError,finish:()=>{if(preferences.setupDone)return;const next={...preferences,setupDone:true};persist(()=>store.writePreferences(next));preferences=next;}});
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
