import { AppError } from './errors.js';

export function parsePreferences(value) {
  if (value === null) return { version: 1, language: 'en', theme: 'auto' };
  if (value?.version !== 1 || !['en', 'ar'].includes(value.language) || !['auto', 'light', 'dark'].includes(value.theme)) throw new AppError('invalidPreferences');
  if (value.thumbnail !== undefined && !['original','frame'].includes(value.thumbnail)) throw new AppError('invalidPreferences');
  if (value.setupDone !== undefined && typeof value.setupDone !== 'boolean') throw new AppError('invalidPreferences');
  return { version: 1, language: value.language, theme: value.theme, ...(value.thumbnail !== undefined ? {thumbnail:value.thumbnail} : {}), ...(value.setupDone !== undefined ? {setupDone:value.setupDone} : {}) };
}

export function preferenceAttributes(value) {
  const preferences = parsePreferences(value);
  return { lang: preferences.language, dir: preferences.language === 'ar' ? 'rtl' : 'ltr', theme: preferences.theme === 'auto' ? null : preferences.theme };
}
