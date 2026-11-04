import { videoPattern } from '../config.js';
import { safeImage } from './feed.js';
import { parseLibrary } from './library.js';
import { AppError } from './errors.js';

export function hideVideos(library, ids) {
  if (!Array.isArray(ids) || ids.length > 20000 || ids.some(id => typeof id !== 'string' || !videoPattern.test(id))) throw new AppError('invalidLibrary');
  return parseLibrary({ ...library, hidden: [...new Set([...(library.hidden || []), ...ids])] });
}
export function removeCategory(state, category) {
  if (typeof category !== 'string' || !category || category.length > 60) throw new AppError('invalidBackup');
  return { ...state, channels: state.channels.map(channel => channel.category === category ? { ...channel, category: '' } : channel) };
}
export function viewFromHash(hash) {
  const view = typeof hash === 'string' ? hash.slice(1) : '';
  return ['discover','channels','later','watched','recommendations','community'].includes(view) ? view : 'discover';
}
export function thumbnailURL(video, style) {
  if (!videoPattern.test(video.id)) throw new AppError('invalidVideo');
  return style === 'original' ? safeImage(video.thumbnail) || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : `https://i.ytimg.com/vi/${video.id}/hq2.jpg`;
}
