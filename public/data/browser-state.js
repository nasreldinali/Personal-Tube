import { DAY, STORAGE_KEY, channelPattern, videoPattern } from '../config.js';
import { emptyState, safeImage } from '../domain/feed.js';

export function readState(storage, now = Date.now()) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return emptyState();
  const saved = JSON.parse(raw);
  if (saved.version !== 1 || !Array.isArray(saved.channels)) throw new Error('Invalid storage');
  const state = emptyState();
  state.days = [1, 3, 7].includes(saved.days) ? saved.days : 7;
  const seen = new Set();
  for (const c of saved.channels) {
    if (typeof c?.id !== 'string' || !channelPattern.test(c.id) || typeof c.title !== 'string' || typeof c.uploads !== 'string' || !c.uploads) throw new Error('Invalid stored channel');
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    state.channels.push({ id: c.id, title: c.title, uploads: c.uploads, image: safeImage(c.image), category: String(c.category || 'عام').slice(0, 60) });
    const entry = saved.cache?.[c.id];
    if (!entry || !Number.isFinite(entry.fetchedAt) || entry.fetchedAt > now || now - entry.fetchedAt > 7 * DAY) continue;
    const v = entry.video;
    if (v === null || (videoPattern.test(v?.id) && typeof v.title === 'string' && Number.isFinite(Date.parse(v.publishedAt)))) {
      state.cache[c.id] = { fetchedAt: entry.fetchedAt, video: v };
    }
  }
  return state;
}
