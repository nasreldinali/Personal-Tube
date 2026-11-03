import { AppError } from './errors.js';
import { parseRecommendationSettings } from './recommendations.js';
import { validateCollections } from './community.js';

export function parseDiscovery(value) {
  if (value === null) return { version: 1, collapsed: false, recommendations: parseRecommendationSettings(null), collections: [] };
  if (value?.version !== 1 || typeof value.collapsed !== 'boolean' || !value.recommendations) throw new AppError('invalidDiscovery');
  return { version: 1, collapsed: value.collapsed, recommendations: parseRecommendationSettings(value.recommendations), collections: validateCollections(value.collections) };
}
