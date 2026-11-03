import { channelPattern, videoPattern } from '../config.js';
import { AppError } from './errors.js';
import { parsePreferences } from './preferences.js';
import { parseDiscovery } from './discovery.js';
import { safeImage } from './feed.js';

export function emptyLibrary() { return { version: 1, later: [], watched: [] }; }

export function parseLibrary(value) {
  if (value === null) return emptyLibrary();
  if (value?.version !== 1) throw new AppError('invalidLibrary');
  const result = emptyLibrary();
  for (const field of ['later', 'watched']) {
    if (!Array.isArray(value[field]) || value[field].length > 20000 || value[field].some(id => typeof id !== 'string' || !videoPattern.test(id))) throw new AppError('invalidLibrary');
    result[field] = [...new Set(value[field])];
  }
  return result;
}

export function toggleLibrary(library, field, id) {
  if (!['later', 'watched'].includes(field) || !videoPattern.test(id)) throw new AppError('invalidLibrary');
  const result = parseLibrary(library);
  result[field] = result[field].includes(id) ? result[field].filter(value => value !== id) : [...result[field], id];
  return parseLibrary(result);
}

export function validateChannels(channels) {
  if (!Array.isArray(channels) || channels.length > 200) throw new AppError('invalidBackup');
  const seen = new Set();
  return channels.map(c => {
    if (!c || typeof c.id !== 'string' || !channelPattern.test(c.id) || typeof c.title !== 'string' || c.title.length > 250 || typeof c.uploads !== 'string' || !/^[\w-]{2,100}$/.test(c.uploads) || typeof c.category !== 'string' || c.category.length > 60 || seen.has(c.id)) throw new AppError('invalidBackup');
    seen.add(c.id);
    return { id: c.id, title: c.title, uploads: c.uploads, category: c.category, image: safeImage(c.image) };
  });
}

export function parseBackup(value) {
  if (![1, 2].includes(value?.version) || (value.version === 2 && !value.discovery) || value.format !== 'personaltube-backup' || ![1, 3, 7].includes(value.days) || !value.preferences || !value.library) throw new AppError('invalidBackup');
  return { version: value.version, discovery: parseDiscovery(value.version === 2 ? value.discovery : null), format: 'personaltube-backup', days: value.days, channels: validateChannels(value.channels), preferences: parsePreferences(value.preferences), library: parseLibrary(value.library) };
}

export function validateBackupFile(file) {
  if (!file || typeof file.name !== 'string' || !/\.json$/i.test(file.name) || !Number.isSafeInteger(file.size) || file.size < 0 || file.size > 2000000) throw new AppError('invalidBackup');
  return true;
}

export function validateBackupBudget(value) {
  if (new TextEncoder().encode(JSON.stringify(value, null, 2)).length > 2000000) throw new AppError('backupTooLarge');
  return value;
}
