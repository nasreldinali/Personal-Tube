import { videoPattern, channelPattern } from '../config.js';
import { AppError } from './errors.js';

export const audioLanguages = ['any', 'ar', 'en', 'de', 'fr', 'es', 'pt', 'it', 'tr', 'hi', 'ja', 'ko', 'zh', 'ru'];

export function parseRecommendationSettings(value) {
  if (value === null) return { version: 1, query: '', language: 'any', minViews: 100000, minLikes: 1000, sort: 'views', includeComments: true };
  if (value?.version !== 1 || typeof value.query !== 'string' || value.query.length > 200 || !audioLanguages.includes(value.language) || !['views', 'likes'].includes(value.sort) || typeof value.includeComments !== 'boolean') throw new AppError('invalidRecommendations');
  for (const name of ['minViews', 'minLikes']) if (!Number.isSafeInteger(value[name]) || value[name] < 0 || value[name] > 1000000000000) throw new AppError('invalidRecommendations');
  return { version: 1, query: value.query.trim(), language: value.language, minViews: value.minViews, minLikes: value.minLikes, sort: value.sort, includeComments: value.includeComments };
}

function count(value) {
  if (typeof value !== 'string' || !/^\d{1,16}$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export function candidateVideos(rows, input) {
  const settings = parseRecommendationSettings(input);
  if (!Array.isArray(rows) || rows.length > 50) throw new AppError('invalidResponse');
  const seen = new Set();
  const videos = [];
  for (const row of rows) {
    const snippet = row?.snippet;
    if (typeof row?.id !== 'string' || !videoPattern.test(row.id) || seen.has(row.id) || typeof snippet?.channelId !== 'string' || !channelPattern.test(snippet.channelId) || typeof snippet.title !== 'string' || snippet.title.length > 500 || row.status?.privacyStatus !== 'public' || snippet.liveBroadcastContent === 'upcoming') continue;
    const views = count(row.statistics?.viewCount);
    const likes = count(row.statistics?.likeCount);
    if (views === null || likes === null || views < settings.minViews || likes < settings.minLikes) continue;
    const language = typeof snippet.defaultAudioLanguage === 'string' ? snippet.defaultAudioLanguage.toLowerCase() : '';
    if (settings.language !== 'any' && language.split('-')[0] !== settings.language) continue;
    seen.add(row.id);
    videos.push({ id: row.id, title: snippet.title, description: typeof snippet.description === 'string' ? snippet.description.slice(0,1000) : '', channelId: snippet.channelId, channelTitle: typeof snippet.channelTitle === 'string' ? snippet.channelTitle.slice(0,250) : 'YouTube', views, likes, audioLanguage: language, embeddable: row.status.embeddable !== false, duration: typeof row.contentDetails?.duration === 'string' ? row.contentDetails.duration : '', categories: [], tags: [], summary: '', channelCategory: settings.query, evidence: null });
  }
  return videos.sort((a, b) => b[settings.sort] - a[settings.sort] || a.id.localeCompare(b.id));
}

export function commentSample(rows, creatorId = '') {
  if (!Array.isArray(rows)) throw new AppError('invalidResponse');
  const seen = new Set();
  const authors = new Set();
  const texts = new Set();
  const comments = [];
  for (const row of rows.slice(0,100)) {
    const comment = row?.snippet?.topLevelComment;
    if (typeof comment?.id !== 'string' || !/^[\w-]{1,200}$/.test(comment.id) || seen.has(comment.id) || typeof comment.snippet?.textOriginal !== 'string') continue;
    const author = comment.snippet.authorChannelId?.value;
    const text = comment.snippet.textOriginal.trim().slice(0,1000);
    const normalized = text.toLocaleLowerCase().replace(/\s+/g, ' ');
    if (!text || texts.has(normalized) || (typeof author === 'string' && (author === creatorId || authors.has(author)))) continue;
    texts.add(normalized);
    if (typeof author === 'string') authors.add(author);
    seen.add(comment.id);
    comments.push({ id: comment.id, text, likes: Number.isSafeInteger(comment.snippet.likeCount) && comment.snippet.likeCount >= 0 ? comment.snippet.likeCount : 0 });
  }
  const selected = comments.length <= 20 ? comments : [
    ...comments.slice(0,5),
    ...Array.from({length:15},(_,i) => comments[5 + Math.floor(i * (comments.length - 6) / 14)]),
  ];
  selected.sort((a,b) => b.likes - a.likes);
  return { sampled: selected.length, comments: selected };
}
