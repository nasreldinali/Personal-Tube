import { STORAGE_KEY, KEY_STORAGE, videoPattern, DAY } from '../config.js';
import { readState } from './browser-state.js';
import { emptyState } from '../domain/feed.js';
import { parsePreferences } from '../domain/preferences.js';
import { parseLibrary, parseBackup, validateChannels, validateBackupBudget } from '../domain/library.js';
import { parseDiscovery } from '../domain/discovery.js';
import { AppError } from '../domain/errors.js';

export const PREFERENCE_KEY = 'personaltube.preferences.v1';
export const LIBRARY_KEY = 'personaltube.library.v1';
const DISCOVERY_KEY = 'personaltube.discovery.v1';
const METADATA_KEY = 'personaltube.metadata.v1';

export class BrowserStore {
  constructor(local, session) { this.local = local; this.session = session; this.observed = new Map(); }
  readJSON(key) { const raw = this.local.getItem(key); this.observed.set(key, raw); return raw === null ? null : JSON.parse(raw); }
  checkBackupBudget(key, value) {
    const read = name => name === key ? value : JSON.parse(this.local.getItem(name) || 'null');
    const state = read(STORAGE_KEY) || emptyState();
    return validateBackupBudget({ version: 2, format: 'personaltube-backup', days: state.days, channels: state.channels, preferences: parsePreferences(read(PREFERENCE_KEY)), library: parseLibrary(read(LIBRARY_KEY)), discovery: parseDiscovery(read(DISCOVERY_KEY)) });
  }
  writeJSON(key, value, checkBudget = true) {
    if (this.observed.has(key) && this.local.getItem(key) !== this.observed.get(key)) throw new AppError('storageConflict');
    if (checkBudget && [STORAGE_KEY, PREFERENCE_KEY, LIBRARY_KEY, DISCOVERY_KEY].includes(key)) this.checkBackupBudget(key, value);
    const raw = JSON.stringify(value);
    this.local.setItem(key, raw); this.observed.set(key, raw);
  }
  readState(now) {
    const raw = this.local.getItem(STORAGE_KEY);
    const state = readState({ getItem: () => raw }, now);
    this.observed.set(STORAGE_KEY, raw);
    if (raw && raw !== JSON.stringify(state)) this.writeState(state);
    return state;
  }
  writeState(state) {
    if (state.version !== 1 || ![1, 3, 7].includes(state.days)) throw new AppError('invalidBackup');
    validateChannels(state.channels);
    this.writeJSON(STORAGE_KEY, state);
  }
  readPreferences() { return parsePreferences(this.readJSON(PREFERENCE_KEY)); }
  writePreferences(value) { this.writeJSON(PREFERENCE_KEY, parsePreferences(value)); }
  readLibrary() { return parseLibrary(this.readJSON(LIBRARY_KEY)); }
  writeLibrary(value) { this.writeJSON(LIBRARY_KEY, parseLibrary(value)); }
  readDiscovery() { return parseDiscovery(this.readJSON(DISCOVERY_KEY)); }
  writeDiscovery(value) { this.writeJSON(DISCOVERY_KEY, parseDiscovery(value)); }
  readKey() { return this.local.getItem(KEY_STORAGE) || this.session.getItem(KEY_STORAGE) || ''; }
  remembersKey() { return Boolean(this.local.getItem(KEY_STORAGE)); }
  saveKey(value, remember) {
    if (typeof value !== 'string' || value.length > 250 || !value.trim()) throw new AppError('invalidKey');
    (remember ? this.local : this.session).setItem(KEY_STORAGE, value.trim());
    (remember ? this.session : this.local).removeItem(KEY_STORAGE);
  }
  forgetKey() { this.local.removeItem(KEY_STORAGE); this.session.removeItem(KEY_STORAGE); }
  readMetadata(now) {
    const data = this.readJSON(METADATA_KEY);
    if (data === null) return {};
    if (data.version !== 1 || !data.videos || typeof data.videos !== 'object' || Array.isArray(data.videos)) throw new AppError('invalidMetadata');
    const videos = Object.fromEntries(Object.entries(data.videos).filter(([id, v]) => videoPattern.test(id) && v && Number.isFinite(v.fetchedAt) && now >= v.fetchedAt && now - v.fetchedAt < DAY));
    if (Object.keys(videos).length !== Object.keys(data.videos).length) this.writeMetadata(videos);
    return videos;
  }
  writeMetadata(videos) { this.writeJSON(METADATA_KEY, { version: 1, videos }); }
  exportData(now) {
    const state = this.readState(now);
    return validateBackupBudget({ version: 2, discovery: this.readDiscovery(), format: 'personaltube-backup', days: state.days, channels: state.channels, preferences: this.readPreferences(), library: this.readLibrary() });
  }
  importData(text, now) {
    if (typeof text !== 'string' || new TextEncoder().encode(text).length > 2000000 || !Number.isFinite(now)) throw new AppError('invalidBackup');
    let value;
    try { value = parseBackup(JSON.parse(text)); } catch { throw new AppError('invalidBackup'); }
    validateBackupBudget({ ...value, version: 2 });
    const keys = [STORAGE_KEY, PREFERENCE_KEY, LIBRARY_KEY, DISCOVERY_KEY];
    const old = keys.map(key => this.local.getItem(key));
    try {
      this.writeJSON(STORAGE_KEY, { ...emptyState(), days: value.days, channels: value.channels }, false);
      this.writeJSON(PREFERENCE_KEY, value.preferences, false); this.writeJSON(LIBRARY_KEY, value.library, false); this.writeJSON(DISCOVERY_KEY, value.discovery, false);
    } catch {
      try { keys.forEach((key, i) => { if (old[i] === null) this.local.removeItem(key); else this.local.setItem(key, old[i]); this.observed.set(key, old[i]); }); }
      catch { throw new AppError('restoreFailed'); }
      throw new AppError('storageWrite');
    }
  }
  clearPersonalData() {
    for (const key of [STORAGE_KEY, PREFERENCE_KEY, LIBRARY_KEY, METADATA_KEY, KEY_STORAGE, DISCOVERY_KEY]) { this.local.removeItem(key); this.observed.set(key, null); }
    this.session.removeItem(KEY_STORAGE);
  }
}
