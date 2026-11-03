export function applyRefreshResult(current, fetched, startedRevision, currentRevision) {
  if (startedRevision !== currentRevision) return { applied: false, state: current };
  const cache = Object.fromEntries(current.channels.filter(channel => fetched.cache[channel.id]).map(channel => [channel.id, fetched.cache[channel.id]]));
  return { applied: true, state: { ...current, cache } };
}
