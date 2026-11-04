import { CACHE_TTL } from '../config.js';

export async function refreshChannels(state, client, { force = false, now, onProgress = () => {} } = {}) {
  const errors = [];
  // Serial calls bound quota use and keep partial successes if one channel fails.
  for (const channel of [...state.channels]) {
    const previous = state.cache[channel.id];
    if (!force && previous && now - previous.fetchedAt >= 0 && now - previous.fetchedAt < CACHE_TTL && Array.isArray(previous.videos)) continue;
    try {
      const result = await client.recent(channel, now);
      if (state.channels.some(c => c.id === channel.id)) state.cache[channel.id] = { ...result, fetchedAt: now };
    } catch (error) { errors.push({ title: channel.title, message: error.message, code: error.code }); }
    onProgress();
  }
  return errors;
}
