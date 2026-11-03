import { videoPattern } from '../config.js';
import { AppError } from './errors.js';

export function normalizeCatalog(rows) {
  if (!Array.isArray(rows) || rows.length > 25000) throw new AppError('invalidCatalog');
  const seen = new Set();
  return rows.map(row => {
    if (!videoPattern.test(row?.vid) || seen.has(row.vid) || typeof row.title !== 'string' || typeof row.channel !== 'string') throw new AppError('invalidCatalog');
    seen.add(row.vid);
    return {
      id: row.vid, title: row.title, channelTitle: row.channel,
      summary: String(row.summary || ''), why: String(row.why_hn || ''),
      categories: Array.isArray(row.categories) ? row.categories.map(c => ({ id: String(c.id), name: String(c.name), area: String(c.area) })) : [],
      tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
      score: Number.isFinite(row.score) ? row.score : 0,
      recommenders: Math.max(0, Number(row.hn?.recommenders) || 0),
      shelfLife: row.shelf_life || 'evergreen',
      quote: typeof row.quote?.text === 'string' && Number.isSafeInteger(row.quote.hn_comment_id) ? { text: row.quote.text, commentId: row.quote.hn_comment_id } : null,
    };
  });
}

export function durationSeconds(value) {
  const parts = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value || '');
  return parts && parts.slice(1).some(Boolean) ? Number(parts[1] || 0) * 3600 + Number(parts[2] || 0) * 60 + Number(parts[3] || 0) : null;
}

function dailyRank(id, day) {
  let hash = 2166136261;
  for (const char of `${day}:${id}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

export function selectCatalog(videos, { mode = 'discover', query = '', area = '', category = '', duration = 'all', sort = 'daily', day = '', library = {}, metadata = {}, hideWatched = false } = {}) {
  const search = query.trim().toLocaleLowerCase();
  const watched = new Set(library.watched || []);
  const later = new Set(library.later || []);
  const result = videos.filter(v => {
    if (mode === 'later' && !later.has(v.id)) return false;
    if (mode === 'watched' && !watched.has(v.id)) return false;
    if (mode === 'discover' && (v.shelfLife === 'news' || v.recommenders < 1)) return false;
    if (hideWatched && watched.has(v.id)) return false;
    if (area && !v.categories.some(c => c.area === area)) return false;
    if (category && !v.categories.some(c => c.id === category)) return false;
    if (search && !`${v.title} ${v.channelTitle} ${v.summary} ${v.tags.join(' ')} ${v.categories.map(c => c.name).join(' ')}`.toLocaleLowerCase().includes(search)) return false;
    if (metadata[v.id]?.unavailable) return false;
    const seconds = durationSeconds(metadata[v.id]?.duration);
    if (duration !== 'all' && seconds === null) return false;
    if (duration === 'short' && seconds >= 1200) return false;
    if (duration === 'medium' && (seconds < 1200 || seconds >= 3600)) return false;
    if (duration === 'long' && seconds < 3600) return false;
    return true;
  });
  return result.sort((a, b) => sort === 'top' ? b.score - a.score || a.id.localeCompare(b.id) : dailyRank(a.id, day) - dailyRank(b.id, day));
}
