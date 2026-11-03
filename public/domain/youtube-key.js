import { AppError } from './errors.js';

export function validateYouTubeKey(value) {
  if (typeof value !== 'string' || value.length > 250 || !/^[A-Za-z0-9_-]+$/.test(value.trim())) throw new AppError('keyFormat');
  return value.trim();
}
