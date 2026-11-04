import { refreshSettings } from '../domain/preferences.js';

export async function refreshChannels(state, client, { force = false, now, preferences = {}, shouldContinue = () => true, onProgress = () => {} } = {}) {
  const errors = [];
  const { mode, intervalMs } = refreshSettings(preferences);
  if (!force && mode === 'manual') return errors;
  // Serial calls bound quota use and keep partial successes if one channel fails.
  for (const channel of [...state.channels]) {
    if (!shouldContinue()) break;
    const previous = state.cache[channel.id];
    if (!force && previous && now - previous.fetchedAt >= 0 && now - previous.fetchedAt < intervalMs && Array.isArray(previous.videos)) continue;
    try {
      const result = await client.recent(channel, now);
      if (state.channels.some(c => c.id === channel.id)) state.cache[channel.id] = { ...result, fetchedAt: now };
    } catch (error) { errors.push({ title: channel.title, message: error.message, code: error.code }); }
    onProgress();
  }
  return errors;
}
