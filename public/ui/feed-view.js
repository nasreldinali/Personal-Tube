import { element } from './dom.js';
import { t, number, dateLabel, areaName } from '../locale.js';
import { thumbnailURL } from '../domain/panel-actions.js';
import { durationLabel } from '../domain/feed.js';

export function createVideoCard(video, { language, library, metadata, areas, onPlay, onToggle, thumbnailStyle = 'frame', onHide, onSelect, selected = false, portrait = false }) {
  const card = element('article', portrait ? 'video-card short-card' : 'video-card'); card.dataset.videoId=video.id;
  const thumbnail = element('button', 'thumbnail');
  thumbnail.setAttribute('aria-label', t(language, 'play', { title: video.title }));
  const image = element('img');
  image.src = thumbnailURL(video, thumbnailStyle);
  image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
  image.width = 320; image.height = 180;
  thumbnail.append(image, element('span', 'play-icon', '▶'));
  const duration = durationLabel(metadata[video.id]?.duration || video.duration || '');
  if (duration) { const badge = element('span', 'duration', duration); badge.dir = 'ltr'; thumbnail.append(badge); }
  thumbnail.addEventListener('click', () => onPlay(video));
  const body = element('div', 'card-body');
  const title = element('button', 'card-title', video.title); title.dir = 'auto';
  title.addEventListener('click', () => onPlay(video));
  const channel = element('div', 'video-info', video.channelTitle); channel.dir = 'auto';
  const source = video.publishedAt ? dateLabel(language, video.publishedAt) : video.recommenders ? t(language, 'recommendationCount', { count: number(language, video.recommenders) }) : 'YouTube';
  const topic = video.categories?.[0];
  const area = areas.find(value => value.id === topic?.area);
  const topicLabel = area ? areaName(language, area.id, area.name) : video.channelCategory || t(language, 'channelSource');
  body.append(title, channel, element('div', 'video-info', source), element('div', 'video-topic', topicLabel));
  const actions = element('div', 'card-actions');
  for (const field of ['later', 'watched']) {
    const selected = library[field].includes(video.id);
    const label = field === 'later' ? selected ? 'removeLater' : 'saveLater' : selected ? 'removeWatched' : 'markWatched';
    const button = element('button', '', t(language, label));
    button.setAttribute('aria-pressed', String(selected));
    button.dataset.videoId = video.id; button.dataset.action = field;
    button.addEventListener('click', () => onToggle(field, video.id));
    actions.append(button);
  }
  if (onHide) {
    const remove = element('button', 'card-remove', t(language,'removeVideoAction')); remove.setAttribute('aria-label', t(language,'hideVideo',{title:video.title}));
    remove.addEventListener('click', () => onHide([video.id])); actions.append(remove);
  }
  if (onSelect) {
    const label = element('label','card-select'); const select = element('input'); select.type='checkbox';select.checked=selected;
    select.setAttribute('aria-label',t(language,'selectVideo',{title:video.title}));select.addEventListener('change',()=>onSelect(video.id,select.checked));
    label.title=t(language,'selectVideo',{title:video.title});label.append(select);if(portrait)label.append(element('span','',t(language,'select')));actions.append(label);
  }
  card.append(thumbnail, body, actions);
  return card;
}
