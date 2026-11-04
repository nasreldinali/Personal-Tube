import { byId as $, element } from './dom.js';
import { createVideoCard } from './feed-view.js';
import { t, number } from '../locale.js';
import { parseRecommendationSettings } from '../domain/recommendations.js';
import { parseCommunityImport, mergeCollections, communitySources } from '../domain/community.js';
import { AppError } from '../domain/errors.js';
import { createCommunityFeed } from './community-feed.js';
import { recommendVideos } from '../services/recommendations.js';
import { analyzeYouTubeComments } from '../data/youtube-analysis.js';

export function createDiscoveryPanel({ context, saveDiscovery, setBusy, client, openSettings, onPlay, onToggle, onFollow, onError, confirm, changeMode }) {
  const communityFeed = createCommunityFeed({ context, onPlay, onToggle, onError, setBusy });
  let results = [];
  let resultSummary = null;
  let status = '';
  let statusValues = {};
  let pageSize = 24;
  let generation = 0;
  let recommendationStage = '';
  const text = (key, values) => t(context().language, key, values);
  function announce(key, values = {}) { status = key; statusValues = values; render(); }
  function bind(id, event, action) {
    $(id).addEventListener(event, async e => { try { await action(e); } catch (error) { onError(error); } });
  }
  function hydrate() {
    const settings = context().discovery.recommendations;
    $('rec-query').value = settings.query; $('rec-language').value = settings.language;
    $('rec-min-views').value = settings.minViews; $('rec-min-likes').value = settings.minLikes;
    $('rec-sort').value = settings.sort;
  }
  function communityVideos() {
    const found = new Map();
    for (const collection of context().discovery.collections.filter(c => c.enabled)) for (const record of collection.videos) {
      if (found.has(record.id)) continue;
      found.set(record.id, { ...record, categories: [], tags: [record.topic], summary: '', source: collection.source, sourceName: collection.name, channelCategory: record.topic || collection.name });
    }
    const query = context().query.trim().toLocaleLowerCase();
    return [...found.values()].filter(video => !query || `${video.title} ${video.channelTitle} ${video.topic} ${video.sourceName}`.toLocaleLowerCase().includes(query));
  }
  function renderCollections() {
    $('community-collections').replaceChildren(...context().discovery.collections.map(collection => {
      const row = element('div', 'collection-row');
      const label = element('label', 'check');
      const checkbox = element('input'); checkbox.type = 'checkbox'; checkbox.checked = collection.enabled; checkbox.disabled = context().busy;
      checkbox.setAttribute('aria-label', `${text('collectionEnabled')}: ${collection.name}`);
      checkbox.addEventListener('change', () => {
        try { saveDiscovery({ ...context().discovery, collections: context().discovery.collections.map(c => c.source === collection.source ? { ...c, enabled: checkbox.checked } : c) }); render(); }
        catch (error) { checkbox.checked = collection.enabled; onError(error); }
      });
      label.append(checkbox, element('span', '', `${collection.name} · ${number(context().language, collection.videos.length)}`));
      const remove = element('button', 'text-button', text('removeCollection')); remove.disabled = context().busy;
      remove.addEventListener('click', () => confirm('confirmCollection', () => {
        if (context().busy) throw new AppError('busy');
        saveDiscovery({ ...context().discovery, collections: context().discovery.collections.filter(c => c.source !== collection.source) }); render();
      }));
      row.append(label, remove); return row;
    }));
  }
  function card(video, community) {
    const c = context();
    const node = createVideoCard(video, { language: c.language, library: c.library, metadata: c.metadata, areas: c.areas, thumbnailStyle:c.thumbnailStyle, onHide:c.onHide, onSelect:c.onSelect, selected:c.selectedVideos.has(video.id), onPlay, onToggle: (field, id) => onToggle(field, id, video) });
    const evidence = element('div', 'discovery-evidence');
    if (community) {
      evidence.append(element('p', '', text('communityReference', { source: communitySources[video.source].name })));
      if (video.sourceUrl) { const link = element('a', '', text('openReference')); link.href = video.sourceUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; evidence.append(link); }
    } else {
      evidence.append(element('p', '', `${text('viewsLabel', { count: number(c.language, video.views) })} · ${text('likesLabel', { count: number(c.language, video.likes) })}`));
      evidence.append(element('p', 'muted', video.audioLanguage ? `${text('audioLanguage')}: ${video.audioLanguage}` : text('unknownAudio')));
      evidence.append(element('p', 'evidence-label', text('positiveEvidence', { positive: video.evidence.positive, analyzed: video.evidence.analyzed, critical: video.evidence.critical })));
      if (video.evidence?.comments.length) {
        const details = element('details');
        details.open = true;
        details.append(element('summary', '', text('positiveQuotes')));
        for (const comment of video.evidence.comments.slice(0,5)) {
          const quote = element('blockquote', '', comment.quote); quote.dir = 'auto';
          const link = element('a', '', `${text('commentOnYouTube')} · ${text('commentLikes', { count: number(c.language, comment.likes) })}`);
          link.href = `https://www.youtube.com/watch?v=${video.id}&lc=${comment.id}`; link.target = '_blank'; link.rel = 'noopener noreferrer';
          details.append(quote, link);
        }
        evidence.append(details);
      } else evidence.append(element('p', 'muted', text('commentsUnavailable')));
      const follow = element('button', 'd-btn d-btn-secondary', text('followRecommended'));
      follow.addEventListener('click', () => onFollow(video)); evidence.append(follow);
    }
    node.append(evidence); return node;
  }
  function render() {
    const c = context();
    const community = c.mode === 'community';
    const visible = community || c.mode === 'recommendations';
    $('discovery-panel').hidden = !visible;
    if (!visible) return;
    $('discovery-title').textContent = text(community ? 'communityTitle' : 'recommendationsTitle');
    $('discovery-description').textContent = text(community ? 'communityDescription' : 'recommendationsDescription');
    $('recommendation-controls').hidden = community; $('community-controls').hidden = !community;
    $('recommendation-search').disabled = c.busy;
    $('recommendation-search').textContent = text(c.busy ? recommendationStage || 'findingRecommendations' : 'findRecommendations');
    $('community-import').disabled = c.busy;
    if (community) {
      const source = $('community-source').value;
      $('community-source-link').href = communitySources[source].url;
      $('source-help').textContent = text(source === 'reddit' ? 'sourceReddit' : 'sourceGeneral');
      renderCollections(); communityFeed.render();
    }
    const videos = community ? communityVideos() : results;
    $('discovery-videos').replaceChildren(...videos.filter(v=>!(c.library.hidden||[]).includes(v.id)).slice(0,community ? pageSize : 8).map(video => card(video, community)));
    $('community-more').hidden = !community || videos.length <= pageSize;
    let message = community ? videos.length ? text('communityCount', { count: number(c.language, videos.length) }) : text('communityEmpty') : resultSummary ? text('recommendationResults', { shown: number(c.language, results.length), inspected: number(c.language, resultSummary.inspected), analyzed: number(c.language, resultSummary.analyzedComments), reviewed: number(c.language, resultSummary.reviewed), unavailable: number(c.language, resultSummary.commentsUnavailable) }) : text(recommendationStage || 'recommendationIdle');
    if (status && community) message = text(status, statusValues);
    $('discovery-status').textContent = message; $('discovery-status').hidden = community && !videos.length && !status;
  }
  bind('recommendation-form', 'submit', async event => {
    event.preventDefault(); if (context().busy) return;
    const settings = parseRecommendationSettings({ version: 1, query: $('rec-query').value, language: $('rec-language').value, minViews: Number($('rec-min-views').value), minLikes: Number($('rec-min-likes').value), sort: $('rec-sort').value, includeComments: true });
    if (!settings.query) throw new AppError('recommendationTopicRequired');
    saveDiscovery({ ...context().discovery, recommendations: settings });
    if (!context().hasKey) { openSettings(); return; }
    const started = ++generation;
    results = []; resultSummary = null; recommendationStage = 'findingRecommendations'; setBusy(true); render();
    try {
      const response = await recommendVideos(client(), settings, analyzeYouTubeComments, stage => { if (started === generation && !context().stale) { recommendationStage = stage; render(); } });
      if (started !== generation || context().stale) return;
      results = response.videos; resultSummary = response;
    } finally { recommendationStage = ''; setBusy(false); render(); }
  });
  bind('community-source', 'change', () => { status = ''; render(); });
  bind('community-more', 'click', () => { pageSize += 24; render(); });
  bind('community-form', 'submit', async event => {
    event.preventDefault(); if (context().busy) return;
    const file = $('community-file').files[0];
    if (!file || !/\.(json|jsonl)$/i.test(file.name) || file.size > 2000000) throw new AppError('invalidCommunity');
    const source = $('community-source').value; const name = $('community-name').value;
    const started = ++generation;
    setBusy(true);
    try {
      const collection = parseCommunityImport(await file.text(), source, name);
      if (started !== generation || context().stale) throw new AppError('storageConflict');
      saveDiscovery({ ...context().discovery, collections: mergeCollections(context().discovery.collections, collection) });
      $('community-file').value = ''; announce('communityLoaded', { count: number(context().language, collection.videos.length) });
    } finally { setBusy(false); render(); }
  });
  bind('community-example', 'click', () => {
    const content = { format: 'personaltube-community', version: 1, source: $('community-source').value, videos: [{ url: 'https://www.youtube.com/watch?v=REPLACE_WITH_VIDEO_ID', title: 'Replace with the video title', channelTitle: 'Replace with the channel name', topic: 'Your topic', sourceUrl: '' }] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));
    const link = element('a'); link.href = url; link.download = 'personaltube-community-example.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  return {
    render, hydrate,
    clearCommunity:()=>communityFeed.clear(),
    reset() { communityFeed.reset(); generation++; results = []; resultSummary = null; status = ''; hydrate(); render(); },
    visibleVideos() { return context().mode==='community' ? [...communityFeed.videos(),...communityVideos()] : results; },
    videos() { return [...results, ...communityVideos(), ...communityFeed.videos()]; },
    similar(video) {
      changeMode('recommendations');
      $('rec-query').value = (video.categories?.[0]?.name || video.tags?.[0] || video.title).slice(0,200);
      $('rec-query').focus();
    },
  };
}
