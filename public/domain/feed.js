import { AppError } from './errors.js';
import { DAY, channelPattern } from '../config.js';

export const emptyState = () => ({ version: 1, days: 7, channels: [], cache: {} });

export function parseChannel(input) {
  if (typeof input !== 'string' || input.length > 500) throw new AppError('invalidChannel');
  let value = input.trim();
  if (channelPattern.test(value)) return { id: value };
  if (/^(https?:\/\/|(?:www\.|m\.)?youtube\.com\/)/i.test(value)) {
    let url;
    try { url = new URL(/^https?:/i.test(value) ? value : `https://${value}`); }
    catch { throw new AppError('invalidChannel'); }
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname) || url.username || url.password) {
      throw new AppError('invalidChannel');
    }
    let parts;
    try { parts = decodeURIComponent(url.pathname).split('/').filter(Boolean); }
    catch { throw new AppError('invalidChannel'); }
    if (parts[0] === 'channel' && channelPattern.test(parts[1])) return { id: parts[1] };
    if (parts[0] === 'user' && parts[1]) return { forUsername: parts[1] };
    if (parts[0]?.startsWith('@')) value = parts[0];
    else throw new AppError('invalidChannel');
  }
  if (/^@[\p{L}\p{N}_.·\-]{3,30}$/u.test(value)) return { forHandle: value };
  throw new AppError('invalidChannel');
}

export function withinWindow(publishedAt, days, now) {
  const age = now - Date.parse(publishedAt);
  return [1, 3, 7].includes(days) && Number.isFinite(age) && age >= 0 && age <= days * DAY;
}

export function visibleVideos(state, { category = '', query = '', now } = {}) {
  return state.channels.flatMap(channel => {
    const video = state.cache[channel.id]?.video;
    if (!video || !withinWindow(video.publishedAt, state.days, now)) return [];
    if (category && channel.category !== category) return [];
    if (query && !`${video.title} ${channel.title}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) return [];
    return [{ ...video, channel }];
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export function safeImage(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && ['i.ytimg.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com'].includes(u.hostname) ? u.href : '';
  } catch { return ''; }
}

export function durationLabel(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m || !m.slice(1).some(Boolean)) return '';
  const [, h, min, sec] = m;
  return h ? `${h}:${String(min || 0).padStart(2, '0')}:${String(sec || 0).padStart(2, '0')}` : `${min || 0}:${String(sec || 0).padStart(2, '0')}`;
}
