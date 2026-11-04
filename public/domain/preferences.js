import { AppError } from './errors.js';
import { CACHE_TTL } from '../config.js';

export const REFRESH_INTERVALS = [15, 30, 60, 180, 360, 720, 1440];
export function refreshSettings(value = {}) {
  const mode = value.refreshMode === undefined ? 'auto' : value.refreshMode;
  const minutes = value.refreshMinutes === undefined ? CACHE_TTL / 60000 : value.refreshMinutes;
  if (!['auto', 'manual'].includes(mode) || !REFRESH_INTERVALS.includes(minutes)) throw new AppError('invalidPreferences');
  return { mode, minutes, intervalMs: minutes * 60000 };
}
export function automaticRefreshDue(preferences, lastAttempt, now, visible = true) {
  const { mode, intervalMs } = refreshSettings(preferences);
  return visible && mode === 'auto' && (lastAttempt === null || now - lastAttempt >= intervalMs);
}

export function parsePreferences(value) {
  if (value === null) return { version: 1, language: 'en', theme: 'auto' };
  if (value?.version !== 1 || !['en', 'ar'].includes(value.language) || !['auto', 'light', 'dark'].includes(value.theme)) throw new AppError('invalidPreferences');
  if (value.thumbnail !== undefined && !['original','frame'].includes(value.thumbnail)) throw new AppError('invalidPreferences');
  refreshSettings(value);
  if (value.setupDone !== undefined && typeof value.setupDone !== 'boolean') throw new AppError('invalidPreferences');
  return { version: 1, language: value.language, theme: value.theme, ...(value.thumbnail !== undefined ? {thumbnail:value.thumbnail} : {}), ...(value.setupDone !== undefined ? {setupDone:value.setupDone} : {}), ...(value.refreshMode !== undefined ? {refreshMode:value.refreshMode} : {}), ...(value.refreshMinutes !== undefined ? {refreshMinutes:value.refreshMinutes} : {}) };
}

export function preferenceAttributes(value) {
  const preferences = parsePreferences(value);
  return { lang: preferences.language, dir: preferences.language === 'ar' ? 'rtl' : 'ltr', theme: preferences.theme === 'auto' ? null : preferences.theme };
}
