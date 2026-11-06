import { YouTubeClient } from './youtube.js';
import { automaticRefreshDue, refreshSettings } from '../domain/preferences.js';
import { refreshChannels } from '../services/refresh.js';
import { applyRefreshResult } from '../services/refresh-result.js';
import { messages } from '../locale.js';

export function createFeedUpdates({
  readKey, readState, readRevision, readPreferences, readMetadata, reloadMetadata, saveMetadata, recordUsage,
  isBusy, setBusy, isStale, isStorageBlocked, now, render, renderChannels, renderUsage, notify, showError,
  commitState, filteredVideos, getPageSize, openSettings, bind,
  createClient = (key, onRequest) => new YouTubeClient(key, undefined, { onRequest }),
}) {
  let lastRefreshAttempt = null;
  function youtubeClient() {
    return createClient(readKey(), async resource => { await recordUsage(resource); renderUsage(); });
  }
  async function refresh(force = false, channelId = null) {
    if (isBusy() || isStale() || isStorageBlocked() || !readKey() || !readState().channels.length) return;
    if (!force && !automaticRefreshDue(readPreferences(), lastRefreshAttempt, now(), !document.hidden)) return;
    const policy = refreshSettings(readPreferences());
    const refreshPreferences = readPreferences();
    lastRefreshAttempt = now(); setBusy(true); render(); renderChannels();
    try {
      const revision = readRevision();
      const next = structuredClone(readState());
      const errors = await refreshChannels(next, youtubeClient(), { force, channelId, now: now(), preferences: refreshPreferences, shouldContinue: () => revision === readRevision() && !isStale() && !isStorageBlocked() && (force || (!document.hidden && refreshSettings(readPreferences()).mode === 'auto' && refreshSettings(readPreferences()).minutes === policy.minutes)) });
      const result = applyRefreshResult(readState(), next, revision, readRevision());
      if (!result.applied) return;
      commitState(result.state);
      if (errors.length) notify(messages.en[errors[0].code] ? errors[0].code : 'unexpected', {}, true);
      else notify(force ? 'refreshed' : '');
    } catch (error) { showError(error); }
    finally { setBusy(false); render(); renderChannels(); }
  }
  bind('refresh', 'click', () => refresh(true));
  async function fetchDurations() {
    if (!readKey()) { openSettings(); return; }
    if (isBusy()) return;
    reloadMetadata();
    const ids = filteredVideos(true).slice(0, Math.min(getPageSize(), 200)).filter(v => !readMetadata()[v.id]).map(v => v.id);
    if (!ids.length) { notify('metadataLoaded'); return; }
    setBusy(true); render();
    try {
      const fetched = await youtubeClient().metadata(ids, now());
      const next = { ...readMetadata(), ...fetched }; saveMetadata(next); notify('metadataLoaded');
    } finally { setBusy(false); render(); }
  }
  window.addEventListener('online', () => { notify(); void refresh(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); void refresh(); } });
  setInterval(() => { if (!document.hidden) { render(); void refresh(); } }, 60000);
  bind('fetch-durations', 'click', fetchDurations);
  function resetRefreshAttempt() { lastRefreshAttempt = null; }
  return { youtubeClient, refresh, resetRefreshAttempt, fetchDurations };
}
