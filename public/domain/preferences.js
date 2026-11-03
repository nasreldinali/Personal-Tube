import { AppError } from './errors.js';

export function parsePreferences(value) {
  if (value === null) return { version: 1, language: 'en', theme: 'auto' };
  if (value?.version !== 1 || !['en', 'ar'].includes(value.language) || !['auto', 'light', 'dark'].includes(value.theme)) throw new AppError('invalidPreferences');
  return { version: 1, language: value.language, theme: value.theme };
}

export function preferenceAttributes(value) {
  const preferences = parsePreferences(value);
  return { lang: preferences.language, dir: preferences.language === 'ar' ? 'rtl' : 'ltr', theme: preferences.theme === 'auto' ? null : preferences.theme };
}
