import { createFeedUpdates } from './data/feed-updates.js';
import { createNavigationPanel } from './ui/navigation-panel.js';
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
import { parsePreferences } from './domain/preferences.js';
import { AppError } from './domain/errors.js';
import { BrowserStore } from './data/browser-store.js';
import { YouTubeUsage, USAGE_KEY, USAGE_FAILURE_KEY } from './data/youtube-usage.js';
import { t } from './locale.js';
import { byId as $ } from './ui/dom.js';
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

const { notify, renderNotice, showError, askConfirmation, renderConfirmation } = createFeedbackPanel({ text, isStale: () => staleTab, isStorageBlocked: () => storageBlocked, bind });
const { renderPlayerButtons, play } = createVideoPlayer({ text, readLibrary: () => library, readMetadata: () => metadata, showError, bind, toggleSaved: (...args) => toggleSaved(...args), onSimilar: video => discoveryPanel.similar(video) });
const { renderChannels, openChannels, renderAddState } = createChannelManager({ text, readState: () => state, readKey: () => key, isBusy: () => busy, isStale: () => staleTab, isStorageBlocked: () => storageBlocked, commitState, renderFilters: () => renderFilters(), render: () => render(), showError, notify, askConfirmation, bind, youtubeClient: () => youtubeClient(), refreshAdded: id => { resetRefreshAttempt(); void refresh(false, id); } });
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
window.addEventListener('offline', () => notify('offline'));
window.addEventListener('storage', event => {
  if (event.key === USAGE_KEY || event.key === USAGE_FAILURE_KEY) { renderUsage(); return; }
  if (event.key === null || event.key.startsWith('personaltube.')) {
    staleTab = true; stateRevision++; notify('storageConflict', {}, true);
  }
});

const { applyPreferences, changeMode } = createNavigationPanel({
  text, readPreferences: () => preferences, readDiscovery: () => discovery,
  savePreferences: next => { persist(() => store.writePreferences(next)); preferences = next; }, saveDiscovery,
  setMode: value => { mode = value; }, resetPageSize, resetSelection, renderFilters, render, renderChannels, renderPlayerButtons, renderConfirmation, bind,
});
const { youtubeClient, refresh, resetRefreshAttempt } = createFeedUpdates({
  readKey: () => key, readState: () => state, readRevision: () => stateRevision, readPreferences: () => preferences, readMetadata: () => metadata,
  reloadMetadata: () => { metadata = store.readMetadata(now()); }, saveMetadata: next => { persist(() => store.writeMetadata(next)); metadata = next; },
  recordUsage: resource => usage?.record(resource), isBusy: () => busy, setBusy: value => { busy = value; }, isStale: () => staleTab, isStorageBlocked: () => storageBlocked,
  now, render, renderChannels, renderUsage, notify, showError, commitState, filteredVideos, getPageSize, openSettings, bind,
});
discoveryPanel = createDiscoveryPanel({
  context: () => ({ language: preferences.language, mode, discovery, library, metadata, areas: catalog.areas, thumbnailStyle: preferences.thumbnail, onHide: confirmHide, onSelect: selectVideo, selectedVideos, query: $('search').value, busy, hasKey: Boolean(key), stale: staleTab || storageBlocked }),
  saveDiscovery, setBusy: value => { busy = value; render(); renderChannels(); },
  client: () => youtubeClient(), openSettings, onPlay: play, onToggle: toggleSaved,
  onFollow: video => { openChannels(); $('channel-input').value = video.channelId; $('channel-category').value = discovery.recommendations.query.slice(0,60); },
  onError: showError, confirm: askConfirmation, changeMode,
});
setupPanel = createSetupPanel({confirm:askConfirmation,context:()=>({language:preferences.language,hasKey:Boolean(key),storageReady:!storageBlocked&&!staleTab,busy}),openYouTube:openSettings,onError:showError,finish:()=>{if(preferences.setupDone)return;const next={...preferences,setupDone:true};persist(()=>store.writePreferences(next));preferences=next;}});
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
