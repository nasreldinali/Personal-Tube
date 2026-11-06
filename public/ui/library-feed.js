import { visibleVideos, channelVideos } from '../domain/feed.js';
import { selectCatalog } from '../domain/catalog.js';
import { categoryLabels } from '../category-labels.js';
import { number, areaName, dateLabel } from '../locale.js';
import { byId as $, element, selectOptions } from './dom.js';
import { createVideoCard } from './feed-view.js';

export function createLibraryFeed({
  text, now, readPreferences, readState, readLibrary, readMetadata, readCatalog, readMode,
  isLoading, isBusy, isStorageBlocked, hasKey, discoveryVideos, renderPanels, renderPanelTools, renderNotice,
  play, toggleSaved, confirmHide, selectVideo, isSelected, bind, commitState,
}) {
  let pageSize = 18;
  function renderFilters() {
    const lang = readPreferences().language;
    selectOptions($('area'), [['', text('allTopics')], ...readCatalog().areas.map(a => [a.id, areaName(lang, a.id, a.name)])], $('area').value);
    const areas = readCatalog().areas.filter(a => !$('area').value || a.id === $('area').value);
    selectOptions($('category'), [['', text('allCategories')], ...areas.flatMap(a => a.categories.map(c => [c.id, lang === 'ar' ? categoryLabels[c.id] || c.name : c.name]))], $('category').value);
    const categories = [...new Set(readState().channels.map(c => c.category).filter(Boolean))];
    selectOptions($('channel-filter'), [['', text('allCategories')], ...categories.map(c => [c, c])], $('channel-filter').value);
    const channels = readState().channels.filter(c => !$('channel-filter').value || c.category === $('channel-filter').value);
    selectOptions($('channel-name-filter'), [['', text('allChannels')], ...channels.map(c => [c.id, c.title])], $('channel-name-filter').value);
    $('categories-list').replaceChildren(...categories.map(c => { const option = element('option'); option.value = c; return option; }));
  }
  function latestVideos() {
    return visibleVideos(readState(), { now: now(), category: $('channel-filter').value, channelId: $('channel-name-filter').value, kind: $('channel-kind').value, query: $('search').value.trim() }).map(v => ({ ...v, channelTitle: v.channel.title, channelCategory: v.channel.category, categories: [], tags: [] }));
  }
  function allLibraryVideos() {
    const byId = new Map(readCatalog().videos.map(video => [video.id, video]));
    for (const channel of readState().channels) {
      for (const video of channelVideos(readState().cache[channel.id])) if (!byId.has(video.id)) byId.set(video.id, { ...video, channelTitle: channel.title, channelCategory: channel.category, categories: [], tags: [] });
    }
    for (const video of discoveryVideos()) if (!byId.has(video.id)) byId.set(video.id, video);
    for (const id of [...readLibrary().later, ...readLibrary().watched]) {
      if (!byId.has(id)) byId.set(id, { id, title: typeof readMetadata()[id]?.title === 'string' ? readMetadata()[id].title : `YouTube · ${id}`, channelTitle: typeof readMetadata()[id]?.channelTitle === 'string' ? readMetadata()[id].channelTitle : 'YouTube', categories: [], tags: [], summary: '' });
    }
    return [...byId.values()];
  }
  function filteredVideos(ignoreLength = false) {
    if (readMode() === 'channels') return latestVideos().filter(v => !$('hide-watched').checked || !readLibrary().watched.includes(v.id));
    return selectCatalog(readMode() === 'discover' ? readCatalog().videos : allLibraryVideos(), {
      mode: readMode(), query: $('search').value, area: $('area').value, category: $('category').value,
      duration: ignoreLength ? 'all' : $('duration').value, sort: $('sort').value,
      day: new Intl.DateTimeFormat('en-CA').format(new Date()),
      library: readLibrary(), metadata: readMetadata(), hideWatched: $('hide-watched').checked,
    });
  }
  function render() {
    const lang = readPreferences().language;
    const channelMode = readMode() === 'channels';
    const titles = { discover: ['discoverTitle', 'discoverDescription'], channels: ['channelsTitle', 'channelsDescription'], later: ['laterTitle', 'laterDescription'], watched: ['watchedTitle', 'watchedDescription'] };
    document.querySelectorAll('[data-view]').forEach(button => {
      if (button.dataset.view === readMode()) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    $('current-view').textContent = text(readMode());
    $('current-view').dir = lang === 'ar' ? 'rtl' : 'ltr';
    $('hero').hidden = readMode() !== 'discover'; $('stats').hidden = readMode() !== 'discover';
    $('catalog-count').textContent = isLoading() ? '—' : number(lang, readCatalog().videos.length);
    $('topic-count').textContent = isLoading() ? '—' : number(lang, readCatalog().areas.reduce((sum, area) => sum + area.categories.length, 0));
    for (const id of ['channel-count', 'nav-channels-count']) $(id).textContent = number(lang, readState().channels.length);
    $('nav-later-count').textContent = number(lang, readLibrary().later.length);
    const discoveryMode = ['recommendations', 'community'].includes(readMode());
    $('feed').hidden = discoveryMode;
    renderPanels();
    if (discoveryMode) { renderNotice(); return; }
    $('feed-title').textContent = text(titles[readMode()][0]);
    $('feed-description').textContent = text(titles[readMode()][1]);
    $('catalog-filters').hidden = channelMode; $('channel-filters').hidden = !channelMode;
    $('expiry').value = String(readState().days);
    $('refresh').hidden = !channelMode;
    $('refresh').disabled = isBusy() || isStorageBlocked() || !hasKey() || !readState().channels.length;
    $('refresh').textContent = text(isBusy() ? 'refreshing' : 'refresh');
    const times = Object.values(readState().cache).map(item => item.fetchedAt);
    $('update-time').textContent = times.length ? text('lastRefresh', { date: dateLabel(lang, Math.min(...times)) }) : text('neverRefreshed');
    const videos = filteredVideos().filter(v => !(readLibrary().hidden || []).includes(v.id));
    const shown = videos.slice(0, pageSize);
    $('feed-count').textContent = text('results', { shown: number(lang, shown.length), total: number(lang, videos.length) });
    const portrait = channelMode && $('channel-kind').value === 'shorts';
    $('videos').classList.toggle('shorts-grid', portrait);
    $('videos').replaceChildren(...shown.map(video => createVideoCard(video, { portrait, language: lang, library: readLibrary(), metadata: readMetadata(), areas: readCatalog().areas, onPlay: play, onToggle: toggleSaved, thumbnailStyle: readPreferences().thumbnail, onHide: confirmHide, onSelect: selectVideo, selected: isSelected(video.id) })));
    $('empty').hidden = shown.length > 0;
    $('empty-title').textContent = text(isLoading() && !channelMode ? 'loading' : 'empty');
    $('empty-copy').textContent = text(channelMode ? 'emptyChannels' : readMode() === 'discover' ? 'emptyDiscover' : 'emptyLibrary');
    $('empty-add').hidden = !channelMode;
    $('reset-filters').hidden = channelMode || isLoading();
    $('show-more').hidden = videos.length <= pageSize;
    $('fetch-durations').hidden = channelMode || !readCatalog().videos.length;
    $('fetch-durations').disabled = isBusy() || isStorageBlocked();
    $('fetch-durations').textContent = text(isBusy() ? 'loadingDurations' : 'fetchDurations');
    $('metadata-help').hidden = channelMode || $('duration').value === 'all';
    renderPanelTools();
    renderNotice();
  }
  function resetFilters() {
    $('search').value = ''; $('area').value = ''; $('category').value = ''; $('duration').value = 'all'; $('hide-watched').checked = false;
    pageSize = 18; renderFilters(); render();
  }
  for (const id of ['area', 'category', 'duration', 'sort', 'hide-watched', 'channel-filter', 'channel-name-filter', 'channel-kind']) bind(id, 'change', () => { pageSize = 18; if (id === 'area') $('category').value = ''; if (id === 'area' || id === 'channel-filter') renderFilters(); render(); });
  bind('search', 'input', () => { pageSize = 18; render(); });
  bind('reset-filters', 'click', resetFilters);
  bind('show-more', 'click', () => { pageSize += 18; render(); });
  bind('expiry', 'change', () => { const next = { ...readState(), days: Number($('expiry').value) }; commitState(next); render(); });
  function resetPageSize() { pageSize = 18; }
  return { render, renderFilters, filteredVideos, resetFilters, getPageSize: () => pageSize, resetPageSize };
}
