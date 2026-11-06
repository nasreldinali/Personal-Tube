import { AppError } from '../domain/errors.js';
import { safeImage } from '../domain/feed.js';
import { removeCategory } from '../domain/panel-actions.js';
import { byId as $, element } from './dom.js';

export function createChannelManager({ text, readState, readKey, isBusy, isStale, isStorageBlocked, commitState, renderFilters, render, showError, notify, askConfirmation, bind, youtubeClient, refreshAdded }) {
  let addingChannel = false;
  function renderChannels() {
    $('channel-list').replaceChildren();
    renderCategoryManager();
    if (!readState().channels.length) $('channel-list').append(element('p', 'muted', text('noChannels')));
    for (const channel of readState().channels) {
      const row = element('div', 'channel-row');
      const image = safeImage(channel.image);
      const avatar = element(image ? 'img' : 'span', 'avatar');
      if (image) { avatar.src = image; avatar.alt = ''; } else avatar.setAttribute('aria-hidden', 'true');
      const details = element('div', 'channel-details');
      const title = element('strong', '', channel.title); title.dir = 'auto';
      const input = element('input', 'd-input'); input.value = channel.category; input.maxLength = 60; input.disabled = isBusy() || isStorageBlocked();
      input.setAttribute('aria-label', text('channelCategory', { title: channel.title })); input.setAttribute('list', 'categories-list');
      input.addEventListener('change', () => {
        try {
          const next = { ...readState(), channels: readState().channels.map(c => c.id === channel.id ? { ...c, category: input.value.trim() } : c) };
          commitState(next); renderFilters(); render();
        } catch (error) { input.value = channel.category; showError(error, 'channel-error'); }
      });
      const remove = element('button', 'text-button', text('delete')); remove.disabled = isBusy() || isStorageBlocked();
      remove.setAttribute('aria-label', text('removeChannel', { title: channel.title }));
      remove.addEventListener('click', () => askConfirmation('confirmRemoveChannel', () => {
        try {
          if (isBusy()) throw new AppError('busy');
          const cache = { ...readState().cache }; delete cache[channel.id];
          const next = { ...readState(), channels: readState().channels.filter(c => c.id !== channel.id), cache };
          commitState(next); renderFilters(); renderChannels(); render(); notify('channelRemoved');
        } catch (error) { showError(error, 'channel-error'); }
      }));
      details.append(title, input); row.append(avatar, details, remove); $('channel-list').append(row);
    }
  }
  function renderCategoryManager() {
    const categories = [...new Set(readState().channels.map(c=>c.category).filter(Boolean))];
    $('category-manager').replaceChildren(...categories.map(category=>{
      const row=element('div','category-row'); const title=element('span','',category);title.dir='auto';
      const remove=element('button','text-button',text('delete'));remove.disabled=isBusy()||isStorageBlocked();remove.setAttribute('aria-label',text('removeCategory',{category}));
      remove.addEventListener('click',()=>askConfirmation('confirmRemoveCategory',()=>{
        if(isBusy())throw new AppError('busy');commitState(removeCategory(readState(),category));renderFilters();renderChannels();render();
      }));row.append(title,remove);return row;
    }));
  }
  function openChannels() { $('channel-error').textContent = ''; renderChannels(); $('channels-dialog').showModal(); }
  for (const id of ['channels-open', 'hero-add', 'empty-add']) bind(id, 'click', openChannels);
  bind('channel-form', 'submit', async event => {
    event.preventDefault(); if (addingChannel) return;
    if (isStorageBlocked()) throw new AppError('storageRead');
    if (isStale()) throw new AppError('storageConflict');
    if (!readKey()) throw new AppError('keyRequired');
    if (readState().channels.length >= 200) throw new AppError('channelLimit');
    const channels = readState().channels, requestKey = readKey();
    const input = $('channel-input').value, category = $('channel-category').value.trim();
    addingChannel = true; $('channel-error').textContent = ''; $('channel-status').textContent = ''; render();
    let added;
    try {
      const channel = await youtubeClient().resolve(input);
      if (channels !== readState().channels || requestKey !== readKey()) throw new AppError('channelChanged');
      if (readState().channels.some(c => c.id === channel.id)) throw new AppError('duplicateChannel');
      channel.category = category;
      commitState({ ...readState(), channels: [...readState().channels, channel] });
      added = channel; $('channel-form').reset(); renderFilters();
      $('channel-status').textContent = text('channelAdded', { title: channel.title });
    } finally { addingChannel = false; render(); renderChannels(); }
    if (added) { refreshAdded(added.id); }
  }, 'channel-error');
  function renderAddState() {
  $('add-channel').disabled = addingChannel || isStorageBlocked() || isStale();
  $('add-channel').textContent = text(addingChannel ? 'adding' : 'addChannel');
  $('channel-form').setAttribute('aria-busy', String(addingChannel));
  }
  return { renderChannels, openChannels, renderAddState, isAddingChannel: () => addingChannel };
}
