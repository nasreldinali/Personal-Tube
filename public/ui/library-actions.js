import { hideVideos } from '../domain/panel-actions.js';
import { toggleLibrary } from '../domain/library.js';
import { refreshSettings } from '../domain/preferences.js';
import { AppError } from '../domain/errors.js';
import { number } from '../locale.js';
import { byId as $ } from './dom.js';

export function createLibraryActions({ text, readPreferences, readLibrary, readMetadata, readState, readMode, isBusy, isStale, discoveryVideos, filteredVideos, saveLibrary, saveMetadata, savePreferences, now, render, renderPlayerButtons, askConfirmation, showError, notify, bind }) {
  const selectedVideos = new Set();
  let selectionMode = false;
  function panelVideos() {
    return (['recommendations','community'].includes(readMode()) ? discoveryVideos() : filteredVideos()).filter(v=>!(readLibrary().hidden||[]).includes(v.id));
  }
  function displayedVideoIds() { return [...new Set([...document.querySelectorAll('.video-card[data-video-id]')].filter(node=>node.getClientRects().length).map(node=>node.dataset.videoId))]; }
  function renderPanelTools() {
    const lang=readPreferences().language;
    const channelMode=readMode()==='channels';
    const videos=panelVideos();
    const available = new Set(videos.map(v=>v.id));
    for(const id of selectedVideos) if(!available.has(id)) selectedVideos.delete(id);
    $('delete-selected').disabled = !selectedVideos.size || isBusy() || isStale();
    $('delete-selected').textContent = text('deleteSelected',{count:number(lang,selectedVideos.size)});
    const displayed=displayedVideoIds();
    document.documentElement.dataset.selecting = String(selectionMode);
    $('select-toggle').hidden = selectionMode;
    $('select-toggle').disabled = !displayed.length;
    $('selection-actions').hidden = !selectionMode;
    $('selection-count').textContent = text('selectionCount',{count:number(lang,selectedVideos.size)});
    $('select-visible').textContent = text(displayed.length > 0 && displayed.every(id=>selectedVideos.has(id)) ? 'clearShownSelection' : 'selectAllShown');
    $('select-visible').disabled = !displayed.length;
    $('channel-help').hidden = !channelMode;
    $('channel-refresh-help').hidden = !channelMode;
    const refreshPolicy = refreshSettings(readPreferences());
    $('channel-refresh-help').textContent = text(refreshPolicy.mode === 'manual' ? 'refreshManualHelp' : 'refreshAutoHelp', {interval:text(`refreshInterval${refreshPolicy.minutes}`)});
    $('thumbnail-style').value = readPreferences().thumbnail || 'frame';
    $('channel-sample-help').hidden = !channelMode || !Object.values(readState().cache).some(entry=>entry.limited);
    $('shorts-help').hidden = !channelMode || $('channel-kind').value === 'all';
    $('channel-details').hidden = $('channel-sample-help').hidden && $('shorts-help').hidden;
    }
  function selectVideo(id, selected) {
    if (selected) selectedVideos.add(id); else selectedVideos.delete(id);
    render();
    [...document.querySelectorAll('.video-card[data-video-id]')].find(node=>node.dataset.videoId===id && node.getClientRects().length)?.querySelector('.card-select input')?.focus();
  }
  function confirmHide(ids) {
    askConfirmation('confirmHideVideos', () => {
      if (isBusy()) throw new AppError('busy');
      const next = hideVideos(readLibrary(), ids); saveLibrary(next);selectedVideos.clear();render();notify('videosHidden');
    });
  }
  function toggleSaved(field, id, video) {
    try {
      const next = toggleLibrary(readLibrary(), field, id);
      if (video && !readLibrary()[field].includes(id)) {
        const nextMetadata = { ...readMetadata(), [id]: { ...readMetadata()[id], title: video.title, channelTitle: video.channelTitle, duration: video.duration || '', embeddable: video.embeddable !== false, fetchedAt: now() } };
        saveMetadata(nextMetadata);
      }
      saveLibrary(next);
      render(); renderPlayerButtons();
      document.querySelector(`[data-video-id="${id}"][data-action="${field}"]`)?.focus();
    } catch (error) { showError(error); }
  }
  bind('thumbnail-style','change',()=>{
    const next={...readPreferences(),thumbnail:$('thumbnail-style').value};savePreferences(next);render();
  });
  bind('delete-selected','click',()=>confirmHide([...selectedVideos]));
  bind('select-toggle','click',()=>{selectionMode=true;renderPanelTools();$('select-visible').focus();});
  bind('selection-cancel','click',()=>{selectionMode=false;selectedVideos.clear();render();$('select-toggle').focus();});
  bind('select-visible','click',()=>{const ids=displayedVideoIds();const clear=ids.every(id=>selectedVideos.has(id));for(const id of ids) {if(clear)selectedVideos.delete(id);else selectedVideos.add(id);}render();$('select-visible').focus();});
  bind('restore-hidden','click',()=>{const next={...readLibrary(),hidden:[]};saveLibrary(next);render();notify('videosRestored');$('restore-hidden').disabled=true;});
  function resetSelection() { selectedVideos.clear(); selectionMode = false; }
  return { selectedVideos, renderPanelTools, selectVideo, confirmHide, toggleSaved, resetSelection };
}
